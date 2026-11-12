import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

# базовые поля дисциплины
class CourseBase(BaseModel):
    title: str = Field(
        min_length=2,
        max_length=255,
        examples=["Программирование"],
    )
    description: str | None = Field(
        default=None,
        examples=["Описание дисциплины"]
    )

# входные данные при создании курса (teacher_id берется из токена)
class CourseCreate(CourseBase):
    pass

# схема ответа апи
class CourseResponse(CourseBase):
    id: uuid.UUID
    teacher_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# схема привязки группы к курсу
class CourseAssignGroup(BaseModel):
    group_id: uuid.UUID

