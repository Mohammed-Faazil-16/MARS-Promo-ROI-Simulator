import os
import asyncio

import pytest

# The Windows sandbox blocks Proactor's socket-pair accept fallback. The selector
# loop uses the supported socketpair implementation for the in-process test client.
if os.name == "nt":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi.testclient import TestClient

_db_file = os.path.join("data", "mars_promo_roi_api_tests.db")
os.environ["DB_MODE"] = "sqlite"
os.environ["SQLITE_PATH"] = _db_file
os.environ["APPROVAL_ROI_THRESHOLD"] = "20"

from app.core.config import get_settings  # noqa: E402
from app.database.connection import get_engine, get_session_factory  # noqa: E402

get_settings.cache_clear()
get_engine.cache_clear()
get_session_factory.cache_clear()

from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def payload(**overrides):
    body = {
        "name": "API test promotion", "productId": 1, "retailerId": 1,
        "product": "Snickers", "retailer": "Reliance Retail",
        "price": 100, "cost": 60, "discount": 20,
        "weeks": 2, "baseline": 1000, "promo": 1500,
    }
    body.update(overrides)
    return body


def test_health_and_database_schema(client):
    assert client.get("/api/health").json()["status"] == "ok"
    assert client.get("/api/health/database").json()["status"] == "connected"
    assert client.get("/api/health/database/schema").json()["compatible"] is True


def test_reference_apis_return_local_development_rows(client):
    products = client.get("/api/products").json()
    retailers = client.get("/api/retailers").json()
    assert products["total"] >= 1
    assert products["items"][0]["isDevelopmentSeed"] is True
    assert client.get("/api/products/1").json()["name"] == "Snickers"
    assert retailers["total"] >= 1
    assert retailers["items"][0]["isDevelopmentSeed"] is True
    assert client.get("/api/retailers/1").json()["name"] == "Reliance Retail"


@pytest.mark.parametrize(
    ("discount", "promo", "expected_roi", "verdict"),
    [(20, 1500, -100 / 3, "REJECT"), (10, 1600, 50, "APPROVE"), (20, 2000, 0, "REVIEW")],
)
def test_calculation_endpoint_cases(client, discount, promo, expected_roi, verdict):
    response = client.post("/api/promotions/calculate", json=payload(discount=discount, promo=promo))
    assert response.status_code == 200
    result = response.json()
    assert isinstance(result["roi"], (float, int))
    assert float(result["roi"]) == pytest.approx(expected_roi)
    assert result["verdictCode"] == verdict


def test_calculation_endpoint_rejects_zero_baseline_and_below_cost(client):
    assert client.post("/api/promotions/calculate", json=payload(baseline=0)).status_code == 422
    assert client.post("/api/promotions/calculate", json=payload(price=50, cost=60)).status_code == 422
    assert client.post("/api/promotions/calculate", json=payload(promo=1000.5)).status_code == 422


def test_zero_cost_has_null_roi_and_status(client):
    result = client.post("/api/promotions/calculate", json=payload(discount=0, promo=1200)).json()
    assert result["roi"] is None
    assert result["calculationStatus"] == "ROI_UNDEFINED"
    assert result["roiReason"]


def test_promotion_crud_dashboard_and_persistence(client):
    created = client.post("/api/promotions", json=payload())
    assert created.status_code == 201, created.text
    record = created.json()
    promotion_id = record["id"]
    assert record["verdictCode"] == "REJECT"

    assert client.get(f"/api/promotions/{promotion_id}").json()["id"] == promotion_id
    history = client.get("/api/promotions?page=1&page_size=10").json()
    assert history["total"] >= 1
    assert any(item["id"] == promotion_id for item in history["items"])

    updated = client.put(f"/api/promotions/{promotion_id}", json=payload(discount=10, promo=1600))
    assert updated.status_code == 200, updated.text
    assert float(updated.json()["roi"]) == pytest.approx(50)
    assert updated.json()["verdictCode"] == "APPROVE"

    summary = client.get("/api/dashboard/summary?period=all")
    assert summary.status_code == 200
    assert summary.json()["total_promotions"] >= 1
    assert summary.json()["approve_count"] >= 1
    assert summary.json()["total"] == summary.json()["total_promotions"]
    assert summary.json()["averageRoi"] is not None

    with TestClient(app) as restarted:
        assert restarted.get(f"/api/promotions/{promotion_id}").status_code == 200

    assert client.delete(f"/api/promotions/{promotion_id}").status_code == 204
    assert client.get(f"/api/promotions/{promotion_id}").status_code == 404
