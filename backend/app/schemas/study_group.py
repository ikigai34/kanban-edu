import uuid
from datetime import datetime
from pydantic import BaseModel, Field

# base
class StudyGroupBase(BaseModel):
    name: str = Field(min_length=1, max_length=100, examples=["ПО-41"])

# create
class StudyGroupCreate(StudyGroupBase):
    pass

# api response
class StudyGroupResponse(StudyGroupBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

# add new
class GroupAddStudent(BaseModel):
    user_id: uuid.UUID
