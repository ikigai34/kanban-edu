import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.student_task import StudentTask, TaskStatus
from app.models.assignment import Assignment
from app.models.course import Course
from app.models.course_column import CourseColumn
from app.schemas.student_task import (
    StudentTaskResponse,
    StudentTaskMove,
    StudentTaskSubmit,
    StudentTaskGrade,
)

router = APIRouter(prefix="/tasks", tags=["задачи"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".zip", ".rar", ".txt", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 20 * 1024 * 1024

# получить все задачи студента по курсу
@router.get("/course/{course_id}", response_model=List[StudentTaskResponse])
async def get_my_tasks_for_course(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Находим все задачи студента, относящиеся к заданиям этого курса
    query = (
        select(StudentTask)
        .join(Assignment, StudentTask.assignment_id == Assignment.id)
        .where(
            Assignment.course_id == course_id,
            StudentTask.student_id == current_user.id,
        )
        .order_by(StudentTask.position.asc())
    )
    result = await db.execute(query)
    return result.scalars().all()

# получить все карточки курса
@router.get("/course/{course_id}/all", response_model=List[StudentTaskResponse])
async def get_all_tasks_for_teacher(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # проверка что запрашивает преподователь или админ
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="просматривать это может только преподователь")
    query = (
        select(StudentTask)
        .join(Assignment, StudentTask.assignment_id == Assignment.id)
        .where(Assignment.course_id == course_id)
        .order_by(StudentTask.created_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()

# drag and drop
@router.patch("/{task_id}/move", response_model=StudentTaskResponse)
async def move_task(
        task_id: uuid.UUID,
        move_data: StudentTaskMove,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(StudentTask).where(StudentTask.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="задача не найдена")

    # перемещать карточку может владелец (студент), преподаватель или админ
    if task.student_id != current_user.id and current_user.role not in (UserRole.ADMIN, UserRole.TEACHER):
        raise HTTPException(status_code=403, detail="нельзя перемещать чужую задачу")

    # обновление статуса и позиции
    if move_data.column_id is not None:
        assignment = await db.get(Assignment, task.assignment_id)
        column = await db.get(CourseColumn, move_data.column_id)
        if not column or not assignment or column.course_id != assignment.course_id:
            raise HTTPException(status_code=404)

    task.status = move_data.status
    task.column_id = move_data.column_id
    task.position = move_data.position

    await db.commit()
    await db.refresh(task)
    return task

# загрузка файла отчета
@router.post("/{task_id}/upload", response_model=StudentTaskResponse)
async def upload_task_file(
        task_id: uuid.UUID,
        file: UploadFile = File(...),
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    # поиск задания в базе
    result = await db.execute(select(StudentTask).where(StudentTask.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="задание не найдено")

    if task.student_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="вы не имеете доступа к этому заданию")

    # проверка формата файла
    _, ext = os.path.splitext(file.filename or "")
    if ext.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="недопустимый формат файла")

    # сохранение файла
    upload_dir = os.path.join("uploads", "reports")
    os.makedirs(upload_dir, exist_ok=True)
    filename=f"{task_id}_{uuid.uuid4().hex[:6]}{ext.lower()}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    task.file_url = f"/uploads/reports/{filename}"
    await db.commit()
    await db.refresh(task)
    return task

# сдача работы на проверку
@router.patch("/{task_id}/submit", response_model=StudentTaskResponse)
async def submit_task(
        task_id: uuid.UUID,
        submit_data: StudentTaskSubmit,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(StudentTask).where(StudentTask.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="задание не найдено")

    if task.student_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="вы не имеете доступа к этому заданию")

    # обновление комментария если они переданы
    if submit_data.comment is not None:
        task.comment = submit_data.comment
    if submit_data.file_url is not None:
        task.file_url = submit_data.file_url

    # обновление статуса картчоки
    task.status = TaskStatus.ON_REVIEW

    await db.commit()
    await db.refresh(task)
    return task

# проверка работы
@router.patch("/{task_id}/grade", response_model=StudentTaskResponse)
async def grade_task(
        task_id: uuid.UUID,
        grade_data: StudentTaskGrade,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="только преподователи могут оценивать работу")

    result = await db.execute(select(StudentTask).where(StudentTask.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="задание не найдено")

    # оценка, комментарий и статус
    if grade_data.score is not None:
        task.score = grade_data.score
    if grade_data.teacher_comment is not None:
        task.teacher_comment = grade_data.teacher_comment

    task.status = grade_data.status

    await db.commit()
    await db.refresh(task)
    return task