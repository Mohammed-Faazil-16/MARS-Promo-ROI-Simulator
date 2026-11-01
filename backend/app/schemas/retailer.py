from datetime import datetime

from pydantic import Field

from app.schemas.common import ORMModel


class RetailerResponse(ORMModel):
    id: int
    name: str
    region: str | None
    account_manager: str | None = Field(serialization_alias="accountManager")
    is_active: bool = Field(serialization_alias="isActive")
    is_development_seed: bool = Field(serialization_alias="isDevelopmentSeed")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")
