import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

# Общие поля задания
class AssignmentBase(BaseModel):
    title: str = Field(
        min_length=2,
        max_length=255,
        examples=["Лабораторная работа"]
    )
    description: str | None = Field(
        default=None,
        examples=["Описание"]
    )
    order: int = Field(default=0, ge=0)
    max_score: float | None = Field(default=100.0, gt=0)

# данныен для создания задания преподователем
class AssignmentCreate(AssignmentBase):
    course_id: uuid.UUID

# Ответ апи
class AssignmentResponse(AssignmentBase):
    id: uuid.UUID
    course_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)