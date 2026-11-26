import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.student_task import TaskStatus

class StudentTaskResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    assignment_id: uuid.UUID
    column_id: uuid.UUID | None = None
    status: TaskStatus
    position: float
    comment: str | None = None
    score: float | None = None
    teacher_comment: str | None = None
    file_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# drag and drop
class StudentTaskMove(BaseModel):
    status: TaskStatus
    column_id: uuid.UUID | None = None
    position: float = Field(ge=0.0, description="дробный индекс для сортировки в колонке")

# схема сдачи работы
class StudentTaskSubmit(BaseModel):
    comment: str | None = Field(default=None, description="оставьте комментарий")
    file_url: str | None = Field(default=None, description="ссылка на загруженный файл")

# схема для проверки преподователем
class StudentTaskGrade(BaseModel):
    score: float | None = Field(default=None, ge=0.0, description="оценка работы")
    teacher_comment: str | None = Field(default=None, description="комментарий к работе")
    status: TaskStatus = Field(default=TaskStatus.DONE, description="новый статус работы")

