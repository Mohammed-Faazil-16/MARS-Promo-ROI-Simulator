from functools import lru_cache
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings


@lru_cache
def get_engine():
    settings = get_settings()
    url = settings.sqlalchemy_url()
    parsed = make_url(url)
    kwargs = {"pool_pre_ping": True, "future": True}
    if parsed.get_backend_name() == "sqlite":
        kwargs["connect_args"] = {"check_same_thread": False, "timeout": 30}
        if parsed.database and parsed.database != ":memory:":
            Path(parsed.database).expanduser().resolve().parent.mkdir(parents=True, exist_ok=True)
    return create_engine(url, **kwargs)


@lru_cache
def get_session_factory():
    return sessionmaker(bind=get_engine(), autoflush=False, autocommit=False, expire_on_commit=False)


def dispose_engine() -> None:
    if get_engine.cache_info().currsize:
        get_engine().dispose()
        get_engine.cache_clear()
        get_session_factory.cache_clear()


def database_mode() -> str:
    return get_settings().database_mode
