"""
Репозиторий для работы с цехами театра.

Предоставляет методы для CRUD операций с Department.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.repositories.base import BaseRepository


class DepartmentRepository(BaseRepository[Department]):
    """
    Репозиторий цехов театра.

    Предоставляет методы для работы с цехами,
    включая фильтрацию по театру и проверку уникальности кода.
    """

    def __init__(self, session: AsyncSession):
        """
        Инициализировать репозиторий.

        Args:
            session: Асинхронная сессия БД
        """
        super().__init__(Department, session)

    async def get_by_theater(
        self,
        theater_id: int | None,
        is_active: bool | None = True,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Department]:
        """
        Получить список цехов театра.

        Args:
            theater_id: ID театра
            is_active: Фильтр по активности (None = все)
            skip: Сколько записей пропустить
            limit: Максимум записей

        Returns:
            Список цехов
        """
        query = select(self._model)

        if theater_id is not None:
            query = query.where(self._model.theater_id == theater_id)

        if is_active is not None:
            query = query.where(self._model.is_active == is_active)

        query = query.order_by(self._model.name).offset(skip).limit(limit)

        result = await self._session.execute(query)
        return list(result.scalars().all())

    async def count_by_theater(
        self,
        theater_id: int | None,
        is_active: bool | None = True,
    ) -> int:
        """
        Подсчитать количество цехов театра.

        Args:
            theater_id: ID театра
            is_active: Фильтр по активности (None = все)

        Returns:
            Количество цехов
        """
        from sqlalchemy import func

        query = select(func.count()).select_from(self._model)

        if theater_id is not None:
            query = query.where(self._model.theater_id == theater_id)

        if is_active is not None:
            query = query.where(self._model.is_active == is_active)

        result = await self._session.execute(query)
        return result.scalar_one()

    async def get_by_code(
        self,
        code: str,
        theater_id: int | None = None,
    ) -> Department | None:
        """
        Получить цех по коду.

        Args:
            code: Код цеха
            theater_id: ID театра (для проверки уникальности в рамках театра)

        Returns:
            Цех или None
        """
        query = select(self._model).where(self._model.code == code)

        if theater_id is not None:
            query = query.where(self._model.theater_id == theater_id)

        result = await self._session.execute(query)
        return result.scalar_one_or_none()

    async def get_with_head(self, department_id: int) -> Department | None:
        """
        Получить цех с загрузкой руководителя.

        Args:
            department_id: ID цеха

        Returns:
            Цех с загруженным руководителем или None
        """
        from sqlalchemy.orm import selectinload

        query = (
            select(self._model)
            .where(self._model.id == department_id)
            .options(selectinload(self._model.head))
        )

        result = await self._session.execute(query)
        return result.scalar_one_or_none()
