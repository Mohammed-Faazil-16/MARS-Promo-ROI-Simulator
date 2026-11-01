from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.dependencies.database import get_db
from app.models.product import Product
from app.schemas.product import ProductResponse

router = APIRouter(prefix="/api/products", tags=["products"])


def _database_error(exc: SQLAlchemyError) -> HTTPException:
    return HTTPException(status_code=503, detail={"code": "database_unavailable", "message": "Product data is unavailable. Check the configured database connection and schema."})


@router.get("")
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(default=None, ge=1),
    active: bool | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    size = page_size or get_settings().page_size_default
    if size > get_settings().page_size_max:
        raise HTTPException(422, detail=f"page_size must not exceed {get_settings().page_size_max}.")
    stmt = select(Product)
    count_stmt = select(func.count()).select_from(Product)
    if active is not None:
        stmt, count_stmt = stmt.where(Product.is_active == active), count_stmt.where(Product.is_active == active)
    if category:
        stmt, count_stmt = stmt.where(Product.category == category), count_stmt.where(Product.category == category)
    try:
        total = db.scalar(count_stmt) or 0
        products = db.scalars(stmt.order_by(Product.id).offset((page - 1) * size).limit(size)).all()
        return {"items": [ProductResponse.model_validate(row).model_dump(mode="json", by_alias=True) for row in products], "total": total, "page": page, "page_size": size}
    except SQLAlchemyError as exc:
        raise _database_error(exc) from exc


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    try:
        product = db.get(Product, product_id)
    except SQLAlchemyError as exc:
        raise _database_error(exc) from exc
    if product is None:
        raise HTTPException(404, detail={"code": "not_found", "message": "Product was not found."})
    return product
