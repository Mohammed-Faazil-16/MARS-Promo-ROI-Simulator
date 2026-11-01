# SQL Server setup and information required

The backend defaults to local SQLite. SQL Server mode is optional and the application never creates or alters SQL Server tables. No successful company connection is claimed until `/api/health/database` is run from an authorized network and reports `connected`.

## Confirm with the database administrator

1. Confirm server name and whether there is a named instance. The supplied host is `INBAAVVMMARSSQL`.
2. Confirm TCP port or instance discovery method. `DB_PORT` is blank by default; the backend does not assume 1433.
3. Confirm database name and authorized network/VPN path. The supplied database is `B4A-S7-T1`.
4. Confirm authentication: Windows Integrated Authentication for the authorized domain identity, or a least-privilege SQL login.
5. Confirm Microsoft ODBC Driver 18 for SQL Server is supported and installed on this Windows laptop.
6. Confirm encryption and certificate validation requirements; provide the certificate chain or required trust settings.
7. Provide actual business schemas, tables, keys, data types, relationships, and read permissions for products, retailers, and promotions.
8. Confirm whether application-owned tables are allowed and the approved database/schema and review process for the proposed script.
9. Confirm least-privilege write permissions, retention/deletion policy, and audit requirements before enabling SQL Server writes.
10. Confirm how to preserve historical price/cost snapshots if existing tables do not contain them.

## Configuration and read-only checks

Create `backend/.env` from `.env.example`. Set `DB_MODE=sqlserver` only after administrator confirmation, then fill confirmed values. Select `DB_AUTH_MODE=windows` or `sql`; SQL mode requires `DB_USERNAME` and `DB_PASSWORD`. Keep `.env` private and uncommitted.

Run Uvicorn from `backend/`, then:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health/database
Invoke-RestMethod http://127.0.0.1:8000/api/health/database/schema
```

The first call attempts a database connection. The second uses read-only SQLAlchemy schema inspection for expected application table names and columns. It does not create objects or use system metadata as business records. A connection can succeed while schema compatibility fails.

The SQL script under `backend/sql/` is for review only; never run it against `B4A-S7-T1` before DBA approval. `SQLSERVER_WRITES_ENABLED` defaults to false and blocks SQL Server create/update/delete routes. Do not enable it until schema compatibility and write authorization are confirmed.

Windows Integrated Authentication uses the Windows identity of the Uvicorn process and does not automatically carry credentials into Linux/WSL. Installing Python `pyodbc` does not install Microsoft's ODBC driver; system installation may require administrator rights.
