"""
Сервис модуля департаментов/цехов.

Бизнес-логика для работы с цехами театра:
- CRUD операции
- Валидация уникальности кода
- Проверка руководителей
"""
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, AlreadyExistsError, ValidationError
from app.models.department import Department
from app.repositories.department_repository import DepartmentRepository
from app.repositories.user_repository import UserRepository
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
)


class DepartmentService:
    """
    Сервис цехов театра.

    Координирует работу между репозиториями и реализует
    бизнес-логику модуля департаментов.
    """

    def __init__(self, session: AsyncSession):
        self._session = session
        self._department_repo = DepartmentRepository(session)
        self._user_repo = UserRepository(session)

    # =========================================================================
    # CRUD Operations
    # =========================================================================

    async def get_all(
        self,
        theater_id: int | None = None,
        is_active: bool | None = True,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[Department], int]:
        """
        Получить список цехов.

        Args:
            theater_id: ID театра
            is_active: Фильтр по активности (None = все)
            skip: Сколько записей пропустить
            limit: Максимум записей

        Returns:
            Кортеж (список цехов, общее количество)
        """
        departments = await self._department_repo.get_by_theater(
            theater_id=theater_id,
            is_active=is_active,
            skip=skip,
            limit=limit,
        )
        total = await self._department_repo.count_by_theater(
            theater_id=theater_id,
            is_active=is_active,
        )
        return list(departments), total

    async def get_by_id(self, department_id: int) -> Department:
        """
        Получить цех по ID.

        Args:
            department_id: ID цеха

        Returns:
            Цех

        Raises:
            NotFoundError: Если цех не найден
        """
        department = await self._department_repo.get_with_head(department_id)
        if not department:
            raise NotFoundError(f"Цех с ID {department_id} не найден")
        return department

    async def create(
        self,
        data: DepartmentCreate,
        user_id: int,
        theater_id: int | None = None,
    ) -> Department:
        """
        Создать цех.

        Args:
            data: Данные для создания
            user_id: ID пользователя-создателя
            theater_id: ID театра

        Returns:
            Созданный цех

        Raises:
            AlreadyExistsError: Если цех с таким кодом уже существует
            NotFoundError: Если руководитель не найден
        """
        # Проверяем уникальность кода
        existing = await self._department_repo.get_by_code(data.code, theater_id)
        if existing:
            raise AlreadyExistsError(f"Цех с кодом '{data.code}' уже существует")

        # Проверяем руководителя если указан
        if data.head_id:
            head = await self._user_repo.get_by_id(data.head_id)
            if not head:
                raise NotFoundError(f"Пользователь с ID {data.head_id} не найден")
            if not head.is_active:
                raise ValidationError("Руководитель цеха должен быть активным пользователем")

        # Создаём цех
        department_data = {
            **data.model_dump(),
            "theater_id": theater_id,
            "created_by_id": user_id,
            "updated_by_id": user_id,
        }

        created = await self._department_repo.create(department_data)
        await self._session.commit()

        return await self._department_repo.get_with_head(created.id)

    async def update(
        self,
        department_id: int,
        data: DepartmentUpdate,
        user_id: int,
    ) -> Department:
        """
        Обновить цех.

        Args:
            department_id: ID цеха
            data: Данные для обновления
            user_id: ID пользователя

        Returns:
            Обновлённый цех

        Raises:
            NotFoundError: Если цех или руководитель не найдены
            AlreadyExistsError: Если код уже используется
            ValidationError: Если руководитель неактивен
        """
        department = await self.get_by_id(department_id)

        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_by_id"] = user_id

        # Проверяем код на уникальность если меняется
        if "code" in update_data and update_data["code"] != department.code:
            existing = await self._department_repo.get_by_code(
                update_data["code"], department.theater_id
            )
            if existing:
                raise AlreadyExistsError(f"Цех с кодом '{update_data['code']}' уже существует")

        # Проверяем руководителя если меняется
        if "head_id" in update_data and update_data["head_id"] is not None:
            head = await self._user_repo.get_by_id(update_data["head_id"])
            if not head:
                raise NotFoundError(f"Пользователь с ID {update_data['head_id']} не найден")
            if not head.is_active:
                raise ValidationError("Руководитель цеха должен быть активным пользователем")

        updated = await self._department_repo.update_by_id(department_id, update_data)
        await self._session.commit()

        return await self._department_repo.get_with_head(department_id)

    async def delete(self, department_id: int, user_id: int) -> bool:
        """
        Удалить цех (soft delete).

        Args:
            department_id: ID цеха
            user_id: ID пользователя

        Returns:
            True если успешно

        Raises:
            NotFoundError: Если цех не найден
        """
        department = await self.get_by_id(department_id)
        await self._department_repo.update_by_id(
            department_id,
            {
                "is_active": False,
                "updated_by_id": user_id,
            }
        )
        await self._session.commit()
        return True
