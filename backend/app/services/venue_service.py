"""
Сервис для работы с площадками театра.

Содержит бизнес-логику для CRUD операций с площадками (Venue).
"""
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, AlreadyExistsError
from app.models.venue import Venue
from app.schemas.venue import VenueCreate, VenueUpdate


class VenueService:
    """
    Сервис для управления площадками театра.

    Обеспечивает:
    - CRUD операции с площадками
    - Проверку уникальности кодов площадок
    - Фильтрацию по театру (tenant isolation)
    """

    def __init__(self, session: AsyncSession):
        """
        Инициализировать сервис.

        Args:
            session: Асинхронная сессия SQLAlchemy
        """
        self._session = session

    async def get_all(
        self,
        theater_id: Optional[int],
        skip: int = 0,
        limit: int = 100,
        include_inactive: bool = False,
    ) -> tuple[list[Venue], int]:
        """
        Получить список всех площадок театра.

        Args:
            theater_id: ID театра для фильтрации
            skip: Количество пропускаемых записей
            limit: Максимальное количество записей
            include_inactive: Включать ли неактивные площадки

        Returns:
            Кортеж (список площадок, общее количество)
        """
        query = select(Venue)

        # Фильтрация по театру
        if theater_id is not None:
            query = query.where(Venue.theater_id == theater_id)

        # Фильтрация по активности
        if not include_inactive:
            query = query.where(Venue.is_active == True)

        # Сортировка по имени
        query = query.order_by(Venue.name)

        # Подсчет общего количества
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self._session.execute(count_query)
        total = total_result.scalar_one()

        # Применяем пагинацию
        query = query.offset(skip).limit(limit)

        # Выполняем запрос
        result = await self._session.execute(query)
        venues = list(result.scalars().all())

        return venues, total

    async def get_by_id(
        self,
        venue_id: int,
        theater_id: Optional[int] = None,
    ) -> Venue:
        """
        Получить площадку по ID.

        Args:
            venue_id: ID площадки
            theater_id: ID театра для проверки принадлежности

        Returns:
            Объект площадки

        Raises:
            NotFoundError: Если площадка не найдена
        """
        query = select(Venue).where(Venue.id == venue_id)

        # Проверка принадлежности театру
        if theater_id is not None:
            query = query.where(Venue.theater_id == theater_id)

        result = await self._session.execute(query)
        venue = result.scalar_one_or_none()

        if not venue:
            raise NotFoundError(f"Площадка с ID {venue_id} не найдена")

        return venue

    async def create(
        self,
        data: VenueCreate,
        theater_id: Optional[int],
    ) -> Venue:
        """
        Создать новую площадку.

        Args:
            data: Данные для создания площадки
            theater_id: ID театра

        Returns:
            Созданная площадка

        Raises:
            AlreadyExistsError: Если площадка с таким кодом уже существует
        """
        # Проверка уникальности кода в рамках театра
        await self._check_code_unique(data.code, theater_id)

        # Создаем площадку
        venue = Venue(
            name=data.name,
            code=data.code,
            description=data.description,
            venue_type=data.venue_type,
            capacity=data.capacity,
            address=data.address,
            is_active=data.is_active,
            theater_id=theater_id,
        )

        self._session.add(venue)
        await self._session.commit()
        await self._session.refresh(venue)

        return venue

    async def update(
        self,
        venue_id: int,
        data: VenueUpdate,
        theater_id: Optional[int] = None,
    ) -> Venue:
        """
        Обновить площадку.

        Args:
            venue_id: ID площадки
            data: Данные для обновления
            theater_id: ID театра для проверки принадлежности

        Returns:
            Обновленная площадка

        Raises:
            NotFoundError: Если площадка не найдена
            AlreadyExistsError: Если новый код уже занят
        """
        # Получаем площадку
        venue = await self.get_by_id(venue_id, theater_id)

        # Проверяем уникальность нового кода
        if data.code is not None and data.code != venue.code:
            await self._check_code_unique(data.code, venue.theater_id, exclude_id=venue_id)

        # Обновляем поля
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(venue, field, value)

        await self._session.commit()
        await self._session.refresh(venue)

        return venue

    async def delete(
        self,
        venue_id: int,
        theater_id: Optional[int] = None,
    ) -> None:
        """
        Удалить площадку (soft delete).

        Args:
            venue_id: ID площадки
            theater_id: ID театра для проверки принадлежности

        Raises:
            NotFoundError: Если площадка не найдена
        """
        venue = await self.get_by_id(venue_id, theater_id)

        # Soft delete - просто помечаем как неактивную
        venue.is_active = False

        await self._session.commit()

    async def _check_code_unique(
        self,
        code: str,
        theater_id: Optional[int],
        exclude_id: Optional[int] = None,
    ) -> None:
        """
        Проверить уникальность кода площадки.

        Args:
            code: Код для проверки
            theater_id: ID театра
            exclude_id: ID площадки, которую нужно исключить из проверки

        Raises:
            AlreadyExistsError: Если код уже существует
        """
        query = select(Venue).where(
            Venue.code == code,
            Venue.is_active == True,
        )

        if theater_id is not None:
            query = query.where(Venue.theater_id == theater_id)

        if exclude_id is not None:
            query = query.where(Venue.id != exclude_id)

        result = await self._session.execute(query)
        existing = result.scalar_one_or_none()

        if existing:
            raise AlreadyExistsError(f"Площадка с кодом '{code}' уже существует")
