from decimal import Decimal

import pytest

from app.services.roi_calculator import ROIInputError, calculate_roi

COMMON = {"price": 100, "cost": 60, "weeks": 2, "baseline": 1000}


@pytest.mark.parametrize(
    ("discount", "promo", "expected_roi", "expected_verdict"),
    [
        (20, 1500, Decimal("-33.33333333333333333333333333"), "REJECT"),
        (10, 1600, Decimal("50"), "APPROVE"),
        (20, 2000, Decimal("0"), "REVIEW"),
    ],
)
def test_mandatory_roi_cases(discount, promo, expected_roi, expected_verdict):
    result = calculate_roi(**COMMON, discount=discount, promo=promo, approval_threshold=Decimal("20"))
    assert result["roi"] == expected_roi
    assert result["verdict_code"] == expected_verdict


def test_zero_baseline_is_input_error():
    with pytest.raises(ROIInputError, match="Baseline sales"):
        calculate_roi(**{**COMMON, "baseline": 0}, discount=20, promo=1500)


def test_price_below_cost_is_input_error():
    with pytest.raises(ROIInputError, match="Price must be greater"):
        calculate_roi(**{**COMMON, "price": 50}, discount=10, promo=1500)


def test_zero_promotional_cost_is_undefined_without_division_error():
    result = calculate_roi(**COMMON, discount=0, promo=1200)
    assert result["promo_cost"] == 0
    assert result["roi"] is None
    assert result["calculation_status"] == "ROI_UNDEFINED"
    assert result["verdict_code"] == "REVIEW"
    assert result["roi_reason"]


def test_nonpositive_promo_margin_is_input_error():
    with pytest.raises(ROIInputError, match="promotional margin must be positive"):
        calculate_roi(**COMMON, discount=50, promo=1500)


@pytest.mark.parametrize("changes", [
    {"weeks": 0}, {"weeks": -1}, {"promo": -1}, {"discount": -1},
    {"discount": 101}, {"price": "not-a-number"}, {"price": "NaN"},
])
def test_invalid_numeric_inputs_are_rejected(changes):
    inputs = {**COMMON, "discount": 10, "promo": 1200, **changes}
    with pytest.raises(ROIInputError):
        calculate_roi(**inputs)
