from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Promotion(Base):
    __tablename__ = "PROMOTIONS"
    __table_args__ = (Index("IX_PROMOTIONS_CreatedAt", "CreatedAt"), Index("IX_PROMOTIONS_Verdict", "Verdict"))

    id: Mapped[int] = mapped_column("PromotionId", Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column("Name", String(150), nullable=False)
    product_id: Mapped[int] = mapped_column("ProductId", ForeignKey("PRODUCTS.ProductId"), nullable=False)
    retailer_id: Mapped[int] = mapped_column("RetailerId", ForeignKey("RETAILERS.RetailerId"), nullable=False)
    product_name: Mapped[str] = mapped_column("ProductNameSnapshot", String(200), nullable=False)
    retailer_name: Mapped[str] = mapped_column("RetailerNameSnapshot", String(200), nullable=False)
    region: Mapped[str | None] = mapped_column("RegionSnapshot", String(100))
    price: Mapped[Decimal] = mapped_column("Price", Numeric(19, 4), nullable=False)
    cost: Mapped[Decimal] = mapped_column("Cost", Numeric(19, 4), nullable=False)
    discount: Mapped[Decimal] = mapped_column("DiscountPercent", Numeric(9, 4), nullable=False)
    weeks: Mapped[int] = mapped_column("DurationWeeks", Integer, nullable=False)
    baseline: Mapped[Decimal] = mapped_column("BaselineUnitsPerWeek", Numeric(19, 4), nullable=False)
    promo: Mapped[Decimal] = mapped_column("PromoUnitsPerWeek", Numeric(19, 4), nullable=False)
    promo_price: Mapped[Decimal] = mapped_column("PromoPrice", Numeric(19, 4), nullable=False)
    normal_margin: Mapped[Decimal] = mapped_column("NormalMargin", Numeric(19, 4), nullable=False)
    promo_margin: Mapped[Decimal] = mapped_column("PromoMargin", Numeric(19, 4), nullable=False)
    extra_units_per_week: Mapped[Decimal] = mapped_column("ExtraUnitsPerWeek", Numeric(19, 4), nullable=False)
    extra_units: Mapped[Decimal] = mapped_column("ExtraUnits", Numeric(19, 4), nullable=False)
    uplift: Mapped[Decimal | None] = mapped_column("UpliftPercent", Numeric(19, 6))
    profit_without: Mapped[Decimal] = mapped_column("ProfitWithout", Numeric(19, 4), nullable=False)
    profit_with: Mapped[Decimal] = mapped_column("ProfitWith", Numeric(19, 4), nullable=False)
    extra_profit: Mapped[Decimal] = mapped_column("ExtraProfit", Numeric(19, 4), nullable=False)
    promo_cost: Mapped[Decimal] = mapped_column("PromoCost", Numeric(19, 4), nullable=False)
    roi: Mapped[Decimal | None] = mapped_column("ROI", Numeric(19, 6))
    break_even_promo_units: Mapped[Decimal | None] = mapped_column("BreakEvenPromoUnits", Numeric(19, 4))
    verdict: Mapped[str] = mapped_column("Verdict", String(16), nullable=False)
    calculation_status: Mapped[str] = mapped_column("CalculationStatus", String(32), nullable=False)
    roi_reason: Mapped[str | None] = mapped_column("ROIReason", Text)
    verdict_reason: Mapped[str] = mapped_column("VerdictReason", Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column("CreatedAt", DateTime, nullable=False, server_default=func.current_timestamp())
    updated_at: Mapped[datetime] = mapped_column("UpdatedAt", DateTime, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    product = relationship("Product")
    retailer = relationship("Retailer")
