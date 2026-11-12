import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole

# базовые поля, общие для всех схем пользователя
class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    role: UserRole = UserRole.STUDENT

# схема для регистрации
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=75)

# схема для ответа апи
class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# схема для возврата jwt токенов
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# схема данных внутри токена
class TokenPayload(BaseModel):
    sub: str | None = None