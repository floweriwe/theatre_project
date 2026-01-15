"""
Репозиторий пользователей.

Содержит методы для работы с пользователями, ролями
и связями между ними.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import Role, User, UserRole
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """
    Репозиторий для работы с пользователями.
    
    Расширяет базовый репозиторий специфичными методами
    для пользователей.
    """
    
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(User, session)
    
    async def get_by_email(self, email: str) -> User | None:
        """
        Найти пользователя по email.
        
        Args:
            email: Email для поиска
            
        Returns:
            User или None
        """
        result = await self._session.execute(
            select(User)
            .options(selectinload(User.user_roles).selectinload(UserRole.role))
            .where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_by_id_with_roles(self, user_id: int) -> User | None:
        """
        Получить пользователя с загруженными ролями.
        
        Args:
            user_id: ID пользователя
            
        Returns:
            User с подгруженными ролями или None
        """
        result = await self._session.execute(
            select(User)
            .options(selectinload(User.user_roles).selectinload(UserRole.role))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def email_exists(self, email: str, exclude_id: int | None = None) -> bool:
        """
        Проверить существование email.
        
        Args:
            email: Email для проверки
            exclude_id: ID пользователя для исключения (при обновлении)
            
        Returns:
            True если email уже занят
        """
        query = select(User.id).where(User.email == email)
        
        if exclude_id is not None:
            query = query.where(User.id != exclude_id)
        
        result = await self._session.execute(query)
        return result.scalar_one_or_none() is not None
    
    async def get_active_users(
        self,
        theater_id: int | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[User]:
        """
        Получить активных пользователей.
        
        Args:
            theater_id: Фильтр по театру
            skip: Пропустить записей
            limit: Максимум записей
            
        Returns:
            Список активных пользователей
        """
        query = (
            select(User)
            .where(User.is_active == True)  # noqa: E712
            .offset(skip)
            .limit(limit)
        )
        
        if theater_id is not None:
            query = query.where(User.theater_id == theater_id)
        
        result = await self._session.execute(query)
        return list(result.scalars().all())
    
    async def add_role(
        self,
        user: User,
        role: Role,
        assigned_by_id: int | None = None,
    ) -> UserRole:
        """
        Добавить роль пользователю.
        
        Args:
            user: Пользователь
            role: Роль для добавления
            assigned_by_id: Кто назначил роль
            
        Returns:
            Созданная связь UserRole
        """
        user_role = UserRole(
            user_id=user.id,
            role_id=role.id,
            assigned_by_id=assigned_by_id,
        )
        self._session.add(user_role)
        await self._session.flush()
        return user_role
    
    async def remove_role(self, user: User, role: Role) -> None:
        """
        Удалить роль у пользователя.
        
        Args:
            user: Пользователь
            role: Роль для удаления
        """
        result = await self._session.execute(
            select(UserRole).where(
                UserRole.user_id == user.id,
                UserRole.role_id == role.id,
            )
        )
        user_role = result.scalar_one_or_none()
        if user_role:
            await self._session.delete(user_role)
            await self._session.flush()


class RoleRepository(BaseRepository[Role]):
    """Репозиторий для работы с ролями."""
    
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Role, session)
    
    async def get_by_code(self, code: str) -> Role | None:
        """
        Найти роль по коду.
        
        Args:
            code: Код роли
            
        Returns:
            Role или None
        """
        result = await self._session.execute(
            select(Role).where(Role.code == code)
        )
        return result.scalar_one_or_none()
    
    async def get_by_codes(self, codes: list[str]) -> list[Role]:
        """
        Получить роли по списку кодов.
        
        Args:
            codes: Список кодов ролей
            
        Returns:
            Список ролей
        """
        result = await self._session.execute(
            select(Role).where(Role.code.in_(codes))
        )
        return list(result.scalars().all())
    
    async def get_system_roles(self) -> list[Role]:
        """Получить системные роли."""
        result = await self._session.execute(
            select(Role).where(Role.is_system == True)  # noqa: E712
        )
        return list(result.scalars().all())
