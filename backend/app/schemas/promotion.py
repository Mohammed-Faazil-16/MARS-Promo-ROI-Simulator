from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, StringConstraints, field_validator

from app.schemas.common import NumericResponse

ScenarioName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]


class PromotionInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    name: ScenarioName
    product_id: int = Field(validation_alias=AliasChoices("product_id", "productId"), gt=0)
    retailer_id: int = Field(validation_alias=AliasChoices("retailer_id", "retailerId"), gt=0)
    # React sends display labels with reference IDs. Accept them for compatibility;
    # the backend resolves authoritative names from the database when saving.
    product: str | None = None
    retailer: str | None = None
    price: Annotated[Decimal, Field(ge=5, le=2000, max_digits=15, decimal_places=4)]
    cost: Annotated[Decimal, Field(ge=Decimal("0.01"), le=1800, max_digits=15, decimal_places=4)]
    discount: Annotated[Decimal, Field(ge=0, le=60, max_digits=7, decimal_places=4)]
    weeks: Annotated[int, Field(ge=1, le=52)]
    baseline: Annotated[Decimal, Field(ge=1, le=50000, max_digits=15, decimal_places=4)]
    promo: Annotated[Decimal, Field(ge=0, le=100000, max_digits=15, decimal_places=4)]

    @field_validator("baseline", "promo")
    @classmethod
    def validate_whole_unit_sales(cls, value: Decimal) -> Decimal:
        if value != value.to_integral_value():
            raise ValueError("Sales units must be whole numbers.")
        return value


class CalculationResult(NumericResponse):
    promo_price: Decimal = Field(serialization_alias="promoPrice")
    normal_margin: Decimal = Field(serialization_alias="normalMargin")
    promo_margin: Decimal = Field(serialization_alias="promoMargin")
    extra_units_per_week: Decimal = Field(serialization_alias="extraUnitsPerWeek")
    extra_units: Decimal = Field(serialization_alias="extraUnits")
    uplift: Decimal | None
    profit_without: Decimal = Field(serialization_alias="profitWithout")
    profit_with: Decimal = Field(serialization_alias="profitWith")
    extra_profit: Decimal = Field(serialization_alias="extraProfit")
    promo_cost: Decimal = Field(serialization_alias="promoCost")
    roi: Decimal | None
    roi_is_measurable: bool = Field(serialization_alias="roiIsMeasurable")
    roi_reason: str | None = Field(serialization_alias="roiReason")
    break_even_promo_units: Decimal | None = Field(serialization_alias="breakEvenPromoUnits")
    verdict: str
    verdict_code: str = Field(serialization_alias="verdictCode")
    verdict_reason: str = Field(serialization_alias="verdictReason")
    calculation_status: str = Field(serialization_alias="calculationStatus")
    is_calculable: bool = Field(default=True, serialization_alias="isCalculable")


class PromotionCalculationResponse(CalculationResult):
    status: str = "calculated"


class PromotionResponse(NumericResponse):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    name: str
    product_id: int = Field(serialization_alias="productId")
    retailer_id: int = Field(serialization_alias="retailerId")
    product: str
    retailer: str
    region: str | None
    price: Decimal
    cost: Decimal
    discount: Decimal
    weeks: int
    baseline: Decimal
    promo: Decimal
    promo_price: Decimal = Field(serialization_alias="promoPrice")
    normal_margin: Decimal = Field(serialization_alias="normalMargin")
    promo_margin: Decimal = Field(serialization_alias="promoMargin")
    extra_units_per_week: Decimal = Field(serialization_alias="extraUnitsPerWeek")
    extra_units: Decimal = Field(serialization_alias="extraUnits")
    uplift: Decimal | None
    profit_without: Decimal = Field(serialization_alias="profitWithout")
    profit_with: Decimal = Field(serialization_alias="profitWith")
    extra_profit: Decimal = Field(serialization_alias="extraProfit")
    promo_cost: Decimal = Field(serialization_alias="promoCost")
    roi: Decimal | None
    roi_is_measurable: bool = Field(serialization_alias="roiIsMeasurable")
    roi_reason: str | None = Field(serialization_alias="roiReason")
    break_even_promo_units: Decimal | None = Field(serialization_alias="breakEvenPromoUnits")
    verdict: str
    verdict_code: str = Field(serialization_alias="verdictCode")
    verdict_reason: str = Field(serialization_alias="verdictReason")
    calculation_status: str = Field(serialization_alias="calculationStatus")
    is_calculable: bool = Field(default=True, serialization_alias="isCalculable")
    created: str
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class PromotionList(BaseModel):
    items: list[PromotionResponse]
    total: int
    page: int
    page_size: int
