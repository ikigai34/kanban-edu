import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.study_group import StudyGroup, GroupStudent
from app.models.user import User
from app.schemas.study_group import StudyGroupCreate, StudyGroupResponse, GroupAddStudent
from app.schemas.user import UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/groups", tags=["Учебные группы"])

# new group
@router.post("/", response_model=StudyGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
        group_in: StudyGroupCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(StudyGroup).where(StudyGroup.name == group_in.name))
    existing_group = result.scalar_one_or_none()
    if existing_group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="группа с таким названием уже сущесвтует"
        )
    group = StudyGroup(name=group_in.name)
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return group

@router.get("/", response_model = list[StudyGroupResponse])
async def get_groups(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(StudyGroup).order_by(StudyGroup.name))
    groups = result.scalars().all()
    return groups

@router.post("/{group_id}/students", status_code=status.HTTP_200_OK)
async def add_student_to_group(
    group_id: uuid.UUID,
    data: GroupAddStudent,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # проверка существующих групп
    group_res = await db.execute(select(StudyGroup).where(StudyGroup.id == group_id))
    group = group_res.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=400,detail="группа не найдена")

    # проверка существования студента
    user_res = await db.execute(select(User).where(User.id == data.user_id))
    student = user_res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="пользователь не найден")

    # проверка, не добавлен ли он уже в эту группу
    link_res = await db.execute(
        select(GroupStudent).where(
            GroupStudent.group_id == group_id,
            GroupStudent.user_id == data.user_id,
        )
    )
    if link_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="пользователь уже состоит в этой группе")

    # создание связи
    link = GroupStudent(group_id=group_id, user_id=data.user_id)
    db.add(link)
    await db.commit()
    return {"message": f"студент {student.full_name} успешно добавлен в группу {group.name}"}

# получение списка всех студентов конкретной группы
@router.get("/{group_id}/students", response_model = list[UserResponse])
async def get_group_students(
        group_id: uuid.UUID,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    # выбор пользователей через связывание с group_students
    query = (
        select(User)
        .join(GroupStudent, GroupStudent.user_id == User.id)
        .where(GroupStudent.group_id == group_id)
        .order_by(User.full_name)
    )
    result = await db.execute(query)
    students = result.scalars().all()
    return students