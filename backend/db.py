import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

def _normalize_database_url(url: str) -> str:
    """
    Some hosts provide DATABASE_URL like 'postgres://...'
    SQLAlchemy expects 'postgresql+psycopg://...'
    """
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
DATABASE_URL = _normalize_database_url(DATABASE_URL)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)

Base = declarative_base()
