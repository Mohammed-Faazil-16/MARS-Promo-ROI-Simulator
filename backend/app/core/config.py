from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MARS Promo ROI Simulator API"
    app_version: str = "1.0.0"
    environment: str = "development"
    database_mode: str = Field(default="sqlite", alias="DB_MODE")
    database_url: str | None = Field(default=None, alias="DATABASE_URL")
    sqlite_path: str = Field(default="./data/promo_roi_dev.db", alias="SQLITE_PATH")
    db_server: str = Field(default="INBAAVVMMARSSQL", alias="DB_SERVER")
    db_port: int | None = Field(default=None, alias="DB_PORT", ge=1, le=65535)
    db_instance: str | None = Field(default=None, alias="DB_INSTANCE")
    db_name: str = Field(default="B4A-S7-T1", alias="DB_NAME")
    db_driver: str = Field(default="ODBC Driver 18 for SQL Server", alias="DB_DRIVER")
    db_auth_mode: str = Field(default="windows", alias="DB_AUTH_MODE")
    db_username: str | None = Field(default=None, alias="DB_USERNAME")
    db_password: str | None = Field(default=None, alias="DB_PASSWORD")
    db_encrypt: str = Field(default="yes", alias="DB_ENCRYPT")
    db_trust_server_certificate: str = Field(default="yes", alias="DB_TRUST_SERVER_CERTIFICATE")
    db_schema: str = Field(default="dbo", alias="DB_SCHEMA")
    sqlserver_writes_enabled: bool = Field(default=False, alias="SQLSERVER_WRITES_ENABLED")
    approval_roi_threshold: str = Field(default="20", alias="APPROVAL_ROI_THRESHOLD")
    cors_origins: str = Field(default="http://localhost:5173,http://127.0.0.1:5173", alias="CORS_ORIGINS")
    page_size_default: int = 50
    page_size_max: int = 200

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", populate_by_name=True, env_ignore_empty=True
    )

    @field_validator("database_mode")
    @classmethod
    def validate_database_mode(cls, value: str) -> str:
        value = value.lower().strip()
        if value not in {"sqlite", "sqlserver"}:
            raise ValueError("DB_MODE must be either 'sqlite' or 'sqlserver'.")
        return value

    @field_validator("db_auth_mode")
    @classmethod
    def validate_auth_mode(cls, value: str) -> str:
        value = value.lower().strip()
        if value not in {"windows", "sql"}:
            raise ValueError("DB_AUTH_MODE must be 'windows' or 'sql'.")
        return value

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def approval_threshold(self):
        from decimal import Decimal, InvalidOperation

        try:
            threshold = Decimal(self.approval_roi_threshold)
        except InvalidOperation as exc:
            raise ValueError("APPROVAL_ROI_THRESHOLD must be a valid decimal percentage.") from exc
        if not threshold.is_finite():
            raise ValueError("APPROVAL_ROI_THRESHOLD must be finite.")
        return threshold

    def sqlalchemy_url(self) -> str:
        if self.database_url:
            return self.database_url
        if self.database_mode == "sqlite":
            return f"sqlite:///{self.sqlite_path.replace(chr(92), '/')}"

        from sqlalchemy.engine import URL
        server = self.db_server.strip()
        if self.db_instance:
            server = f"{server}\\{self.db_instance.strip()}"
        if self.db_port:
            server = f"{server},{self.db_port}"
        parts = [f"DRIVER={{{self.db_driver}}}", f"SERVER={server}", f"DATABASE={self.db_name}"]
        if self.db_auth_mode == "windows":
            parts.append("Trusted_Connection=yes")
        else:
            if not self.db_username or not self.db_password:
                raise ValueError("DB_USERNAME and DB_PASSWORD are required when DB_AUTH_MODE=sql.")
            parts.extend([f"UID={self._odbc_value(self.db_username)}", f"PWD={self._odbc_value(self.db_password)}"])
        parts.extend([
            f"Encrypt={self.db_encrypt}",
            f"TrustServerCertificate={self.db_trust_server_certificate}",
        ])
        odbc_connect = ";".join(parts) + ";"
        return URL.create("mssql+pyodbc", query={"odbc_connect": odbc_connect}).render_as_string(hide_password=False)

    @staticmethod
    def _odbc_value(value: str) -> str:
        """Brace-quote ODBC values containing connection-string delimiters."""
        if any(character in value for character in ";{}") or value != value.strip():
            return "{" + value.replace("}", "}}") + "}"
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
