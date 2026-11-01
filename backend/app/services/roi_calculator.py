from decimal import Decimal, InvalidOperation
from typing import Any

from app.core.config import get_settings


class ROIInputError(ValueError):
    """Invalid commercial assumptions for an ROI calculation."""


def as_decimal(value: Any, field_name: str) -> Decimal:
    try:
        result = value if isinstance(value, Decimal) else Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise ROIInputError(f"{field_name} must be a valid number.") from exc
    if not result.is_finite():
        raise ROIInputError(f"{field_name} must be finite.")
    return result


def calculate_roi(
    *, price: Any, cost: Any, discount: Any, weeks: Any, baseline: Any, promo: Any,
    approval_threshold: Decimal | None = None,
) -> dict[str, Any]:
    price = as_decimal(price, "price")
    cost = as_decimal(cost, "cost")
    discount = as_decimal(discount, "discount")
    baseline = as_decimal(baseline, "baseline")
    promo = as_decimal(promo, "promo")
    try:
        duration = int(weeks)
    except (TypeError, ValueError, OverflowError) as exc:
        raise ROIInputError("weeks must be a positive whole number.") from exc
    if isinstance(weeks, bool) or Decimal(str(weeks)) != Decimal(duration) or duration <= 0:
        raise ROIInputError("weeks must be a positive whole number.")

    if price <= 0:
        raise ROIInputError("Price must be greater than zero.")
    if cost < 0 or price <= cost:
        raise ROIInputError("Price must be greater than unit cost; cost cannot be negative.")
    if discount < 0 or discount > 100:
        raise ROIInputError("Discount must be between 0 and 100 percent.")
    if baseline <= 0:
        raise ROIInputError("Baseline sales must be greater than zero.")
    if promo < 0:
        raise ROIInputError("Promotional sales cannot be negative.")

    hundred = Decimal("100")
    promo_price = price * (Decimal(1) - discount / hundred)
    normal_margin = price - cost
    promo_margin = promo_price - cost
    if promo_margin <= 0:
        raise ROIInputError("Promotional selling price must be greater than unit cost (promotional margin must be positive).")

    extra_units_per_week = promo - baseline
    extra_units = extra_units_per_week * duration
    uplift = extra_units_per_week / baseline * hundred
    profit_without = baseline * duration * normal_margin
    profit_with = promo * duration * promo_margin
    extra_profit = profit_with - profit_without
    discount_per_unit = price - promo_price
    promo_cost = discount_per_unit * promo * duration
    roi = extra_profit / promo_cost * hundred if promo_cost > 0 else None
    threshold = approval_threshold if approval_threshold is not None else get_settings().approval_threshold

    if roi is None:
        verdict, code = "Review", "REVIEW"
        roi_reason = "ROI is undefined because total promotional discount cost is zero."
        verdict_reason = "ROI cannot be measured because promotional cost is zero; review the promotion manually."
        status = "ROI_UNDEFINED"
    elif roi >= threshold:
        verdict, code = "Approve", "APPROVE"
        roi_reason, verdict_reason, status = None, f"ROI meets the {threshold}% approval threshold.", "CALCULATED"
    elif roi >= 0:
        verdict, code = "Review", "REVIEW"
        roi_reason, verdict_reason, status = None, f"ROI is non-negative but below the {threshold}% approval threshold.", "CALCULATED"
    else:
        verdict, code = "Reject", "REJECT"
        roi_reason, verdict_reason, status = None, "The promotion produces less profit than the no-offer scenario.", "CALCULATED"

    return {
        "promo_price": promo_price,
        "normal_margin": normal_margin,
        "promo_margin": promo_margin,
        "extra_units_per_week": extra_units_per_week,
        "extra_units": extra_units,
        "uplift": uplift,
        "profit_without": profit_without,
        "profit_with": profit_with,
        "extra_profit": extra_profit,
        "promo_cost": promo_cost,
        "roi": roi,
        "roi_is_measurable": roi is not None,
        "roi_reason": roi_reason,
        "break_even_promo_units": profit_without / promo_margin / duration if promo_margin > 0 else None,
        "verdict": verdict,
        "verdict_code": code,
        "verdict_reason": verdict_reason,
        "calculation_status": status,
        "is_calculable": True,
    }
