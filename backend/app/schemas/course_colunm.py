import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class CourseColumnBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="Название столбца")
    color: str | None = Field(default="indigo", description="Цвет")

class CourseColumnCreate(CourseColumnBase):
    order: int | None = Field(default=None, ge=0, description="Порядковый номер")

class CourseColumnUpdate(CourseColumnBase):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    order: int | None = Field(default=None, ge=0)
    color: str | None = None

class CourseColumnResponse(CourseColumnBase):
    id: uuid.UUID
    course_id: uuid.UUID
    order: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)