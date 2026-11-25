import uuid
from datetime import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class CourseColumn(Base):
    __tablename__ = 'course_columns'

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    course_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    #поряковый номер
    order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    color: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        default="indigo",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    course: Mapped["Course"] = relationship(
        "Course",
        back_populates="columns",
    )

    def __repr__(self) -> str:
        return f"<CourseColumn {self.id}> (course: {self.course_id})>"

