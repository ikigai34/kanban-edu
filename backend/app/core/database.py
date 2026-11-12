from typing import AsyncGenerator

from fastapi import FastAPI
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# движок подключения
engine = create_async_engine(settings.DATABASE_URL, echo = True, future = True)

# фабрика сессий
AsyncSessionLocal = async_sessionmaker(
    bind = engine,
    class_= AsyncSession,
    autocommit = False,
    autoflush = False,
    expire_on_commit = False,
)

# родитель таблиц
class Base(DeclarativeBase):
    pass

# зависимость для роутов
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session # сессия уходит эндпоинту
        finally:
            await session.close() # возвращение соединения в пул

