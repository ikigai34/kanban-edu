import os

from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.config import settings
from app.core.database import get_db
from app.api.v1 import api_router

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# подключение api роутеров
app.include_router(api_router, prefix=settings.API_V1_STR)


# проверка работоспособности
@app.get("/health", tags=["Служебные"])
async def health_check(
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(text("SELECT 1"))
        scalar = result.scalar()
        return {"status": "ok", "db_connection": scalar == 1}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

