# Backend Implementation Plan

## Stage 1 audit

### Repository and frontend root

The extracted repository contains one application at `Promo ROI Simluator/promo-roi-frontend/`. This is the actual React application root: it contains `package.json`, `vite.config.js`, `index.html`, and `src/main.jsx`. The similarly named parent directory is `Promo ROI Simluator` (with the spelling shown on disk). An empty `backend/` directory already exists; this stage created `docs/` and this plan file. No backend source or other documentation files were present before this stage.

The project files available for inspection are the Vite configuration, frontend source, public assets, `package.json`, lockfile, `.gitignore`, and the frontend README. No project presentation (PPT/PPTX) or reference workbook was present in the extracted project tree, so the formulas below are based on the supplied project brief and inspected source code.

### Frontend architecture

- React 19 application bootstrapped by `src/main.jsx`; `src/App.jsx` owns application state and switches between Dashboard, Scenario Simulator, Scenario Analysis, and Saved Scenarios. The displayed login gate is also part of the frontend.
- Feature views live under `src/features/`; shared layout, chart, and common UI components live under `src/components/`.
- Static reference datasets and the empty simulator form live in `src/data/`.
- Scenario state and browser persistence are implemented by `src/hooks/useScenarios.js`, `src/services/scenarioService.js`, and `src/services/storageService.js`.
- ROI calculation and validation are in `src/utils/roiCalculations.js` and `src/utils/scenarioValidation.js`; date-period filtering is in `src/utils/dashboardDateFilter.js`.
- Vite uses its default development server configuration. No `server.port` or proxy is set in `vite.config.js`; the standard development origin is therefore `http://localhost:5173` unless Vite selects a fallback port.
- Dependencies include React/React DOM, React Router, React Hook Form, Zod, Recharts, and Lucide. Scripts are `dev`, `build`, `lint`, and `preview`. No frontend dependency or UI change is proposed for the initial backend work.

### Existing functionality and data flow

`App.jsx` loads the saved scenario array through `useScenarios`, merges it with the static `SEED_SCENARIOS`, and passes data and callbacks into feature views. The Simulator receives product and retailer arrays, constructs a payload from the current form, validates it, and asks `App.jsx` to calculate a preview or save it. Saving currently creates or updates a browser record, runs the JavaScript calculator, and writes to localStorage. Editing, deleting, comparing, scenario filters, and the dashboard all operate on this in-memory merged list.

The product and retailer lists are directly imported from static data in `App.jsx`; `productService.js` is a synchronous helper over the same static products. There is currently no HTTP client, API base URL, fetch call, or backend integration. Product reference data has 50 records and retailer reference data has 50 records; comments describe them as reference/demo data, not confirmed live company records. The seed promotions are explicitly synthetic demo scenarios and include product/retailer labels that do not always match the reference lists, so they must not be treated as SQL production data.

Browser storage currently contains:

- `promo-roi-simulator-scenarios-v2` for user-saved scenarios, via the storage service.
- `promo_roi_user` for the temporary frontend login name and user ID (the source says the password is never stored).
- `promo_roi_notifications` for local notifications, including their scenario ID, verdict, ROI, read flag, and creation time.

The comparison selection is in React state only. Demo seed scenarios are merged at runtime, not written to the saved scenario key. The dashboard's applied reporting period filters the merged scenario collection before App.jsx computes total, approve/review/reject counts, average measurable ROI, and total extra profit. The Dashboard then uses this filtered list for recent scenarios, a decision distribution, ROI-by-scenario chart, and monthly average ROI trend. Monthly aggregation is based on scenario creation date, not promotion duration.

### Existing ROI rules and validation

The frontend calculator implements the following rules (using JavaScript `Number` arithmetic):

| Measure | Existing formula |
| --- | --- |
| Promotional price | `price * (1 - discount / 100)` |
| Normal / promotional unit margin | `price - cost` / `promoPrice - cost` |
| Extra units per week / total extra units | `promo - baseline` / `(promo - baseline) * weeks` |
| Uplift | `(promo - baseline) / baseline * 100`, or null when baseline is zero |
| Profit without / with offer | `baseline * weeks * normalMargin` / `promo * weeks * promoMargin` |
| Extra profit | `profitWith - profitWithout` |
| Promotion cost | `(price - promoPrice) * promo * weeks` |
| ROI | `extraProfit / promoCost * 100`, or null unless promotion cost is positive |
| Break-even weekly promo units | `profitWithout / promoMargin / weeks`, or null unless promo margin is positive |

The current frontend threshold is 20%: at least 20% is `Approve`, from 0% up to but not including 20% is `Review`, and below zero is `Reject`. Labels are title case in the UI. If ROI is undefined because promotion cost is zero, the current calculator chooses a verdict based on extra profit; the supplied requirement instead calls for a null ROI and an explanatory status when mathematically undefined. The backend should expose an explicit calculation status/reason and use the requested verdict policy only for measurable ROI; the exact non-measurable verdict mapping can be documented with the API contract.

The calculator itself checks finite inputs and positive weeks, but permits zero/negative baseline, sales, prices, costs, discounts outside the form limits, and negative promotional margins. The UI validator is stricter: it requires a scenario name, selected product and retailer, price 5–2000, cost 0.01–1800, discount 0–60%, weeks 1–52 whole number, baseline 1–50,000 whole units, and promo sales 0–100,000 whole units. It rejects cost at or above price and a promo price at or below cost, blocks forecasts above 10 times baseline, and warns for uplift above 100%, promo sales below baseline, discount above 40%, or duration above 26 weeks. These limits are prototype UI rules rather than the formulas themselves; implementation should make the accepted backend ranges explicit and avoid silently treating presentation-only warnings as calculation rules.

## Required backend behavior

Build a modular FastAPI application in the requested `backend/` directory, keeping all work outside frontend source and configuration during the initial implementation. It should provide:

- A pure, Decimal-based ROI service with input validation, a structured result, explanatory null-ROI reasons, and an environment-configurable approval threshold (default 20%).
- SQLAlchemy 2.x models, database session lifecycle, and environment-based SQL Server configuration using pyodbc and ODBC Driver 18. Construct connection strings safely for Windows Integrated or SQL authentication, optional port, encryption, and certificate validation; do not log secrets.
- General health independent of the database, plus an opt-in database health check that attempts a connection only when called.
- Products, retailers, promotions, and dashboard routers with validated schemas, pagination for list routes, correct not-found/validation/service status codes, and transaction handling.
- Clear unavailable-database errors rather than fabricated product/scenario/dashboard data. No automatic creation or mutation of company database objects.
- Automated tests for the ROI mandatory cases and API behavior that can run without a live SQL Server.
- A proposed schema SQL file for review only; it will never be executed automatically.

## Proposed SQL Server model

The proposed design is for a new application-owned schema and must not be assumed to match company tables. Confirm whether a dedicated schema/database or read/write permissions are allowed before any production use.

### `PRODUCTS`

- `ProductId INT IDENTITY` primary key.
- `Name NVARCHAR(200)`, `Category NVARCHAR(100)`, nullable `Brand NVARCHAR(100)`.
- `UnitCost DECIMAL(19,4)` and `NormalPrice DECIMAL(19,4)` as current reference values; nullable only if business-approved.
- `IsActive BIT NOT NULL DEFAULT 1`; `CreatedAt DATETIME2(3)`, `UpdatedAt DATETIME2(3)`.
- Indexes on active status and category; consider a unique constraint only after confirming product identity rules.

### `RETAILERS`

- `RetailerId INT IDENTITY` primary key.
- `Name NVARCHAR(200)`, nullable `Region NVARCHAR(100)`, nullable `AccountManager NVARCHAR(200)`.
- `IsActive BIT NOT NULL DEFAULT 1`; `CreatedAt DATETIME2(3)`, `UpdatedAt DATETIME2(3)`.
- Indexes on active status and region; uniqueness must be agreed because the frontend contains similarly named accounts.

### `PROMOTIONS`

- `PromotionId BIGINT IDENTITY` primary key; required `ProductId` and `RetailerId` foreign keys.
- `Name NVARCHAR(150)`; historical input snapshots `Price` and `Cost` as `DECIMAL(19,4)`, `DiscountPercent DECIMAL(9,4)`, `DurationWeeks DECIMAL(9,2)` (integer validation policy to be confirmed), `BaselineUnitsPerWeek DECIMAL(19,4)`, and `PromoUnitsPerWeek DECIMAL(19,4)`.
- Store computed result snapshots as decimal values where applicable: promotional price, unit margins, extra units, uplift, profits, promotion cost, ROI, and break-even weekly sales; nullable values represent undefined outputs. Store verdict and calculation status/reason as bounded text/enum-compatible fields.
- `CreatedAt DATETIME2(3)` and `UpdatedAt DATETIME2(3)`. Consider `DeletedAt DATETIME2(3)` for recoverable deletes and optional creator identity only after identity requirements are known.
- Index foreign keys and common query columns (`CreatedAt`, verdict); add composite indexes only based on dashboard/query patterns.

Prices and costs on promotions are historical snapshots and must remain unchanged if current product reference values change. The initial script should use explicit schema/table names, PKs/FKs, and indexes, and should be clearly marked as review-only.

## API proposal

All routes are under `/api`. List routes use `page` (1-based) and `page_size` (bounded, default 50) and return `{items, total, page, page_size}`. Errors should follow a stable JSON shape, preferably FastAPI's validation detail wrapped/normalized as `{"detail": "...", "code": "..."}`.

| Route | Purpose / proposed behavior |
| --- | --- |
| `GET /api/health` | Return application status/version without requiring SQL Server. |
| `GET /api/health/database` | Attempt a short-lived `SELECT 1` connection on request; return status and a safe diagnostic (never connection details or credentials). |
| `GET /api/products` | Paginated products, optionally filter by `active` and `category`; database-backed only. |
| `GET /api/products/{product_id}` | One product or 404. |
| `GET /api/retailers` | Paginated retailers, optionally filter by `active` and `region`; database-backed only. |
| `GET /api/retailers/{retailer_id}` | One retailer or 404. |
| `POST /api/promotions/calculate` | Validate an unsaved scenario and return authoritative Decimal calculation outputs, verdict, and calculation status. No DB write needed. |
| `POST /api/promotions` | Validate, calculate server-side, and persist scenario inputs plus result snapshot; return 201. |
| `GET /api/promotions` | Paginated history, with optional product, retailer, verdict, and created-date filters. |
| `GET /api/promotions/{promotion_id}` | One promotion with historical input snapshots and calculation output, or 404. |
| `PUT /api/promotions/{promotion_id}` | Replace editable scenario inputs, recalculate on the server, update transactionally, or 404. |
| `DELETE /api/promotions/{promotion_id}` | Remove a promotion from normal history; prefer a documented soft-delete if the company requires an audit trail. Confirm retention expectations before implementing delete semantics. |
| `GET /api/dashboard/summary` | Return period-filtered count, approve/review/reject counts, average measurable ROI, total extra profit, and trend aggregates needed by the current dashboard (including monthly average ROI and decision distribution where useful). |

Product/retailer/promotions/dashboard reads require a configured reachable database and should return a clear service-unavailable response when unavailable. The calculation route remains useful without SQL Server. No endpoint will seed or substitute demo rows as database responses.

## Integration plan (later, only after explicit authorization)

The frontend can be preserved while connecting through a small API service and adapting the existing hook data source. Minimum data flow changes will eventually be:

1. Fetch products and retailers into the existing view props, preserving their current field names where practical (`id`, `name`, `category`, `brand`, `unitCost`, `normalPrice`, `region`, `accountManager`, `isActive`).
2. Send simulator preview inputs to `POST /api/promotions/calculate`; display returned values using the existing result breakdown. The backend remains the sole authoritative calculator.
3. Replace `persistScenario` and `removeScenario` persistence with POST/PUT/DELETE calls and load saved history from `GET /api/promotions`.
4. Keep UI-only state (comparison selection, login presentation, notifications) separate from promotion persistence unless separately authorized and specified. The current prototype login is not authentication and must not be represented as secure backend identity.
5. Load the dashboard summary from the backend for persisted promotions and use server-calculated results. Keep existing visual components and routes unchanged; do not update the local calculation logic until integration approval defines how to remove the competing calculation source with minimal UI changes.

The API should allow the actual Vite development origin. Since the current Vite config does not pin the port, default CORS should include `http://localhost:5173` and make allowed origins configurable; add any fallback/deployed origins only when known. The initial backend-only stage will not edit `vite.config.js` or any frontend file.

## Technical issues and decisions to resolve during implementation

1. **No company schema discovery yet:** office/VPN connectivity, SQL Server port, authentication, permissions, intended existing tables, and approved write location are unknown. The backend must start without them and must not probe or modify production until explicitly configured and invoked.
2. **Proposed schema vs existing schema:** the proposed `PRODUCTS`, `RETAILERS`, and `PROMOTIONS` model is not a claim about existing company tables. A later mapping/adaptation requires administrator-provided schema details.
3. **Windows Integrated Authentication:** pyodbc integrated auth depends on the runtime environment and driver. A Windows user credential is not automatically available to Linux/WSL. Configuration should fail with actionable guidance when the selected mode is incompatible.
4. **ROI on zero or negative spend:** the frontend returns null unless promo cost is positive. The supplied requirement says zero promotional cost yields undefined ROI, and also emphasizes undefined ROI statuses. Negative discounts would be rejected, preventing negative spend. The API should return `roi: null` and a reason for zero cost; verdict treatment for this case needs an explicit documented rule (recommendation: `REVIEW`, because there is no measurable ROI).
5. **Break-even and nonpositive promo margin:** break-even is null when promotional margin is zero or negative. The supplied input policy calls out nonpositive promotional margin; reject such inputs with a validation error for promotion creation/calculation, rather than inventing a break-even value. This is stricter than the calculator helper's current behavior and matches the simulator's check that promotional price must exceed cost.
6. **Zero baseline:** uplift is mathematically undefined, but the simulator's validation requires baseline ≥ 1 and the mandatory case says baseline zero is an input error. Return a validation error for zero baseline; the pure calculation helper can still protect divisions defensively.
7. **Case A–C ROI denominator:** expected values match the frontend's definition of promotion cost as discount per unit multiplied by all promotional units over the duration. This is not the same as discount cost on incremental units. Preserve the supplied definition and document it; do not silently change it.
8. **Input limits and precision:** UI limits and whole-unit expectations are currently JavaScript validation rules, while formulas are broader. Carry forward those visible constraints initially unless the business owner approves different ranges. Use Decimal and explicit database/API precision to avoid binary floating-point drift.
9. **Date periods and timezone:** current frontend period filtering uses local browser dates and scenario creation dates. The API should use `DATETIME2` UTC timestamps and a defined reporting timezone/period boundary before matching dashboard behavior exactly.
10. **Deletion and audit requirements:** the API requires DELETE, but hard vs soft deletion is not specified. Use soft deletion for a production history if audit retention is required; finalize it before persistence behavior is locked.
11. **Identity and ownership:** no backend authentication or user ownership system exists in the brief. Do not trust the prototype login name as an authenticated identity. Keep auth outside the first backend scope unless access-control requirements are supplied.

## Proposed execution stages

1. **Audit and plan (current stage):** inspect the extracted project and create this plan only.
2. **Backend scaffold:** add the FastAPI package layout, configuration examples, dependency list, and startup/health behavior. Do not change frontend files.
3. **ROI service and tests:** implement Decimal calculations, validation and configured thresholds; test mandatory cases A–E plus undefined/invalid edge cases.
4. **Schemas and routers:** define API contracts and endpoints, with DB-backed routes returning explicit unavailable errors until DB is reachable.
5. **SQL Server connection layer:** build safe environment-based pyodbc/SQLAlchemy configuration and an on-demand connection health route. Do not create or alter company objects.
6. **Review-only schema and documentation:** add SQL script, API contract, SQL Server setup guide, backend README, and safe `.env.example`/`.gitignore`.
7. **Verification:** run requested backend tests and verify frontend tracked files remain unchanged. Do not begin frontend integration until explicitly approved.

## Stage 1 result

The audit found a React/Vite frontend prototype, in-browser scenario persistence, client-side calculations, synthetic demo/reference data, and no backend or presentation file. This document records the source-derived architecture, formulas, integration needs, and proposed backend plan. No backend implementation or frontend modification is part of this stage.
