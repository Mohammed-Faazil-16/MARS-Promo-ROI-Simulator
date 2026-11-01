# API contract

Base URL: `http://127.0.0.1:8000/api`. JSON uses camelCase for calculated fields and reference IDs, matching the existing React data shape. Values are produced from Python `Decimal`; clients should display the returned calculation instead of recomputing it. Errors use FastAPI `detail`, typically `{ "code": "...", "message": "..." }`.

List responses are `{ "items": [], "total": 0, "page": 1, "page_size": 50 }`. Pages are one-based; page size is 1–200 (default 50). Local fixture rows have `isDevelopmentSeed: true` and are not company records.

## Health

### `GET /api/health`

No database connection is required.

```json
{ "status": "ok", "service": "MARS Promo ROI Simulator API", "version": "1.0.0", "database_mode": "sqlite" }
```

### `GET /api/health/database`

Attempts a real connection only when called.

```json
{ "status": "connected", "mode": "sqlite", "database": "local SQLite" }
```

Unavailable result: HTTP 200 with `status: "unavailable"`, mode, and safe diagnostic message (no credentials or connection string).

### `GET /api/health/database/schema`

Read-only inspection of expected table/column metadata.

```json
{
  "mode": "sqlite", "schema": null, "read_only": true, "compatible": true,
  "tables": {
    "PRODUCTS": { "exists": true, "compatible": true, "missing_columns": [] },
    "RETAILERS": { "exists": true, "compatible": true, "missing_columns": [] },
    "PROMOTIONS": { "exists": true, "compatible": true, "missing_columns": [] }
  }
}
```

## Products

### `GET /api/products?page=1&page_size=50&active=true&category=Chocolate`

Optional boolean `active` and exact-match `category` filters.

```json
{
  "items": [{"id":1,"name":"Snickers","category":"Chocolate","brand":"Snickers","unitCost":60,"normalPrice":100,"isActive":true,"isDevelopmentSeed":true,"createdAt":"2026-11-02T10:00:00","updatedAt":"2026-11-02T10:00:00"}],
  "total":1,"page":1,"page_size":50
}
```

### `GET /api/products/{product_id}`

Returns one product or 404.

## Retailers

### `GET /api/retailers?page=1&page_size=50&active=true&region=South`

Optional boolean `active` and exact-match `region` filters.

```json
{
  "items": [{"id":1,"name":"Reliance Retail","region":"Pan-India","accountManager":"A. Sharma (Demo)","isActive":true,"isDevelopmentSeed":true,"createdAt":"2026-11-02T10:00:00","updatedAt":"2026-11-02T10:00:00"}],
  "total":1,"page":1,"page_size":50
}
```

### `GET /api/retailers/{retailer_id}`

Returns one retailer or 404.

## Promotions

Request for calculate/create/update accepts either camel or snake-case reference IDs. The current React simulator's `product` and `retailer` labels are accepted but ignored; when saving, names are resolved from the selected database:

```json
{"name":"Example offer","productId":1,"retailerId":1,"product":"Snickers","retailer":"Reliance Retail","price":100,"cost":60,"discount":20,"weeks":2,"baseline":1000,"promo":1500}
```

Validation: price greater than cost; discount 0–60%; weeks 1–52 whole weeks; baseline >0 and ≤50,000; promo sales 0–100,000. Negative sales, zero baseline, price at/below cost, and nonpositive promotional margin return 422. Product and retailer must exist and be active to save.

### `POST /api/promotions/calculate`

No database write. Returns calculation data compatible with the existing result breakdown:

```json
{
  "promoPrice":80,"normalMargin":40,"promoMargin":20,
  "extraUnitsPerWeek":500,"extraUnits":1000,"uplift":50,
  "profitWithout":80000,"profitWith":60000,"extraProfit":-20000,
  "promoCost":60000,"roi":-33.33333333333333333333333333,
  "roiIsMeasurable":true,"roiReason":null,"breakEvenPromoUnits":2000,
  "verdict":"Reject","verdictCode":"REJECT",
  "verdictReason":"The promotion produces less profit than the no-offer scenario.",
  "calculationStatus":"CALCULATED","isCalculable":true,"status":"calculated"
}
```

For zero promotional cost, ROI is null, measurable is false, `calculationStatus` is `ROI_UNDEFINED`, `roiReason` explains why, and verdict is Review. No division by zero occurs.

### `POST /api/promotions`

Calculates server-side and persists the inputs and result snapshot; returns 201 and the saved promotion shape below. SQL Server writes are 403 by default until explicitly enabled after review.

### `GET /api/promotions?page=1&page_size=50&product_id=1&retailer_id=1&verdict=APPROVE&created_from=2026-01-01T00:00:00&created_to=2026-12-31T23:59:59`

All filters optional. Verdict accepts APPROVE, REVIEW, REJECT (case-insensitive); dates are ISO 8601. Returns paginated history.

### `GET /api/promotions/{promotion_id}`

Returns the stored inputs, historical product/retailer labels, calculation snapshot, and timestamps, or 404.

```json
{
  "id":12,"name":"Example offer","productId":1,"retailerId":1,"product":"Snickers","retailer":"Reliance Retail","region":"Pan-India","created":"2026-11-02",
  "price":100,"cost":60,"discount":20,"weeks":2,"baseline":1000,"promo":1500,
  "promoPrice":80,"normalMargin":40,"promoMargin":20,"extraUnitsPerWeek":500,"extraUnits":1000,"uplift":50,
  "profitWithout":80000,"profitWith":60000,"extraProfit":-20000,"promoCost":60000,"roi":-33.333333,
  "roiIsMeasurable":true,"roiReason":null,"breakEvenPromoUnits":2000,"verdict":"Reject","verdictCode":"REJECT",
  "verdictReason":"The promotion produces less profit than the no-offer scenario.","calculationStatus":"CALCULATED","isCalculable":true,
  "createdAt":"2026-11-02T10:00:00","updatedAt":"2026-11-02T10:00:00"
}
```

### `PUT /api/promotions/{promotion_id}`

Full request model as above; revalidates and recalculates all metrics, preserving the original creation timestamp. Returns the updated promotion or 404.

### `DELETE /api/promotions/{promotion_id}`

Returns 204 with no body or 404. SQL Server writes are blocked by default.

## Dashboard

### `GET /api/dashboard/summary?period=1y`

Period is `1m`, `3m`, `6m`, `1y` (default), or `all`.

```json
{
  "period":"1y","total_promotions":3,"approve_count":1,"review_count":1,"reject_count":1,
  "average_roi":5,"total_extra_profit":12000,"roi_is_measurable":true,
  "decision_distribution":{"APPROVE":1,"REVIEW":1,"REJECT":1},
  "monthly_average_roi":[{"month":"2026-11","average_roi":5,"count":2}],
  "total":3,"approve":1,"review":1,"reject":1,"averageRoi":5,"totalExtraProfit":12000,
  "decisionDistribution":{"Approve":1,"Review":1,"Reject":1},
  "monthlyAverageRoi":[{"month":"2026-11","averageRoi":5,"count":2}]
}
```

When the period has no measurable ROI, `average_roi` is null and `roi_is_measurable` is false. Dashboard results include saved database promotions only, not the React demo seed scenarios.
