"""
Сервис модуля инвентаризации.

Бизнес-логика для работы с инвентарём:
- CRUD операции с категориями, местами хранения, предметами
- Перемещения и резервирование
- Статистика
"""
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, AlreadyExistsError, ValidationError
from app.models.inventory import (
    InventoryCategory,
    StorageLocation,
    InventoryItem,
    InventoryMovement,
    ItemStatus,
    MovementType,
)
from app.repositories.inventory_repository import (
    InventoryCategoryRepository,
    StorageLocationRepository,
    InventoryItemRepository,
    InventoryMovementRepository,
)
from app.schemas.inventory import (
    CategoryCreate,
    CategoryUpdate,
    LocationCreate,
    LocationUpdate,
    InventoryItemCreate,
    InventoryItemUpdate,
    MovementCreate,
    InventoryStats,
)


class InventoryService:
    """
    Сервис инвентаризации.
    
    Координирует работу между репозиториями и реализует
    бизнес-логику модуля инвентаризации.
    """
    
    def __init__(self, session: AsyncSession):
        self._session = session
        self._category_repo = InventoryCategoryRepository(session)
        self._location_repo = StorageLocationRepository(session)
        self._item_repo = InventoryItemRepository(session)
        self._movement_repo = InventoryMovementRepository(session)
    
    # =========================================================================
    # Categories
    # =========================================================================
    
    async def get_categories(
        self,
        theater_id: int | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[InventoryCategory], int]:
        """Получить список категорий."""
        items = await self._category_repo.get_all(skip=skip, limit=limit)
        total = await self._category_repo.count()
        return list(items), total
    
    async def get_categories_tree(
        self,
        theater_id: int | None = None,
    ) -> list[InventoryCategory]:
        """Получить дерево категорий."""
        categories = await self._category_repo.get_tree(theater_id)
        return list(categories)
    
    async def get_category(self, category_id: int) -> InventoryCategory:
        """Получить категорию по ID."""
        category = await self._category_repo.get_by_id(category_id)
        if not category:
            raise NotFoundError(f"Категория с ID {category_id} не найдена")
        return category
    
    async def create_category(
        self,
        data: CategoryCreate,
        user_id: int,
        theater_id: int | None = None,
    ) -> InventoryCategory:
        """Создать категорию."""
        # Проверяем уникальность кода
        existing = await self._category_repo.get_by_code(data.code, theater_id)
        if existing:
            raise AlreadyExistsError(f"Категория с кодом '{data.code}' уже существует")
        
        # Проверяем родительскую категорию
        if data.parent_id:
            parent = await self._category_repo.get_by_id(data.parent_id)
            if not parent:
                raise NotFoundError(f"Родительская категория с ID {data.parent_id} не найдена")
        
        category = InventoryCategory(
            **data.model_dump(),
            theater_id=theater_id,
            created_by_id=user_id,
            updated_by_id=user_id,
        )
        
        created = await self._category_repo.create(category.__dict__)
        await self._session.commit()
        
        return await self._category_repo.get_by_id(created.id)
    
    async def update_category(
        self,
        category_id: int,
        data: CategoryUpdate,
        user_id: int,
    ) -> InventoryCategory:
        """Обновить категорию."""
        category = await self.get_category(category_id)
        
        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_by_id"] = user_id
        
        # Проверяем код на уникальность если меняется
        if "code" in update_data and update_data["code"] != category.code:
            existing = await self._category_repo.get_by_code(update_data["code"], category.theater_id)
            if existing:
                raise AlreadyExistsError(f"Категория с кодом '{update_data['code']}' уже существует")
        
        updated = await self._category_repo.update(category_id, update_data)
        await self._session.commit()
        
        return updated
    
    async def delete_category(self, category_id: int) -> bool:
        """Удалить категорию (soft delete)."""
        category = await self.get_category(category_id)
        await self._category_repo.update(category_id, {"is_active": False})
        await self._session.commit()
        return True
    
    # =========================================================================
    # Locations
    # =========================================================================
    
    async def get_locations(
        self,
        theater_id: int | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[StorageLocation], int]:
        """Получить список мест хранения."""
        items = await self._location_repo.get_all(skip=skip, limit=limit)
        total = await self._location_repo.count()
        return list(items), total
    
    async def get_locations_tree(
        self,
        theater_id: int | None = None,
    ) -> list[StorageLocation]:
        """Получить дерево мест хранения."""
        locations = await self._location_repo.get_tree(theater_id)
        return list(locations)
    
    async def get_location(self, location_id: int) -> StorageLocation:
        """Получить место хранения по ID."""
        location = await self._location_repo.get_by_id(location_id)
        if not location:
            raise NotFoundError(f"Место хранения с ID {location_id} не найдено")
        return location
    
    async def create_location(
        self,
        data: LocationCreate,
        user_id: int,
        theater_id: int | None = None,
    ) -> StorageLocation:
        """Создать место хранения."""
        # Проверяем уникальность кода
        existing = await self._location_repo.get_by_code(data.code, theater_id)
        if existing:
            raise AlreadyExistsError(f"Место хранения с кодом '{data.code}' уже существует")
        
        # Проверяем родительское место
        if data.parent_id:
            parent = await self._location_repo.get_by_id(data.parent_id)
            if not parent:
                raise NotFoundError(f"Родительское место хранения с ID {data.parent_id} не найдено")
        
        location = StorageLocation(
            **data.model_dump(),
            theater_id=theater_id,
            created_by_id=user_id,
            updated_by_id=user_id,
        )
        
        created = await self._location_repo.create(location.__dict__)
        await self._session.commit()
        
        return await self._location_repo.get_by_id(created.id)
    
    async def update_location(
        self,
        location_id: int,
        data: LocationUpdate,
        user_id: int,
    ) -> StorageLocation:
        """Обновить место хранения."""
        location = await self.get_location(location_id)
        
        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_by_id"] = user_id
        
        # Проверяем код на уникальность если меняется
        if "code" in update_data and update_data["code"] != location.code:
            existing = await self._location_repo.get_by_code(update_data["code"], location.theater_id)
            if existing:
                raise AlreadyExistsError(f"Место хранения с кодом '{update_data['code']}' уже существует")
        
        updated = await self._location_repo.update(location_id, update_data)
        await self._session.commit()
        
        return updated
    
    async def delete_location(self, location_id: int) -> bool:
        """Удалить место хранения (soft delete)."""
        location = await self.get_location(location_id)
        await self._location_repo.update(location_id, {"is_active": False})
        await self._session.commit()
        return True
    
    # =========================================================================
    # Items
    # =========================================================================
    
    async def get_items(
        self,
        search: str | None = None,
        category_id: int | None = None,
        location_id: int | None = None,
        status: ItemStatus | None = None,
        is_active: bool | None = True,
        theater_id: int | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[InventoryItem], int]:
        """Получить список предметов с фильтрацией."""
        items, total = await self._item_repo.search(
            search=search,
            category_id=category_id,
            location_id=location_id,
            status=status,
            is_active=is_active,
            theater_id=theater_id,
            skip=skip,
            limit=limit,
        )
        return list(items), total
    
    async def get_item(self, item_id: int) -> InventoryItem:
        """Получить предмет по ID."""
        item = await self._item_repo.get_with_relations(item_id)
        if not item:
            raise NotFoundError(f"Предмет с ID {item_id} не найден")
        return item
    
    async def get_item_by_number(self, inventory_number: str) -> InventoryItem:
        """Получить предмет по инвентарному номеру."""
        item = await self._item_repo.get_by_inventory_number(inventory_number)
        if not item:
            raise NotFoundError(f"Предмет с номером '{inventory_number}' не найден")
        return item
    
    async def create_item(
        self,
        data: InventoryItemCreate,
        user_id: int,
        theater_id: int | None = None,
    ) -> InventoryItem:
        """Создать предмет инвентаря."""
        # Генерируем или проверяем инвентарный номер
        if data.inventory_number:
            existing = await self._item_repo.get_by_inventory_number(data.inventory_number)
            if existing:
                raise AlreadyExistsError(f"Предмет с номером '{data.inventory_number}' уже существует")
            inventory_number = data.inventory_number
        else:
            inventory_number = await self._item_repo.generate_inventory_number()
        
        # Проверяем категорию
        if data.category_id:
            category = await self._category_repo.get_by_id(data.category_id)
            if not category:
                raise NotFoundError(f"Категория с ID {data.category_id} не найдена")
        
        # Проверяем место хранения
        if data.location_id:
            location = await self._location_repo.get_by_id(data.location_id)
            if not location:
                raise NotFoundError(f"Место хранения с ID {data.location_id} не найдено")
        
        # Создаём предмет
        item_data = data.model_dump(exclude={"inventory_number"})
        item = InventoryItem(
            **item_data,
            inventory_number=inventory_number,
            status=ItemStatus.IN_STOCK,
            theater_id=theater_id,
            created_by_id=user_id,
            updated_by_id=user_id,
        )
        
        self._session.add(item)
        await self._session.flush()
        
        # Создаём запись о поступлении
        await self._movement_repo.create_movement(
            item_id=item.id,
            movement_type=MovementType.RECEIPT,
            user_id=user_id,
            to_location_id=data.location_id,
            quantity=data.quantity,
            comment="Первоначальное поступление",
        )
        
        await self._session.commit()
        
        return await self._item_repo.get_with_relations(item.id)
    
    async def update_item(
        self,
        item_id: int,
        data: InventoryItemUpdate,
        user_id: int,
    ) -> InventoryItem:
        """Обновить предмет инвентаря."""
        item = await self.get_item(item_id)
        
        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_by_id"] = user_id
        
        # Проверяем категорию если меняется
        if "category_id" in update_data and update_data["category_id"]:
            category = await self._category_repo.get_by_id(update_data["category_id"])
            if not category:
                raise NotFoundError(f"Категория с ID {update_data['category_id']} не найдена")
        
        # Проверяем место хранения если меняется
        if "location_id" in update_data and update_data["location_id"] != item.location_id:
            if update_data["location_id"]:
                location = await self._location_repo.get_by_id(update_data["location_id"])
                if not location:
                    raise NotFoundError(f"Место хранения с ID {update_data['location_id']} не найдено")
            
            # Создаём запись о перемещении
            await self._movement_repo.create_movement(
                item_id=item_id,
                movement_type=MovementType.TRANSFER,
                user_id=user_id,
                from_location_id=item.location_id,
                to_location_id=update_data["location_id"],
                comment="Перемещение при редактировании",
            )
        
        updated = await self._item_repo.update(item_id, update_data)
        await self._session.commit()
        
        return await self._item_repo.get_with_relations(item_id)
    
    async def delete_item(self, item_id: int, user_id: int) -> bool:
        """Удалить предмет (soft delete)."""
        item = await self.get_item(item_id)
        await self._item_repo.update(item_id, {
            "is_active": False,
            "updated_by_id": user_id,
        })
        await self._session.commit()
        return True
    
    # =========================================================================
    # Movements & Status Changes
    # =========================================================================
    
    async def transfer_item(
        self,
        item_id: int,
        to_location_id: int,
        user_id: int,
        comment: str | None = None,
    ) -> InventoryItem:
        """Переместить предмет в другое место."""
        item = await self.get_item(item_id)
        
        if item.status == ItemStatus.WRITTEN_OFF:
            raise ValidationError("Нельзя переместить списанный предмет")
        
        # Проверяем место назначения
        location = await self._location_repo.get_by_id(to_location_id)
        if not location:
            raise NotFoundError(f"Место хранения с ID {to_location_id} не найдено")
        
        # Создаём запись о перемещении
        await self._movement_repo.create_movement(
            item_id=item_id,
            movement_type=MovementType.TRANSFER,
            user_id=user_id,
            from_location_id=item.location_id,
            to_location_id=to_location_id,
            comment=comment,
        )
        
        # Обновляем местоположение
        await self._item_repo.update(item_id, {
            "location_id": to_location_id,
            "updated_by_id": user_id,
        })
        
        await self._session.commit()
        
        return await self._item_repo.get_with_relations(item_id)
    
    async def reserve_item(
        self,
        item_id: int,
        user_id: int,
        performance_id: int | None = None,
        comment: str | None = None,
    ) -> InventoryItem:
        """Зарезервировать предмет."""
        item = await self.get_item(item_id)
        
        if item.status != ItemStatus.IN_STOCK:
            raise ValidationError(f"Предмет недоступен для резервирования (статус: {item.status.value})")
        
        # Создаём запись о резервировании
        await self._movement_repo.create_movement(
            item_id=item_id,
            movement_type=MovementType.RESERVE,
            user_id=user_id,
            performance_id=performance_id,
            comment=comment,
        )
        
        # Обновляем статус
        await self._item_repo.update(item_id, {
            "status": ItemStatus.RESERVED,
            "updated_by_id": user_id,
        })
        
        await self._session.commit()
        
        return await self._item_repo.get_with_relations(item_id)
    
    async def release_item(
        self,
        item_id: int,
        user_id: int,
        comment: str | None = None,
    ) -> InventoryItem:
        """Освободить предмет из резерва."""
        item = await self.get_item(item_id)
        
        if item.status != ItemStatus.RESERVED:
            raise ValidationError("Предмет не зарезервирован")
        
        # Создаём запись об освобождении
        await self._movement_repo.create_movement(
            item_id=item_id,
            movement_type=MovementType.RELEASE,
            user_id=user_id,
            comment=comment,
        )
        
        # Обновляем статус
        await self._item_repo.update(item_id, {
            "status": ItemStatus.IN_STOCK,
            "updated_by_id": user_id,
        })
        
        await self._session.commit()
        
        return await self._item_repo.get_with_relations(item_id)
    
    async def write_off_item(
        self,
        item_id: int,
        user_id: int,
        comment: str | None = None,
    ) -> InventoryItem:
        """Списать предмет."""
        item = await self.get_item(item_id)
        
        if item.status == ItemStatus.WRITTEN_OFF:
            raise ValidationError("Предмет уже списан")
        
        # Создаём запись о списании
        await self._movement_repo.create_movement(
            item_id=item_id,
            movement_type=MovementType.WRITE_OFF,
            user_id=user_id,
            from_location_id=item.location_id,
            comment=comment,
        )
        
        # Обновляем статус
        await self._item_repo.update(item_id, {
            "status": ItemStatus.WRITTEN_OFF,
            "location_id": None,
            "updated_by_id": user_id,
        })
        
        await self._session.commit()
        
        return await self._item_repo.get_with_relations(item_id)
    
    async def get_item_movements(
        self,
        item_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> list[InventoryMovement]:
        """Получить историю перемещений предмета."""
        # Проверяем существование предмета
        await self.get_item(item_id)
        
        movements = await self._movement_repo.get_by_item(item_id, skip, limit)
        return list(movements)
    
    # =========================================================================
    # Statistics
    # =========================================================================
    
    async def get_stats(self, theater_id: int | None = None) -> InventoryStats:
        """Получить статистику инвентаря."""
        stats = await self._item_repo.get_stats(theater_id)
        
        # Количество категорий
        categories, _ = await self.get_categories(theater_id)
        stats["categories_count"] = len([c for c in categories if c.is_active])
        
        # Количество мест хранения
        locations, _ = await self.get_locations(theater_id)
        stats["locations_count"] = len([l for l in locations if l.is_active])
        
        return InventoryStats(
            total_items=stats["total_items"],
            in_stock=stats.get("in_stock", 0),
            reserved=stats.get("reserved", 0),
            in_use=stats.get("in_use", 0),
            in_repair=stats.get("repair", 0),
            written_off=stats.get("written_off", 0),
            total_value=stats["total_value"],
            categories_count=stats["categories_count"],
            locations_count=stats["locations_count"],
        )
