import  uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.course import Course, CourseGroup
from app.models.study_group import StudyGroup, GroupStudent
from app.models.user import User, UserRole
from app.schemas.course import CourseCreate, CourseResponse, CourseAssignGroup
from app.schemas.study_group import StudyGroupResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/courses", tags=["Дисциплины"])

# новая дисциплина
@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
        course_in: CourseCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="создавать дисциплины может только преподователь",
        )

    course = Course(
        title=course_in.title,
        description=course_in.description,
        teacher_id=current_user.id,
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course

# получение списка доступных пользователю дисциплин
@router.get("/", response_model=list[CourseResponse])
async def get_courses(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.TEACHER:
        query = (
            select(Course)
            .where(Course.teacher_id == current_user.id)
            .order_by(Course.title)
        )
    elif current_user.role == UserRole.STUDENT:
        # идем по цепочке курс - курсгруп - групстудент до студента
        query = (
            select(Course)
            .join(CourseGroup, CourseGroup.course_id == Course.id)
            .join(GroupStudent, GroupStudent.group_id == CourseGroup.group_id)
            .where(GroupStudent.user_id == current_user.id)
            .distinct()
            .order_by(Course.title)
        )
    else:
        # админ видит все курсы
        query = select(Course).order_by(Course.title)

    result = await db.execute(query)
    return result.scalars().all()

#привязать учебную группу
@router.post("/{course_id}/groups", status_code=status.HTTP_200_OK)
async def assign_group_to_course(
        course_id: uuid.UUID,
        data: CourseAssignGroup,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    # проверка существования курса
    course_res = await db.execute(select(Course).where(Course.id == course_id))
    course = course_res.scalar_one_or_none()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Дисциплина не найдена",
        )

    # проверяем, чято курс рдеактирует его автор или админ
    if course.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="У вас нет прав на управление этой дисциплиной"
        )

    # проверка существования группы
    group_res = await db.execute(select(StudyGroup).where(StudyGroup.id == data.group_id))
    group = group_res.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")

    # проверка не привязана ли группа уже
    link_res = await db.execute(
        select(CourseGroup).where(
            CourseGroup.course_id == course_id,
            CourseGroup.group_id == data.group_id,
        )
    )
    if link_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="группа уже привязана к этой дисциплине")

    link = CourseGroup(course_id=course_id, group_id=data.group_id)
    db.add(link)
    await db.commit()
    return {"message": f"группа {group.name} привязана к дисциплине {course.title}"}

# получаем список групп, привязанных к дисциплине
@router.get("/{course_id}/groups", response_model=list[StudyGroupResponse])
async def get_course_groups(
        course_id: uuid.UUID,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    course_res = await db.execute(select(Course).where(Course.id == course_id))
    if not course_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Дисциплина не найдена")

    query = (
        select(StudyGroup)
        .join(CourseGroup, CourseGroup.group_id == StudyGroup.id)
        .where(CourseGroup.course_id == course_id)
        .order_by(StudyGroup.name)
    )

    result = await db.execute(query)
    return result.scalars().all()