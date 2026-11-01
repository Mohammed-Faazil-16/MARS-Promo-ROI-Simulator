from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, field_serializer


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @field_serializer("*", when_used="json")
    def serialize_decimal_as_json_number(self, value: Any):
        # The frontend consumes numeric values (e.g. ROI.toFixed()). Calculations
        # remain Decimal internally; JSON numbers are serialized at the API edge.
        return float(value) if isinstance(value, Decimal) else value


class NumericResponse(BaseModel):
    @field_serializer("*", when_used="json")
    def serialize_decimal_as_json_number(self, value: Any):
        return float(value) if isinstance(value, Decimal) else value
