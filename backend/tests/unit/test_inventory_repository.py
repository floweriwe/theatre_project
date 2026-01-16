"""Unit tests for inventory repository."""
import pytest
from app.models.inventory import InventoryCategory, StorageLocation, InventoryItem, ItemStatus
from app.repositories.inventory_repository import InventoryCategoryRepository, StorageLocationRepository, InventoryItemRepository

@pytest.mark.asyncio
@pytest.mark.unit
class TestInventoryCategoryRepository:
    async def test_get_by_code(self, test_db):
        repo = InventoryCategoryRepository(test_db)
        category = InventoryCategory(name="Test", code="TST")
        test_db.add(category)
        await test_db.commit()
        await test_db.refresh(category)
        found = await repo.get_by_code("TST")
        assert found is not None
        assert found.code == "TST"
    
    async def test_get_tree(self, test_db):
        repo = InventoryCategoryRepository(test_db)
        parent = InventoryCategory(name="Parent", code="PAR")
        test_db.add(parent)
        await test_db.commit()
        await test_db.refresh(parent)
        child = InventoryCategory(name="Child", code="CHI", parent_id=parent.id)
        test_db.add(child)
        await test_db.commit()
        tree = await repo.get_tree()
        assert len(tree) >= 1

@pytest.mark.asyncio
@pytest.mark.unit
class TestStorageLocationRepository:
    async def test_get_by_code(self, test_db):
        repo = StorageLocationRepository(test_db)
        location = StorageLocation(name="Warehouse", code="WH1")
        test_db.add(location)
        await test_db.commit()
        await test_db.refresh(location)
        found = await repo.get_by_code("WH1")
        assert found is not None

@pytest.mark.asyncio
@pytest.mark.unit
class TestInventoryItemRepository:
    async def test_get_by_inventory_number(self, test_db):
        repo = InventoryItemRepository(test_db)
        item = InventoryItem(name="Chair", inventory_number="INV-001", status=ItemStatus.IN_STOCK)
        test_db.add(item)
        await test_db.commit()
        await test_db.refresh(item)
        found = await repo.get_by_inventory_number("INV-001")
        assert found is not None
        assert found.name == "Chair"
    
    async def test_search_items(self, test_db):
        repo = InventoryItemRepository(test_db)
        items = [
            InventoryItem(name="Red Chair", inventory_number="INV-R1", status=ItemStatus.IN_STOCK),
            InventoryItem(name="Blue Table", inventory_number="INV-B1", status=ItemStatus.RESERVED),
        ]
        test_db.add_all(items)
        await test_db.commit()
        results, total = await repo.search(search="chair")
        assert total == 1
        assert results[0].name == "Red Chair"
    
    async def test_get_by_status(self, test_db):
        repo = InventoryItemRepository(test_db)
        items = [
            InventoryItem(name="Item1", inventory_number="I1", status=ItemStatus.IN_STOCK),
            InventoryItem(name="Item2", inventory_number="I2", status=ItemStatus.REPAIR),
        ]
        test_db.add_all(items)
        await test_db.commit()
        in_stock = await repo.get_by_status(ItemStatus.IN_STOCK)
        assert len(in_stock) == 1
        assert in_stock[0].name == "Item1"
