# MARS Promo ROI Simulator API

FastAPI backend for the existing React/Vite simulator. It defaults to persistent local SQLite and runs without office network access. It never automatically creates or modifies SQL Server tables.

## Architecture

- `app/main.py`: FastAPI app, CORS, startup lifecycle, and database error handling.
- `app/core/config.py`: environment-based SQLite and SQL Server settings.
- `app/database/`: SQLAlchemy engine/session, metadata, and local-only development fixtures.
- `app/models/`, `app/schemas/`: SQLAlchemy models and Pydantic API contracts.
- `app/routers/`: health, products, retailers, promotions, and dashboard APIs.
- `app/services/roi_calculator.py`: authoritative Decimal calculations and validation.
- `tests/`: ROI and endpoint tests.
- `sql/001_create_application_tables.sql`: manual review-only SQL Server proposal.

## Windows installation and run

From the backend directory in PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Python 3.11 through 3.14 are supported, including Python 3.14.6. The root `setup.ps1` selects the newest compatible installed interpreter and uses it to create `backend/.venv`. For manual setup, run `python -m venv .venv` from `backend/` using the intended interpreter (for example, `py -3.14 -m venv .venv` when the Python launcher is available). If an existing virtual environment was created with a different Python version or base interpreter, setup preserves it as a timestamped backup before creating the matching environment.

- API base: `http://127.0.0.1:8000/api`
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Local SQLite mode

`DB_MODE=sqlite` is the default. First startup creates application-owned local tables in `backend/data/promo_roi_dev.db`, then inserts three explicitly flagged development products and retailers taken from the frontend's illustrative reference data. These rows are local fixtures, not company records. Promotion history starts empty. The SQLite file persists through restarts and is ignored by Git.

Useful checks:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
Invoke-RestMethod http://127.0.0.1:8000/api/health/database
Invoke-RestMethod http://127.0.0.1:8000/api/health/database/schema
```

## Configuration and SQL Server

Copy `.env.example` to `.env`; do not commit `.env`. `DB_MODE` accepts `sqlite` or `sqlserver`. `SQLITE_PATH` configures the local DB file. `DB_SERVER`, optional `DB_PORT`, optional `DB_INSTANCE`, `DB_NAME`, `DB_DRIVER`, `DB_AUTH_MODE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_ENCRYPT`, and `DB_TRUST_SERVER_CERTIFICATE` configure SQL Server. Port is intentionally blank until confirmed. Authentication is Windows Integrated (`windows`) or SQL login (`sql`). The SQL mode requires an authorized username/password. `DB_SCHEMA` controls read-only schema inspection. `APPROVAL_ROI_THRESHOLD` defaults to 20; `CORS_ORIGINS` is comma-separated and defaults to the Vite origin.

Microsoft ODBC Driver 18 must be installed at the system level. Installing Python `pyodbc` does not install Microsoft's ODBC driver. Windows integrated auth uses the Windows identity running Uvicorn; that identity is not carried into Linux/WSL. A successful health check only confirms connection, not table compatibility.

`GET /api/health/database` attempts a connection on demand. `GET /api/health/database/schema` performs read-only SQLAlchemy metadata inspection for the expected `PRODUCTS`, `RETAILERS`, and `PROMOTIONS` names and columns. SQL Server mode never creates tables. `SQLSERVER_WRITES_ENABLED` defaults to false; keep it false until the DBA confirms schema compatibility and write authorization. The SQL file in `sql/` is only a proposal and is never executed by the app.

## API and validation

Routes include health, products/retailers list and detail, ROI calculation, promotion create/list/detail/update/delete, and dashboard summary. Lists use `page` and `page_size`; see `../docs/API_CONTRACT.md` for JSON structures.

The calculation uses Decimal. Promotion cost is discount per unit times all promotional units over the duration. Zero baseline, invalid discount/duration, negative sales, price at/below cost, and nonpositive promotional margin are rejected with 422. A zero promotional cost returns null ROI, `ROI_UNDEFINED`, an explanatory reason, and Review verdict. Verdict labels preserve existing UI title-case values; `verdictCode` is uppercase.

Errors: 422 validation, 403 SQL Server write gate, 404 missing records, and 503 for database or schema unavailability. Responses never include credentials, and APIs do not replace missing SQL Server rows with fake data.

## Tests

From `backend/` with the virtual environment active:

```powershell
pytest -q
```

Tests use temporary SQLite and do not need office connectivity.

## Frontend status

React files have not been changed. The app continues to use its localStorage persistence and JavaScript calculation until a separate integration step is authorized.
