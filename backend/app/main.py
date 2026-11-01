from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings
from app.database.base import Base
from app.database.connection import get_engine, get_session_factory
from app.database.seed import seed_local_development_data
from app.routers import dashboard, health, products, promotions, retailers

# Import the mapped classes so SQLAlchemy metadata is complete before SQLite initialization.
from app import models as _models  # noqa: F401


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    if settings.database_mode == "sqlite":
        Base.metadata.create_all(bind=get_engine())
        with get_session_factory()() as session:
            seed_local_development_data(session)
    # SQL Server mode intentionally never creates, alters, or seeds company tables.
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Promo ROI calculations and promotion history API. SQLite is the default local development database.",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    @application.exception_handler(SQLAlchemyError)
    async def handle_database_error(_: Request, exc: SQLAlchemyError):
        return JSONResponse(
            status_code=503,
            content={"detail": {"code": "database_unavailable", "message": "The configured database is unavailable or does not match the expected application schema."}},
        )

    application.include_router(health.router)
    application.include_router(products.router)
    application.include_router(retailers.router)
    application.include_router(promotions.router)
    application.include_router(dashboard.router)
    return application


app = create_app()
