from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.dependencies.database import get_db
from app.models.product import Product
from app.models.promotion import Promotion
from app.models.retailer import Retailer
from app.schemas.promotion import (
    CalculationResult, PromotionCalculationResponse, PromotionInput,
    PromotionList, PromotionResponse,
)
from app.services.roi_calculator import ROIInputError, calculate_roi

router = APIRouter(prefix="/api/promotions", tags=["promotions"])


def _write_guard() -> None:
    settings = get_settings()
    if settings.database_mode == "sqlserver":
        if not settings.sqlserver_writes_enabled:
            raise HTTPException(
                status_code=403,
                detail={"code": "sqlserver_writes_disabled", "message": "SQL Server writes are disabled until the company schema and write authorization are reviewed. Set SQLSERVER_WRITES_ENABLED=true only after approval."},
            )
        # Even with the explicit write switch enabled, only proceed when read-only
        # inspection confirms the proposed application schema is present.
        from app.routers.health import database_schema_inspection

        inspection = database_schema_inspection()
        if not inspection.get("compatible"):
            raise HTTPException(
                status_code=503,
                detail={"code": "schema_incompatible", "message": "SQL Server write blocked because the expected application tables and columns are not compatible."},
            )


def _calculate(payload: PromotionInput) -> dict:
    if payload.price <= payload.cost:
        raise HTTPException(422, detail={"code": "invalid_input", "message": "Price must be greater than unit cost."})
    try:
        return calculate_roi(
            price=payload.price, cost=payload.cost, discount=payload.discount,
            weeks=payload.weeks, baseline=payload.baseline, promo=payload.promo,
        )
    except ROIInputError as exc:
        raise HTTPException(422, detail={"code": "invalid_input", "message": str(exc)}) from exc


def _get_references(db: Session, payload: PromotionInput) -> tuple[Product, Retailer]:
    product = db.get(Product, payload.product_id)
    retailer = db.get(Retailer, payload.retailer_id)
    if product is None:
        raise HTTPException(422, detail={"code": "invalid_product", "message": "The selected product does not exist."})
    if retailer is None:
        raise HTTPException(422, detail={"code": "invalid_retailer", "message": "The selected retailer does not exist."})
    if not product.is_active or not retailer.is_active:
        raise HTTPException(422, detail={"code": "inactive_reference", "message": "Select an active product and retailer."})
    return product, retailer


def _record_values(payload: PromotionInput, result: dict, product: Product, retailer: Retailer) -> dict:
    return {
        "name": payload.name,
        "product_id": product.id,
        "retailer_id": retailer.id,
        "product_name": product.name,
        "retailer_name": retailer.name,
        "region": retailer.region,
        "price": payload.price,
        "cost": payload.cost,
        "discount": payload.discount,
        "weeks": payload.weeks,
        "baseline": payload.baseline,
        "promo": payload.promo,
        "promo_price": result["promo_price"],
        "normal_margin": result["normal_margin"],
        "promo_margin": result["promo_margin"],
        "extra_units_per_week": result["extra_units_per_week"],
        "extra_units": result["extra_units"],
        "uplift": result["uplift"],
        "profit_without": result["profit_without"],
        "profit_with": result["profit_with"],
        "extra_profit": result["extra_profit"],
        "promo_cost": result["promo_cost"],
        "roi": result["roi"],
        "break_even_promo_units": result["break_even_promo_units"],
        "verdict": result["verdict"],
        "calculation_status": result["calculation_status"],
        "roi_reason": result["roi_reason"],
        "verdict_reason": result["verdict_reason"],
    }


def _as_response(record: Promotion) -> dict:
    data = PromotionResponse.model_validate({
        **{key: getattr(record, key) for key in (
            "id", "name", "product_id", "retailer_id", "region", "price", "cost",
            "discount", "weeks", "baseline", "promo", "promo_price", "normal_margin",
            "promo_margin", "extra_units_per_week", "extra_units", "uplift", "profit_without",
            "profit_with", "extra_profit", "promo_cost", "roi", "break_even_promo_units",
            "verdict", "calculation_status", "roi_reason", "verdict_reason", "created_at", "updated_at",
        )},
        "product": record.product_name,
        "retailer": record.retailer_name,
        "roi_is_measurable": record.roi is not None,
        "verdict_code": record.verdict.upper(),
        "is_calculable": True,
        "created": record.created_at.date().isoformat(),
    })
    return data


@router.post("/calculate", response_model=PromotionCalculationResponse)
def calculate_promotion(payload: PromotionInput):
    result = _calculate(payload)
    return PromotionCalculationResponse(**result)


@router.post("", response_model=PromotionResponse, status_code=201)
def create_promotion(payload: PromotionInput, db: Session = Depends(get_db)):
    _write_guard()
    result = _calculate(payload)
    try:
        product, retailer = _get_references(db, payload)
        record = Promotion(**_record_values(payload, result, product, retailer))
        db.add(record)
        db.commit()
        db.refresh(record)
        return _as_response(record)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(503, detail={"code": "database_unavailable", "message": "Promotion could not be saved. Check database connectivity and schema compatibility."}) from exc


@router.get("", response_model=PromotionList)
def list_promotions(
    page: int = Query(1, ge=1), page_size: int | None = Query(None, ge=1),
    product_id: int | None = Query(None, gt=0), retailer_id: int | None = Query(None, gt=0),
    verdict: str | None = None, created_from: datetime | None = None, created_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    size = page_size or get_settings().page_size_default
    if size > get_settings().page_size_max:
        raise HTTPException(422, detail=f"page_size must not exceed {get_settings().page_size_max}.")
    stmt, count_stmt = select(Promotion), select(func.count()).select_from(Promotion)
    conditions = []
    if product_id is not None:
        conditions.append(Promotion.product_id == product_id)
    if retailer_id is not None:
        conditions.append(Promotion.retailer_id == retailer_id)
    if verdict:
        normalized = verdict.strip().upper()
        if normalized not in {"APPROVE", "REVIEW", "REJECT"}:
            raise HTTPException(422, detail="verdict must be APPROVE, REVIEW, or REJECT.")
        conditions.append(func.upper(Promotion.verdict) == normalized)
    if created_from:
        conditions.append(Promotion.created_at >= created_from)
    if created_to:
        conditions.append(Promotion.created_at <= created_to)
    if conditions:
        stmt, count_stmt = stmt.where(*conditions), count_stmt.where(*conditions)
    try:
        total = db.scalar(count_stmt) or 0
        rows = db.scalars(stmt.order_by(Promotion.created_at.desc(), Promotion.id.desc()).offset((page - 1) * size).limit(size)).all()
        return {"items": [_as_response(row) for row in rows], "total": total, "page": page, "page_size": size}
    except SQLAlchemyError as exc:
        raise HTTPException(503, detail={"code": "database_unavailable", "message": "Promotion history is unavailable. Check database connectivity and schema compatibility."}) from exc


@router.get("/{promotion_id}", response_model=PromotionResponse)
def get_promotion(promotion_id: int, db: Session = Depends(get_db)):
    try:
        record = db.get(Promotion, promotion_id)
    except SQLAlchemyError as exc:
        raise HTTPException(503, detail={"code": "database_unavailable", "message": "Promotion data is unavailable. Check database connectivity and schema compatibility."}) from exc
    if record is None:
        raise HTTPException(404, detail={"code": "not_found", "message": "Promotion was not found."})
    return _as_response(record)


@router.put("/{promotion_id}", response_model=PromotionResponse)
def update_promotion(promotion_id: int, payload: PromotionInput, db: Session = Depends(get_db)):
    _write_guard()
    result = _calculate(payload)
    try:
        record = db.get(Promotion, promotion_id)
        if record is None:
            raise HTTPException(404, detail={"code": "not_found", "message": "Promotion was not found."})
        product, retailer = _get_references(db, payload)
        for key, value in _record_values(payload, result, product, retailer).items():
            setattr(record, key, value)
        db.commit()
        db.refresh(record)
        return _as_response(record)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(503, detail={"code": "database_unavailable", "message": "Promotion could not be updated. Check database connectivity and schema compatibility."}) from exc


@router.delete("/{promotion_id}", status_code=204)
def delete_promotion(promotion_id: int, db: Session = Depends(get_db)):
    _write_guard()
    try:
        record = db.get(Promotion, promotion_id)
        if record is None:
            raise HTTPException(404, detail={"code": "not_found", "message": "Promotion was not found."})
        db.delete(record)
        db.commit()
        return Response(status_code=204)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(503, detail={"code": "database_unavailable", "message": "Promotion could not be deleted. Check database connectivity and schema compatibility."}) from exc
