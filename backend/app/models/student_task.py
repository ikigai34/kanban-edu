import enum
import uuid
from datetime import datetime

from sqlalchemy import Float, Text, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TaskStatus(str, enum.Enum):
    TODO = "todo"                 # Не начато
    IN_PROGRESS = "in_progress"   # В процессе
    ON_REVIEW = "on_review"       # На проверке у преподавателя
    REVISION = "revision"         # Отправлено на доработку
    DONE = "done"                 # Зачтено / Выполнено


class StudentTask(Base):
    __tablename__ = "student_tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    assignment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False,
    )

    status: Mapped[TaskStatus] = mapped_column(
        SQLEnum(TaskStatus),
        default=TaskStatus.TODO,
        nullable=False,
    )

    position: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    # Ответ / комментарий студента при отправке на проверку
    comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Итоговый балл (5, 85.5 и т.д. Либо None, если просто зачёт)
    score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    # Замечания / рецензия преподавателя
    teacher_comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    file_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<StudentTask {self.id} ({self.status})>"
