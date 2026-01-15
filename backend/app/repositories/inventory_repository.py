"""
Репозиторий модуля инвентаризации.

Содержит классы для работы с БД:
- InventoryCategoryRepository
- StorageLocationRepository
- InventoryItemRepository
- InventoryMovementRepository
"""
from datetime import datetime
from typing import Sequence

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.models.inventory import (
    InventoryCategory,
    StorageLocation,
    InventoryItem,
    InventoryMovement,
    ItemStatus,
    MovementType,
)
from app.repositories.base import BaseRepository


class InventoryCategoryRepository(BaseRepository[InventoryCategory]):
    """Репозиторий для работы с категориями инвентаря."""
    
    def __init__(self, session: AsyncSession):
        super().__init__(InventoryCategory, session)
    
    async def get_by_code(self, code: str, theater_id: int | None = None) -> InventoryCategory | None:
        """Получить категорию по коду."""
        query = select(InventoryCategory).where(InventoryCategory.code == code)
        if theater_id:
            query = query.where(InventoryCategory.theater_id == theater_id)
        result = await self._session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_root_categories(self, theater_id: int | None = None) -> Sequence[InventoryCategory]:
        """Получить корневые категории (без родителя)."""
        query = (
            select(InventoryCategory)
            .where(InventoryCategory.parent_id.is_(None))
            .where(InventoryCategory.is_active.is_(True))
            .order_by(InventoryCategory.sort_order, InventoryCategory.name)
        )
        if theater_id:
            query = query.where(InventoryCategory.theater_id == theater_id)
        result = await self._session.execute(query)
        return result.scalars().all()
    
    async def get_with_children(self, category_id: int) -> InventoryCategory | None:
        """Получить категорию с дочерними элементами."""
        query = (
            select(InventoryCategory)
            .options(selectinload(InventoryCategory.children))
            .where(InventoryCategory.id == category_id)
        )
        result = await self._session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_tree(self, theater_id: int | None = None) -> Sequence[InventoryCategory]:
        """Получить дерево категорий."""
        query = (
            select(InventoryCategory)
            .options(selectinload(InventoryCategory.children))
            .where(InventoryCategory.parent_id.is_(None))
            .where(InventoryCategory.is_active.is_(True))
            .order_by(InventoryCategory.sort_order, InventoryCategory.name)
        )
        if theater_id:
            query = query.where(InventoryCategory.theater_id == theater_id)
        result = await self._session.execute(query)
        return result.scalars().all()


class StorageLocationRepository(BaseRepository[StorageLocation]):
    """Репозиторий для работы с местами хранения."""
    
    def __init__(self, session: AsyncSession):
        super().__init__(StorageLocation, session)
    
    async def get_by_code(self, code: str, theater_id: int | None = None) -> StorageLocation | None:
        """Получить место хранения по коду."""
        query = select(StorageLocation).where(StorageLocation.code == code)
        if theater_id:
            query = query.where(StorageLocation.theater_id == theater_id)
        result = await self._session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_root_locations(self, theater_id: int | None = None) -> Sequence[StorageLocation]:
        """Получить корневые места хранения."""
        query = (
            select(StorageLocation)
            .where(StorageLocation.parent_id.is_(None))
            .where(StorageLocation.is_active.is_(True))
            .order_by(StorageLocation.sort_order, StorageLocation.name)
        )
        if theater_id:
            query = query.where(StorageLocation.theater_id == theater_id)
        result = await self._session.execute(query)
        return result.scalars().all()
    
    async def get_tree(self, theater_id: int | None = None) -> Sequence[StorageLocation]:
        """Получить дерево мест хранения."""
        query = (
            select(StorageLocation)
            .options(selectinload(StorageLocation.children))
            .where(StorageLocation.parent_id.is_(None))
            .where(StorageLocation.is_active.is_(True))
            .order_by(StorageLocation.sort_order, StorageLocation.name)
        )
        if theater_id:
            query = query.where(StorageLocation.theater_id == theater_id)
        result = await self._session.execute(query)
        return result.scalars().all()


class InventoryItemRepository(BaseRepository[InventoryItem]):
    """Репозиторий для работы с предметами инвентаря."""
    
    def __init__(self, session: AsyncSession):
        super().__init__(InventoryItem, session)
    
    async def get_by_inventory_number(self, number: str) -> InventoryItem | None:
        """Получить предмет по инвентарному номеру."""
        query = select(InventoryItem).where(InventoryItem.inventory_number == number)
        result = await self._session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_with_relations(self, item_id: int) -> InventoryItem | None:
        """Получить предмет со связанными объектами."""
        query = (
            select(InventoryItem)
            .options(
                joinedload(InventoryItem.category),
                joinedload(InventoryItem.location),
            )
            .where(InventoryItem.id == item_id)
        )
        result = await self._session.execute(query)
        return result.scalar_one_or_none()
    
    async def search(
        self,
        search: str | None = None,
        category_id: int | None = None,
        location_id: int | None = None,
        status: ItemStatus | None = None,
        is_active: bool | None = None,
        theater_id: int | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[InventoryItem], int]:
        """
        Поиск предметов с фильтрацией.
        
        Returns:
            Кортеж (список предметов, общее количество)
        """
        # Базовый запрос
        query = select(InventoryItem).options(
            joinedload(InventoryItem.category),
            joinedload(InventoryItem.location),
        )
        count_query = select(func.count(InventoryItem.id))
        
        # Фильтры
        filters = []
        
        if search:
            search_filter = or_(
                InventoryItem.name.ilike(f"%{search}%"),
                InventoryItem.inventory_number.ilike(f"%{search}%"),
                InventoryItem.description.ilike(f"%{search}%"),
            )
            filters.append(search_filter)
        
        if category_id is not None:
            filters.append(InventoryItem.category_id == category_id)
        
        if location_id is not None:
            filters.append(InventoryItem.location_id == location_id)
        
        if status is not None:
            filters.append(InventoryItem.status == status)
        
        if is_active is not None:
            filters.append(InventoryItem.is_active == is_active)
        
        if theater_id is not None:
            filters.append(InventoryItem.theater_id == theater_id)
        
        # Применяем фильтры
        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))
        
        # Получаем общее количество
        total_result = await self._session.execute(count_query)
        total = total_result.scalar() or 0
        
        # Применяем пагинацию и сортировку
        query = (
            query
            .order_by(InventoryItem.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        
        result = await self._session.execute(query)
        items = result.unique().scalars().all()
        
        return items, total
    
    async def get_by_category(
        self,
        category_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[InventoryItem]:
        """Получить предметы по категории."""
        query = (
            select(InventoryItem)
            .where(InventoryItem.category_id == category_id)
            .where(InventoryItem.is_active.is_(True))
            .order_by(InventoryItem.name)
            .offset(skip)
            .limit(limit)
        )
        result = await self._session.execute(query)
        return result.scalars().all()
    
    async def get_by_location(
        self,
        location_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[InventoryItem]:
        """Получить предметы по месту хранения."""
        query = (
            select(InventoryItem)
            .where(InventoryItem.location_id == location_id)
            .where(InventoryItem.is_active.is_(True))
            .order_by(InventoryItem.name)
            .offset(skip)
            .limit(limit)
        )
        result = await self._session.execute(query)
        return result.scalars().all()
    
    async def get_by_status(
        self,
        status: ItemStatus,
        theater_id: int | None = None,
    ) -> Sequence[InventoryItem]:
        """Получить предметы по статусу."""
        query = (
            select(InventoryItem)
            .where(InventoryItem.status == status)
            .where(InventoryItem.is_active.is_(True))
        )
        if theater_id:
            query = query.where(InventoryItem.theater_id == theater_id)
        result = await self._session.execute(query)
        return result.scalars().all()
    
    async def get_stats(self, theater_id: int | None = None) -> dict:
        """Получить статистику инвентаря."""
        base_query = select(InventoryItem).where(InventoryItem.is_active.is_(True))
        if theater_id:
            base_query = base_query.where(InventoryItem.theater_id == theater_id)
        
        # Общее количество
        total_query = select(func.count(InventoryItem.id)).where(InventoryItem.is_active.is_(True))
        if theater_id:
            total_query = total_query.where(InventoryItem.theater_id == theater_id)
        
        total_result = await self._session.execute(total_query)
        total = total_result.scalar() or 0
        
        # По статусам
        stats = {"total_items": total}
        
        for status in ItemStatus:
            status_query = (
                select(func.count(InventoryItem.id))
                .where(InventoryItem.status == status)
                .where(InventoryItem.is_active.is_(True))
            )
            if theater_id:
                status_query = status_query.where(InventoryItem.theater_id == theater_id)
            
            result = await self._session.execute(status_query)
            stats[status.value] = result.scalar() or 0
        
        # Общая стоимость
        value_query = (
            select(func.coalesce(func.sum(InventoryItem.current_value), 0))
            .where(InventoryItem.is_active.is_(True))
        )
        if theater_id:
            value_query = value_query.where(InventoryItem.theater_id == theater_id)
        
        value_result = await self._session.execute(value_query)
        stats["total_value"] = float(value_result.scalar() or 0)
        
        return stats
    
    async def generate_inventory_number(self, prefix: str = "INV") -> str:
        """Сгенерировать уникальный инвентарный номер."""
        # Получаем последний номер с таким префиксом
        query = (
            select(InventoryItem.inventory_number)
            .where(InventoryItem.inventory_number.like(f"{prefix}-%"))
            .order_by(InventoryItem.id.desc())
            .limit(1)
        )
        result = await self._session.execute(query)
        last_number = result.scalar_one_or_none()
        
        if last_number:
            # Извлекаем числовую часть
            try:
                num_part = int(last_number.split("-")[-1])
                new_num = num_part + 1
            except (ValueError, IndexError):
                new_num = 1
        else:
            new_num = 1
        
        # Форматируем номер: INV-2025-00001
        year = datetime.now().year
        return f"{prefix}-{year}-{new_num:05d}"


class InventoryMovementRepository(BaseRepository[InventoryMovement]):
    """Репозиторий для работы с историей перемещений."""
    
    def __init__(self, session: AsyncSession):
        super().__init__(InventoryMovement, session)
    
    async def get_by_item(
        self,
        item_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> Sequence[InventoryMovement]:
        """Получить историю перемещений предмета."""
        query = (
            select(InventoryMovement)
            .options(
                joinedload(InventoryMovement.from_location),
                joinedload(InventoryMovement.to_location),
                joinedload(InventoryMovement.created_by),
            )
            .where(InventoryMovement.item_id == item_id)
            .order_by(InventoryMovement.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self._session.execute(query)
        return result.unique().scalars().all()
    
    async def create_movement(
        self,
        item_id: int,
        movement_type: MovementType,
        user_id: int | None = None,
        from_location_id: int | None = None,
        to_location_id: int | None = None,
        quantity: int = 1,
        comment: str | None = None,
        performance_id: int | None = None,
    ) -> InventoryMovement:
        """Создать запись о перемещении."""
        movement = InventoryMovement(
            item_id=item_id,
            movement_type=movement_type,
            from_location_id=from_location_id,
            to_location_id=to_location_id,
            quantity=quantity,
            comment=comment,
            performance_id=performance_id,
            created_by_id=user_id,
        )
        self._session.add(movement)
        await self._session.flush()
        return movement
