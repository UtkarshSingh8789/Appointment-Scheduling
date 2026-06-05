"""Database setup and session management."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


async def get_db() -> AsyncSession:
    """Dependency that provides a database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    """Create all tables in the database."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _ensure_notification_enum_values(conn)
        await _ensure_appointment_financial_columns(conn)


async def _ensure_notification_enum_values(conn) -> None:
    """Ensure notification enum values exist for older databases."""
    if conn.dialect.name != "postgresql":
        return

    await conn.exec_driver_sql(
        "ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'APPOINTMENT_RESCHEDULED'"
    )


async def _ensure_appointment_financial_columns(conn) -> None:
    """Add appointment financial columns for existing databases."""
    if conn.dialect.name != "postgresql":
        return

    await conn.exec_driver_sql(
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS base_amount DOUBLE PRECISION NOT NULL DEFAULT 0"
    )
    await conn.exec_driver_sql(
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS gst_amount DOUBLE PRECISION NOT NULL DEFAULT 0"
    )
    await conn.exec_driver_sql(
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS discount_amount DOUBLE PRECISION NOT NULL DEFAULT 0"
    )
    await conn.exec_driver_sql(
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_amount DOUBLE PRECISION NOT NULL DEFAULT 0"
    )
    await conn.exec_driver_sql(
        "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_fee DOUBLE PRECISION NOT NULL DEFAULT 50"
    )
