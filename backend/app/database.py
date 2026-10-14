from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.engine import make_url
from .config import get_settings

def normalize_database_url(value: str):
    """Render proporciona postgresql://; la aplicación utiliza psycopg 3."""
    url = make_url(value)
    if url.drivername in {"postgres", "postgresql"}:
        url = url.set(drivername="postgresql+psycopg")
    return url


def create_database_engine(value: str):
    url = normalize_database_url(value)
    options = {"check_same_thread": False, "timeout": 30} if url.get_backend_name() == "sqlite" else {}
    return create_engine(url, pool_pre_ping=True, connect_args=options)


engine = create_database_engine(get_settings().database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
