import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.assignment import Assignment
from app.models.course import Course, CourseGroup
from app.models.study_group import GroupStudent
from app.models.student_task import StudentTask, TaskStatus
from app.models.user import User, UserRole
from app.schemas.assignment import AssignmentCreate, AssignmentResponse
from app.api.deps import get_current_user

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".zip", ".rar", ".txt", ".png", ".jpg"}
router = APIRouter(prefix="/assignments", tags=["Задания"])

# создать задание в курсе + автораздача карточек студентам привязанных групп
@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
        assignment_in: AssignmentCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    # проверка роли
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="создавать задания может только преподователь")

    # проверка существования курса
    course_res = await db.execute(select(Course).where(Course.id == assignment_in.course_id))
    course = course_res.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="дисциплина не найдена")

    # проверка авторства курса
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="у вас нет прав на добавление заданий в эту дисциплину",
        )

    # сохранение шаблона задания
    assignment = Assignment(
        course_id=assignment_in.course_id,
        title=assignment_in.title,
        description=assignment_in.description,
        order=assignment_in.order,
        max_score=assignment_in.max_score,
        file_url=assignment_in.file_url,
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)

    # находим всех студентов групп привязанных к дисциплине
    students_query = (
        select(GroupStudent.user_id)
        .join(CourseGroup, CourseGroup.group_id == GroupStudent.group_id)
        .where(CourseGroup.course_id == course.id)
        .distinct()
    )
    students_res = await db.execute(students_query)
    student_ids = students_res.scalars().all()

    # создание персональной карточки для каждого студента в колонке
    tasks_to_create = [
        StudentTask(
            student_id=s_id,
            assignment_id=assignment.id,
            status=TaskStatus.TODO,
            position=float(assignment.order),
        )
        for s_id in student_ids
    ]

    if tasks_to_create:
        db.add_all(tasks_to_create)
        await db.commit()

    return assignment

# получить список всех заданий курса
@router.get("/course/{course_id}", response_model=list[AssignmentResponse])
async def get_course_assignments(
        course_id: uuid.UUID,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    # проверка существования курса
    course_res = await db.execute(select(Course).where(Course.id == course_id))
    if not course_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="дисциплина не найдена")

    query = (
        select(Assignment)
        .where(Assignment.course_id == course_id)
        .order_by(Assignment.order, Assignment.created_at)
    )
    result = await db.execute(query)
    return result.scalars().all()

# детальная информация по одному заданию
@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
        assignment_id: uuid.UUID,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="задание не найдено")
    return assignment

# загрузка файла к заданию
@router.post("/{assignment_id}/upload", response_model=AssignmentResponse)
async def upload_assignment_file(
        assignment_id: uuid.UUID,
        file: UploadFile = File(...),
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="только преподователь может прикрепить файл к заданию")

    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="задание не найдено")

    # проверка валидности формата
    _, ext = os.path.splitext(file.filename or "")
    if ext.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="недопустимый формат файла")

    upload_dir = os.path.join("uploads", "assignments")
    os.makedirs(upload_dir, exist_ok=True)
    filename= f"manual_{assignment_id}_{uuid.uuid4().hex[:6]}{ext.lower()}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    assignment.file_url = f"/uploads/assignments/{filename}"
    await db.commit()
    await db.refresh(assignment)
    return assignment