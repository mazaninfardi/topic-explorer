from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import settings


def _create_engine():
    # Prod: Cloud SQL via the Python Connector (Admin API — no socket path).
    if settings.instance_connection_name:
        from google.cloud.sql.connector import create_async_connector

        holder: dict = {}

        async def getconn():
            # Create the connector lazily, bound to the running event loop.
            if "connector" not in holder:
                holder["connector"] = await create_async_connector()
            return await holder["connector"].connect_async(
                settings.instance_connection_name,
                "asyncpg",
                user=settings.db_user,
                password=settings.db_pass,
                db=settings.db_name,
            )

        return create_async_engine("postgresql+asyncpg://", async_creator=getconn, pool_pre_ping=True)
    # Local dev: plain DATABASE_URL (Docker Postgres).
    return create_async_engine(settings.database_url, pool_pre_ping=True)


engine = _create_engine()
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def init_db() -> None:
    # Prototype: create tables on startup. (Alembic migrations come later.)
    from . import models  # noqa: F401 - register models on Base.metadata

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
