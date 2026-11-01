from fastapi import APIRouter
from sqlalchemy import inspect, text

from app.core.config import get_settings
from app.database.connection import get_engine

router = APIRouter(prefix="/api/health", tags=["health"])

REQUIRED_COLUMNS = {
    "PRODUCTS": {"ProductId", "Name", "Category", "Brand", "UnitCost", "NormalPrice", "IsActive", "IsDevelopmentSeed", "CreatedAt", "UpdatedAt"},
    "RETAILERS": {"RetailerId", "Name", "Region", "AccountManager", "IsActive", "IsDevelopmentSeed", "CreatedAt", "UpdatedAt"},
    "PROMOTIONS": {"PromotionId", "Name", "ProductId", "RetailerId", "ProductNameSnapshot", "RetailerNameSnapshot", "RegionSnapshot", "Price", "Cost", "DiscountPercent", "DurationWeeks", "BaselineUnitsPerWeek", "PromoUnitsPerWeek", "PromoPrice", "NormalMargin", "PromoMargin", "ExtraUnitsPerWeek", "ExtraUnits", "UpliftPercent", "ProfitWithout", "ProfitWith", "ExtraProfit", "PromoCost", "ROI", "BreakEvenPromoUnits", "Verdict", "CalculationStatus", "ROIReason", "VerdictReason", "CreatedAt", "UpdatedAt"},
}


@router.get("")
def health():
    settings = get_settings()
    return {"status": "ok", "service": settings.app_name, "version": settings.app_version, "database_mode": settings.database_mode}


@router.get("/database")
def database_health():
    settings = get_settings()
    try:
        engine = get_engine()
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "connected", "mode": settings.database_mode, "database": settings.db_name if settings.database_mode == "sqlserver" else "local SQLite"}
    except Exception as exc:  # Connection and driver errors are reported safely, without connection strings.
        reason = str(exc)
        if "pyodbc" in reason.lower() or "odbc" in reason.lower():
            message = "SQL Server connection failed. Confirm Microsoft ODBC Driver 18 and the pyodbc dependency are installed."
        elif "login" in reason.lower() or "password" in reason.lower() or "authentication" in reason.lower():
            message = "SQL Server authentication failed. Check DB_AUTH_MODE and authorized credentials."
        else:
            message = "Database connection failed. Check network/VPN access, server/instance, port, database, authentication, and TLS settings."
        return {"status": "unavailable", "mode": settings.database_mode, "message": message}


@router.get("/database/schema")
def database_schema_inspection():
    """Read-only SQLAlchemy inspection of expected application tables and columns."""
    settings = get_settings()
    try:
        engine = get_engine()
        inspector = inspect(engine)
        tables = set(inspector.get_table_names(schema=settings.db_schema if settings.database_mode == "sqlserver" else None))
        result = {}
        all_compatible = True
        for table, expected in REQUIRED_COLUMNS.items():
            actual_table = next((name for name in tables if name.upper() == table), None)
            actual_columns = set()
            if actual_table:
                actual_columns = {column["name"].casefold() for column in inspector.get_columns(actual_table, schema=settings.db_schema if settings.database_mode == "sqlserver" else None)}
            missing = sorted(column for column in expected if column.casefold() not in actual_columns)
            compatible = actual_table is not None and not missing
            all_compatible = all_compatible and compatible
            result[table] = {"exists": actual_table is not None, "compatible": compatible, "missing_columns": missing}
        return {"mode": settings.database_mode, "schema": settings.db_schema if settings.database_mode == "sqlserver" else None, "read_only": True, "compatible": all_compatible, "tables": result}
    except Exception:
        return {"mode": settings.database_mode, "schema": settings.db_schema if settings.database_mode == "sqlserver" else None, "read_only": True, "compatible": False, "status": "unavailable", "message": "Schema inspection failed. Check database health and read metadata permissions."}
