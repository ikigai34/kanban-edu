from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token
from app.api.deps import get_current_user


router = APIRouter(prefix='/auth', tags = ["аутентификация"])

# регистрация
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
        user_in: UserCreate,
        db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )

    user = User(
        email = user_in.email,
        hashed_password = hash_password(user_in.password),
        full_name = user_in.full_name,
        role = user_in.role,
    )
    db.add(user)
    await db.commit()      # фиксация транзакции в postgre
    await db.refresh(user) # чтение из базы сгенерированных данных
    return user

# вход
@router.post("/login", response_model=Token)
async def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный email или пароль"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Аккаунт деактивирован"
        )

    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer"}

# текущий пользователь
@router.get("/me", response_model=UserResponse)
async def get_me(
        current_user: User = Depends(get_current_user),
):
    return current_user