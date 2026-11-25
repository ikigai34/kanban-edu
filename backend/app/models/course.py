import uuid
from datetime import datetime
from typing import List

from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# Промежуточная таблица: связь Курс <-> Группа
class CourseGroup(Base):
    __tablename__ = "course_groups"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    course_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )

    group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("study_groups.id", ondelete="CASCADE"),
        nullable=False,
    )


# Дисциплина / Доска курса
class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    teacher_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    columns: Mapped[List["CourseColumn"]] = relationship(
        "CourseColumn",
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="CourseColumn.order",
    )

    def __repr__(self) -> str:
        return f"<Course {self.title}>"
