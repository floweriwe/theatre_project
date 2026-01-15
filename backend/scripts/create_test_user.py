"""
Скрипт создания тестового пользователя.

Использование:
    python -m scripts.create_test_user

Или через Docker:
    docker-compose exec backend python -m scripts.create_test_user
"""
import asyncio
import sys
from pathlib import Path

# Добавляем корневую директорию в путь
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.database.session import async_session_factory, init_db
from app.models import User, Role, UserRole
from app.core.security import get_password_hash


async def create_test_user():
    """Создать тестового пользователя с ролью admin."""
    
    # Инициализируем БД
    await init_db()
    
    async with async_session_factory() as session:
        # Проверяем, есть ли уже пользователь
        result = await session.execute(
            select(User).where(User.email == "admin@theatre.test")
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print("✅ Тестовый пользователь уже существует:")
            print(f"   Email: admin@theatre.test")
            print(f"   Password: admin123")
            return
        
        # Создаём роль admin если её нет
        role_result = await session.execute(
            select(Role).where(Role.code == "admin")
        )
        admin_role = role_result.scalar_one_or_none()
        
        if not admin_role:
            admin_role = Role(
                code="admin",
                name="Администратор",
                description="Полный доступ к системе",
                permissions=["admin:full"],
                is_system=True,
            )
            session.add(admin_role)
            await session.flush()
            print("✅ Создана роль admin")
        
        # Создаём пользователя
        user = User(
            email="admin@theatre.test",
            hashed_password=get_password_hash("admin123"),
            first_name="Admin",
            last_name="User",
            is_active=True,
            is_verified=True,
        )
        session.add(user)
        await session.flush()
        
        # Назначаем роль
        user_role = UserRole(
            user_id=user.id,
            role_id=admin_role.id,
        )
        session.add(user_role)
        
        await session.commit()
        
        print("✅ Тестовый пользователь создан:")
        print(f"   Email: admin@theatre.test")
        print(f"   Password: admin123")
        print(f"   Role: admin")


if __name__ == "__main__":
    asyncio.run(create_test_user())
