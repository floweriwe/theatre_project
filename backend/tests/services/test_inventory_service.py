"""
Unit-тесты для InventoryService.

Тестирует бизнес-логику сервиса инвентаризации,
мокируя вызовы к репозиториям.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.services.inventory_service import InventoryService
from app.models.inventory import (
    InventoryItem,
    InventoryCategory,
    ItemStatus,
)
from app.core.exceptions import (
    AlreadyExistsError,
    ValidationError,
)
from app.schemas.inventory import InventoryItemCreate, CategoryCreate


@pytest.mark.asyncio
@pytest.mark.service
class TestInventoryServiceItems:
    """Тесты для операций с предметами инвентаря."""

    async def test_transfer_item_success(self):
        """Успешное перемещение предмета."""
        mock_session = AsyncMock()
        service = InventoryService(mock_session)
        
        item = InventoryItem(
            id=1,
            name="Реквизит",
            inventory_number="INV-001",
            status=ItemStatus.IN_STOCK,
            location_id=1,
        )
        
        new_location = MagicMock(id=2, name="Новое место")
        
        service._item_repo.get_with_relations = AsyncMock(return_value=item)
        service._location_repo.get_by_id = AsyncMock(return_value=new_location)
        service._movement_repo.create_movement = AsyncMock()
        service._item_repo.update_by_id = AsyncMock()
        service._item_repo.get_with_relations = AsyncMock(
            return_value=InventoryItem(
                id=1,
                name="Реквизит",
                inventory_number="INV-001",
                status=ItemStatus.IN_STOCK,
                location_id=2,
            )
        )
        
        result = await service.transfer_item(
            item_id=1,
            to_location_id=2,
            user_id=1,
            comment="Тестовое перемещение"
        )
        
        assert result.location_id == 2
        service._movement_repo.create_movement.assert_called_once()
        mock_session.commit.assert_called_once()

    async def test_transfer_written_off_item_fails(self):
        """Попытка переместить списанный предмет вызывает ошибку."""
        mock_session = AsyncMock()
        service = InventoryService(mock_session)
        
        written_off_item = InventoryItem(
            id=1,
            name="Списанный",
            inventory_number="INV-001",
            status=ItemStatus.WRITTEN_OFF,
            location_id=None,
        )
        
        service._item_repo.get_with_relations = AsyncMock(return_value=written_off_item)
        
        with pytest.raises(ValidationError):
            await service.transfer_item(item_id=1, to_location_id=2, user_id=1)

    async def test_reserve_item_success(self):
        """Успешное резервирование предмета."""
        mock_session = AsyncMock()
        service = InventoryService(mock_session)
        
        item = InventoryItem(
            id=1,
            name="Реквизит",
            inventory_number="INV-001",
            status=ItemStatus.IN_STOCK,
            location_id=1,
        )
        
        service._item_repo.get_with_relations = AsyncMock(return_value=item)
        service._movement_repo.create_movement = AsyncMock()
        service._item_repo.update_by_id = AsyncMock()
        service._item_repo.get_with_relations = AsyncMock(
            return_value=InventoryItem(
                id=1,
                name="Реквизит",
                inventory_number="INV-001",
                status=ItemStatus.RESERVED,
                location_id=1,
            )
        )
        
        result = await service.reserve_item(
            item_id=1,
            user_id=1,
            performance_id=5,
        )
        
        assert result.status == ItemStatus.RESERVED
        service._movement_repo.create_movement.assert_called_once()
        mock_session.commit.assert_called_once()

    async def test_reserve_already_reserved_item_fails(self):
        """Попытка зарезервировать уже зарезервированный предмет."""
        mock_session = AsyncMock()
        service = InventoryService(mock_session)
        
        reserved_item = InventoryItem(
            id=1,
            name="Зарезервированный",
            inventory_number="INV-001",
            status=ItemStatus.RESERVED,
            location_id=1,
        )
        
        service._item_repo.get_with_relations = AsyncMock(return_value=reserved_item)
        
        with pytest.raises(ValidationError):
            await service.reserve_item(item_id=1, user_id=1)

    async def test_release_item_success(self):
        """Успешное освобождение предмета из резерва."""
        mock_session = AsyncMock()
        service = InventoryService(mock_session)
        
        reserved_item = InventoryItem(
            id=1,
            name="Зарезервированный",
            inventory_number="INV-001",
            status=ItemStatus.RESERVED,
            location_id=1,
        )
        
        service._item_repo.get_with_relations = AsyncMock(return_value=reserved_item)
        service._movement_repo.create_movement = AsyncMock()
        service._item_repo.update_by_id = AsyncMock()
        service._item_repo.get_with_relations = AsyncMock(
            return_value=InventoryItem(
                id=1,
                name="Зарезервированный",
                inventory_number="INV-001",
                status=ItemStatus.IN_STOCK,
                location_id=1,
            )
        )
        
        result = await service.release_item(item_id=1, user_id=1)
        
        assert result.status == ItemStatus.IN_STOCK
        service._movement_repo.create_movement.assert_called_once()
        mock_session.commit.assert_called_once()

    async def test_release_non_reserved_item_fails(self):
        """Попытка освободить не зарезервированный предмет."""
        mock_session = AsyncMock()
        service = InventoryService(mock_session)
        
        item = InventoryItem(
            id=1,
            name="На складе",
            inventory_number="INV-001",
            status=ItemStatus.IN_STOCK,
            location_id=1,
        )
        
        service._item_repo.get_with_relations = AsyncMock(return_value=item)
        
        with pytest.raises(ValidationError):
            await service.release_item(item_id=1, user_id=1)


@pytest.mark.asyncio
@pytest.mark.service
class TestInventoryServiceStats:
    """Тесты для получения статистики."""

    async def test_get_stats_aggregation(self):
        """Получение статистики инвентаря."""
        mock_session = AsyncMock()
        service = InventoryService(mock_session)
        
        service._item_repo.get_stats = AsyncMock(return_value={
            "total_items": 100,
            "in_stock": 50,
            "reserved": 20,
            "in_use": 15,
            "repair": 10,
            "written_off": 5,
            "total_value": 150000.00,
        })
        
        service._category_repo.get_all = AsyncMock(return_value=[
            MagicMock(id=1, is_active=True),
            MagicMock(id=2, is_active=True),
        ])
        service._category_repo.count = AsyncMock(return_value=2)
        
        service._location_repo.get_all = AsyncMock(return_value=[
            MagicMock(id=1, is_active=True),
        ])
        service._location_repo.count = AsyncMock(return_value=1)
        
        result = await service.get_stats(theater_id=1)
        
        assert result.total_items == 100
        assert result.in_stock == 50
        assert result.reserved == 20
        assert result.in_repair == 10
        assert result.written_off == 5
        assert result.categories_count == 2
        assert result.locations_count == 1
