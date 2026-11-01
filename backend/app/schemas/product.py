from datetime import datetime
from decimal import Decimal

from pydantic import Field

from app.schemas.common import ORMModel


class ProductResponse(ORMModel):
    id: int
    name: str
    category: str
    brand: str | None
    unit_cost: Decimal = Field(serialization_alias="unitCost")
    normal_price: Decimal = Field(serialization_alias="normalPrice")
    is_active: bool = Field(serialization_alias="isActive")
    is_development_seed: bool = Field(serialization_alias="isDevelopmentSeed")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")
