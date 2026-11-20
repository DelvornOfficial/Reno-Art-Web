from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# PostgreSQL Connection Pool configured safely within max_connections limit
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_size=15,             # Safe persistent connection pool
    max_overflow=10,          # Burst expansion up to 25 simultaneous queries
    pool_timeout=15,          # Fast timeout
    pool_recycle=1800,        # Recycle connections
    pool_pre_ping=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    """Dependency for injecting async db session into routes"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
