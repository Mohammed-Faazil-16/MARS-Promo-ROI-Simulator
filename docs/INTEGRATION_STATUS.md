# Backend integration status

- FastAPI backend is implemented in `backend/` and defaults to persistent local SQLite.
- SQLite initializes application-owned tables and explicitly flagged development reference fixtures.
- Python Decimal is the authoritative backend ROI calculation.
- SQL Server settings, on-demand connection health, and read-only schema compatibility inspection are implemented. No office connection is claimed until actually tested.
- The backend never auto-creates SQL Server tables. SQL Server writes are disabled by default.
- The review-only schema proposal is `backend/sql/001_create_application_tables.sql`.
- Local verification: FastAPI started under Uvicorn, Swagger returned HTTP 200, all required routes were exercised, and the automated suite passed (22 tests). A saved promotion was read after restarting Uvicorn, then deleted and confirmed absent.
- No React source file has been modified. The React app remains on its localStorage and JavaScript calculation flow until separately authorized integration.

No SQL Server connection was attempted: the current verified runtime is SQLite and office/VPN connectivity is unconfirmed. Microsoft ODBC Driver 18 is not registered on this laptop; installing the Python `pyodbc` package alone does not provide that system driver. Before office use, confirm the administrator-provided server port/instance, authentication and TLS requirements, actual tables/schema, access permissions, and approval for writes. Install the ODBC driver with IT/admin help if required, then run health and compatibility inspection from the authorized network and map the backend to the approved schema before enabling writes.
