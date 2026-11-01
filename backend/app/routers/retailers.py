from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.dependencies.database import get_db
from app.models.retailer import Retailer
from app.schemas.retailer import RetailerResponse

router = APIRouter(prefix="/api/retailers", tags=["retailers"])


@router.get("")
def list_retailers(
    page: int = Query(1, ge=1), page_size: int | None = Query(None, ge=1),
    active: bool | None = None, region: str | None = None, db: Session = Depends(get_db),
):
    size = page_size or get_settings().page_size_default
    if size > get_settings().page_size_max:
        raise HTTPException(422, detail=f"page_size must not exceed {get_settings().page_size_max}.")
    stmt, count_stmt = select(Retailer), select(func.count()).select_from(Retailer)
    if active is not None:
        stmt, count_stmt = stmt.where(Retailer.is_active == active), count_stmt.where(Retailer.is_active == active)
    if region:
        stmt, count_stmt = stmt.where(Retailer.region == region), count_stmt.where(Retailer.region == region)
    try:
        total = db.scalar(count_stmt) or 0
        rows = db.scalars(stmt.order_by(Retailer.id).offset((page - 1) * size).limit(size)).all()
        return {"items": [RetailerResponse.model_validate(row).model_dump(mode="json", by_alias=True) for row in rows], "total": total, "page": page, "page_size": size}
    except SQLAlchemyError as exc:
        raise HTTPException(503, detail={"code": "database_unavailable", "message": "Retailer data is unavailable. Check the configured database connection and schema."}) from exc


@router.get("/{retailer_id}", response_model=RetailerResponse)
def get_retailer(retailer_id: int, db: Session = Depends(get_db)):
    try:
        retailer = db.get(Retailer, retailer_id)
    except SQLAlchemyError as exc:
        raise HTTPException(503, detail={"code": "database_unavailable", "message": "Retailer data is unavailable. Check the configured database connection and schema."}) from exc
    if retailer is None:
        raise HTTPException(404, detail={"code": "not_found", "message": "Retailer was not found."})
    return retailer
