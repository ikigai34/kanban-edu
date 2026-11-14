import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.student_task import StudentTask, TaskStatus
from app.models.assignment import Assignment
from app.models.course import Course
from app.schemas.student_task import (
    StudentTaskResponse,
    StudentTaskMove,
    StudentTaskSubmit,
    StudentTaskGrade,
)

router = APIRouter(prefix="/tasks", tags=["задачи"])
