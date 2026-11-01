from collections.abc import Generator

from sqlalchemy.orm import Session

from app.database.connection import get_session_factory


def get_db() -> Generator[Session, None, None]:
    session = get_session_factory()()
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
