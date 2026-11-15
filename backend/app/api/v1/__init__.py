from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.groups import router as groups_router
from app.api.v1.courses import router as courses_router
from app.api.v1.assignments import router as assignments_router
from app.api.v1.tasks import router as tasks_router  # <-- 1. Импортируем роутер задач

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(groups_router)
api_router.include_router(courses_router)
api_router.include_router(assignments_router)
api_router.include_router(tasks_router)               # <-- 2. Подключаем к общему API