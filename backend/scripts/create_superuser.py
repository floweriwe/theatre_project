#!/usr/bin/env python
"""
Скрипт создания суперпользователя.

Запуск:
    python -m scripts.create_superuser
    
Или через Docker:
    docker-compose exec backend python -m scripts.create_superuser
"""
import asyncio
import sys
from getpass import getpass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import hash_password
from app.database.session import get_session_factory, init_db, close_db
from app.models.user import User


async def create_superuser(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
) -> User:
    """
    Создать суперпользователя.
    
    Args:
        email: Email
        password: Пароль
        first_name: Имя
        last_name: Фамилия
        
    Returns:
        Созданный пользователь
    """
    await init_db()
    
    factory = get_session_factory()
    async with factory() as session:
        # Проверяем, что email не занят
        result = await session.execute(
            select(User).where(User.email == email)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"❌ Пользователь с email {email} уже существует!")
            sys.exit(1)
        
        # Создаём суперпользователя
        user = User(
            email=email,
            hashed_password=hash_password(password),
            first_name=first_name,
            last_name=last_name,
            is_active=True,
            is_verified=True,  # Суперпользователь сразу верифицирован
            is_superuser=True,
        )
        
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        print(f"✅ Суперпользователь создан!")
        print(f"   Email: {email}")
        print(f"   Имя: {first_name} {last_name}")
        
        return user


async def main():
    """Точка входа скрипта."""
    print("=" * 50)
    print("Создание суперпользователя Theatre")
    print("=" * 50)
    print()
    
    # Получаем данные от пользователя
    email = input("Email: ").strip()
    if not email:
        print("❌ Email не может быть пустым!")
        sys.exit(1)
    
    password = getpass("Пароль: ")
    if len(password) < 8:
        print("❌ Пароль должен быть не менее 8 символов!")
        sys.exit(1)
    
    password_confirm = getpass("Подтвердите пароль: ")
    if password != password_confirm:
        print("❌ Пароли не совпадают!")
        sys.exit(1)
    
    first_name = input("Имя: ").strip()
    if not first_name:
        print("❌ Имя не может быть пустым!")
        sys.exit(1)
    
    last_name = input("Фамилия: ").strip()
    if not last_name:
        print("❌ Фамилия не может быть пустой!")
        sys.exit(1)
    
    print()
    
    try:
        await create_superuser(email, password, first_name, last_name)
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(main())
