from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Retailer(Base):
    __tablename__ = "RETAILERS"
    __table_args__ = (Index("IX_RETAILERS_IsActive_Region", "IsActive", "Region"),)

    id: Mapped[int] = mapped_column("RetailerId", Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column("Name", String(200), nullable=False)
    region: Mapped[str | None] = mapped_column("Region", String(100))
    account_manager: Mapped[str | None] = mapped_column("AccountManager", String(200))
    is_active: Mapped[bool] = mapped_column("IsActive", Boolean, nullable=False, default=True)
    is_development_seed: Mapped[bool] = mapped_column("IsDevelopmentSeed", Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column("CreatedAt", DateTime, nullable=False, server_default=func.current_timestamp())
    updated_at: Mapped[datetime] = mapped_column("UpdatedAt", DateTime, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
