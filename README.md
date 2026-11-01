# MARS Promo ROI Simulator

React/Vite frontend and FastAPI backend for evaluating promotional ROI. The backend uses a persistent local SQLite database by default. Microsoft SQL Server remains an optional, explicitly configured integration.

## Quick start on a new Windows laptop

1. Extract `MARS_Promo_ROI_Portable.zip`.
2. Open the extracted `MARS_Promo_ROI` folder in VS Code.
3. Open a PowerShell terminal at the project root.
4. Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` if PowerShell blocks local scripts. This change applies only to this terminal.
5. Run `.\setup.ps1` once and allow the installers if requested.
6. Run `.\start.ps1`.
7. Open the frontend at <http://127.0.0.1:5173>.

`setup.ps1` detects Python 3.11–3.14 and selects the newest compatible installed interpreter, then uses it to create `backend/.venv`. It reuses compatible software and installs dependencies into that environment and `promo-roi-frontend/node_modules`; Python and Node packages are downloaded from their configured package registries when absent. It does not install application packages globally. Internet access is needed for first-time dependency installation. SQLite lets the application run without office network access.

## Prerequisites and compatibility

- Windows 10 or 11.
- PowerShell 5.1 or later.
- Python 3.11, 3.12, 3.13, or 3.14 (including Python 3.14.6).
- Node.js 20.19+ or 22.12+ (as required by the locked Vite version) and npm. Locked ESLint packages request Node 22.13+ for linting; setup reports this if using 22.12.
- Network access for first-time package installation.
- Git is optional.

Run `scripts\doctor.ps1` for a diagnostic report. The script checks Python, Node/npm, dependency folders, required files, the configured backend/frontend ports, and SQL Server ODBC Driver 18. ODBC is optional for SQLite. Set `MARS_BACKEND_PORT` or `MARS_FRONTEND_PORT` before running the doctor to check custom ports.

## Setup and run

From the project root, run:

```powershell
.\setup.ps1
.\start.ps1
```

`start.ps1` opens separate PowerShell windows for the backend and frontend. It uses ports 8001 and 5173 by default. If either port is occupied or reserved, choose an available port explicitly. For example, to keep the backend at 8001 and run Vite at 5174:

```powershell
$env:MARS_FRONTEND_PORT = '5174'
.\start.ps1
```

You can also set `$env:MARS_BACKEND_PORT = '8002'`. Startup passes the selected frontend origin to backend CORS and makes `VITE_API_BASE_URL` available to Vite as `http://127.0.0.1:<backend-port>/api`. The existing React code currently uses local data/localStorage and does not make backend API requests; no UI components or source were changed for this port configuration. The scripts never pick a random port or stop another process using a port.

| Service | URL |
| --- | --- |
| React/Vite (default) | <http://127.0.0.1:5173> |
| FastAPI (default) | <http://127.0.0.1:8001> |
| Swagger UI (default) | <http://127.0.0.1:8001/docs> |
| Health (default) | <http://127.0.0.1:8001/api/health> |

Stop only the terminal/process trees started for this extracted project with:

```powershell
.\scripts\stop.ps1
```

You can also close the two application terminals manually.

## Backend tests and frontend build

```powershell
Push-Location .\backend
& .\.venv\Scripts\python.exe -m pytest tests -q
Pop-Location
Push-Location .\promo-roi-frontend
npm.cmd run build
Pop-Location
```

The Vite build writes generated assets to `promo-roi-frontend/dist`. It is excluded from portable archives.

## Configuration and local data

`backend/.env.example` is a safe template. The backend uses SQLite by default and initializes application-owned development tables at startup. Local SQLite files are stored under `backend/data` as configured by `SQLITE_PATH` and remain on the current laptop; they are not copied into the ZIP. Local records persist across restarts.

To configure local settings, copy the template to `backend/.env` and adjust values as needed. Never put credentials in the template or share a populated `.env` file.

## Optional office SQL Server

SQL Server mode is not used by setup or startup. The default remains SQLite. To prepare an office configuration, coordinate with the database administrator and then set `DB_MODE=sqlserver` in a local `backend/.env`. Configure `DB_SERVER=INBAAVVMMARSSQL`, `DB_NAME=B4A-S7-T1`, optional `DB_PORT` or `DB_INSTANCE`, `DB_AUTH_MODE`, encryption, certificate trust, and credentials through environment variables. Windows integrated authentication requires a Windows environment and an authorized identity; it does not automatically work from Linux/WSL. SQL login credentials should be stored only in a private local `.env` file.

ODBC Driver 18 is required only for a SQL Server connection. The setup script does not install it. If needed, request the approved Microsoft ODBC Driver 18 installer and connection details from IT. The application does not automatically create or modify company tables.

## Creating the portable ZIP

Run:

```powershell
.\package.ps1
```

The script stages a clean source copy in a temporary folder, creates `MARS_Promo_ROI_Portable.zip` in the project root, and verifies its contents. It omits `.env`, credentials, SQLite databases, `.venv`, `node_modules`, `.git`, caches, build output, and logs without deleting those files from the working project.

## Troubleshooting

- **PowerShell blocks scripts:** use `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in the current terminal, then rerun. No permanent policy change is needed.
- **Python or Node is missing:** setup tries `winget` with official package IDs. If `winget` is unavailable, install Python from <https://www.python.org/downloads/windows/> or Node LTS from <https://nodejs.org/en/download>, reopen PowerShell, and rerun setup. Installation may require administrator approval depending on laptop policy.
- **Installer not available or blocked:** ask IT to install the official runtime or use the official download links above. Setup reports the missing prerequisite and does not claim success.
- **A development port is occupied or reserved:** the scripts do not stop the existing process. Set `$env:MARS_BACKEND_PORT` and/or `$env:MARS_FRONTEND_PORT` to available ports, then rerun `scripts\doctor.ps1` and `.\start.ps1`. Vite uses `--strictPort` so it cannot silently switch to another port.
- **Package installation fails:** confirm network/proxy access to PyPI and npm, then rerun `.\setup.ps1`.
- **SQL Server unavailable:** remain in SQLite mode. Office access, authentication, database permissions, server instance/port, and ODBC Driver 18 must be confirmed with IT before enabling SQL Server.
- **Database health fails in SQL Server mode:** inspect `/api/health/database` and server-side startup output; it does not expose credentials.

## Project documentation

- Backend setup and API overview: `backend/README.md`
- API contract: `docs/API_CONTRACT.md`
- SQL Server setup: `docs/SQL_SERVER_SETUP.md`
- Integration status: `docs/INTEGRATION_STATUS.md`
- Proposed SQL schema for review: `backend/sql/001_create_application_tables.sql` (never executed automatically)
