from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Product(Base):
    __tablename__ = "PRODUCTS"
    __table_args__ = (Index("IX_PRODUCTS_IsActive_Category", "IsActive", "Category"),)

    id: Mapped[int] = mapped_column("ProductId", Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column("Name", String(200), nullable=False)
    category: Mapped[str] = mapped_column("Category", String(100), nullable=False)
    brand: Mapped[str | None] = mapped_column("Brand", String(100))
    unit_cost: Mapped[float] = mapped_column("UnitCost", Numeric(19, 4), nullable=False)
    normal_price: Mapped[float] = mapped_column("NormalPrice", Numeric(19, 4), nullable=False)
    is_active: Mapped[bool] = mapped_column("IsActive", Boolean, nullable=False, default=True)
    is_development_seed: Mapped[bool] = mapped_column("IsDevelopmentSeed", Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column("CreatedAt", DateTime, nullable=False, server_default=func.current_timestamp())
    updated_at: Mapped[datetime] = mapped_column("UpdatedAt", DateTime, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
