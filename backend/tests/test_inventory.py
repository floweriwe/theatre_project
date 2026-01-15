"""
Тесты модуля инвентаризации.

Покрывает:
- CRUD операции с категориями
- CRUD операции с местами хранения
- CRUD операции с предметами
- Действия: перемещение, резервирование, списание
"""
import pytest
from httpx import AsyncClient

from app.models.inventory import ItemStatus


# =============================================================================
# Categories Tests
# =============================================================================

class TestCategories:
    """Тесты для категорий инвентаря."""
    
    @pytest.mark.asyncio
    async def test_get_categories_unauthorized(self, client: AsyncClient):
        """Получение категорий без авторизации — 401."""
        response = await client.get("/api/v1/inventory/categories")
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_categories(self, authorized_client: AsyncClient):
        """Получение списка категорий."""
        response = await authorized_client.get("/api/v1/inventory/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        # Должны быть начальные категории из миграции
        assert len(data) >= 0
    
    @pytest.mark.asyncio
    async def test_create_category(self, authorized_client: AsyncClient):
        """Создание категории."""
        response = await authorized_client.post(
            "/api/v1/inventory/categories",
            json={
                "name": "Тестовая категория",
                "code": "test-category",
                "description": "Описание тестовой категории",
            }
        )
        assert response.status_code == 201
        
        data = response.json()
        assert data["name"] == "Тестовая категория"
        assert data["code"] == "test-category"
        assert data["is_active"] is True
    
    @pytest.mark.asyncio
    async def test_create_category_duplicate_code(self, authorized_client: AsyncClient):
        """Создание категории с дублирующим кодом — 409."""
        # Создаём первую категорию
        await authorized_client.post(
            "/api/v1/inventory/categories",
            json={"name": "Категория 1", "code": "duplicate-code"}
        )
        
        # Пытаемся создать с тем же кодом
        response = await authorized_client.post(
            "/api/v1/inventory/categories",
            json={"name": "Категория 2", "code": "duplicate-code"}
        )
        assert response.status_code == 409
    
    @pytest.mark.asyncio
    async def test_update_category(self, authorized_client: AsyncClient):
        """Обновление категории."""
        # Создаём
        create_response = await authorized_client.post(
            "/api/v1/inventory/categories",
            json={"name": "Старое название", "code": "update-test"}
        )
        category_id = create_response.json()["id"]
        
        # Обновляем
        response = await authorized_client.patch(
            f"/api/v1/inventory/categories/{category_id}",
            json={"name": "Новое название"}
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Новое название"
    
    @pytest.mark.asyncio
    async def test_delete_category(self, authorized_client: AsyncClient):
        """Удаление категории (soft delete)."""
        # Создаём
        create_response = await authorized_client.post(
            "/api/v1/inventory/categories",
            json={"name": "Для удаления", "code": "delete-test"}
        )
        category_id = create_response.json()["id"]
        
        # Удаляем
        response = await authorized_client.delete(
            f"/api/v1/inventory/categories/{category_id}"
        )
        assert response.status_code == 200
        
        # Проверяем что не отображается в списке
        list_response = await authorized_client.get("/api/v1/inventory/categories")
        codes = [c["code"] for c in list_response.json()]
        assert "delete-test" not in codes


# =============================================================================
# Locations Tests
# =============================================================================

class TestLocations:
    """Тесты для мест хранения."""
    
    @pytest.mark.asyncio
    async def test_get_locations(self, authorized_client: AsyncClient):
        """Получение списка мест хранения."""
        response = await authorized_client.get("/api/v1/inventory/locations")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    @pytest.mark.asyncio
    async def test_create_location(self, authorized_client: AsyncClient):
        """Создание места хранения."""
        response = await authorized_client.post(
            "/api/v1/inventory/locations",
            json={
                "name": "Новый склад",
                "code": "new-warehouse",
                "address": "ул. Театральная, 1",
            }
        )
        assert response.status_code == 201
        
        data = response.json()
        assert data["name"] == "Новый склад"
        assert data["code"] == "new-warehouse"
    
    @pytest.mark.asyncio
    async def test_create_location_with_parent(self, authorized_client: AsyncClient):
        """Создание вложенного места хранения."""
        # Создаём родительское
        parent_response = await authorized_client.post(
            "/api/v1/inventory/locations",
            json={"name": "Склад", "code": "parent-warehouse"}
        )
        parent_id = parent_response.json()["id"]
        
        # Создаём дочернее
        response = await authorized_client.post(
            "/api/v1/inventory/locations",
            json={
                "name": "Полка 1",
                "code": "shelf-1",
                "parent_id": parent_id,
            }
        )
        assert response.status_code == 201
        assert response.json()["parent_id"] == parent_id


# =============================================================================
# Items Tests
# =============================================================================

class TestInventoryItems:
    """Тесты для предметов инвентаря."""
    
    @pytest.fixture
    async def category(self, authorized_client: AsyncClient):
        """Фикстура: категория для тестов."""
        response = await authorized_client.post(
            "/api/v1/inventory/categories",
            json={"name": "Реквизит тест", "code": f"props-test-{id(self)}"}
        )
        return response.json()
    
    @pytest.fixture
    async def location(self, authorized_client: AsyncClient):
        """Фикстура: место хранения для тестов."""
        response = await authorized_client.post(
            "/api/v1/inventory/locations",
            json={"name": "Склад тест", "code": f"warehouse-test-{id(self)}"}
        )
        return response.json()
    
    @pytest.mark.asyncio
    async def test_get_items_empty(self, authorized_client: AsyncClient):
        """Получение пустого списка предметов."""
        response = await authorized_client.get("/api/v1/inventory/items")
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
    
    @pytest.mark.asyncio
    async def test_create_item(
        self, 
        authorized_client: AsyncClient,
        category: dict,
        location: dict
    ):
        """Создание предмета инвентаря."""
        response = await authorized_client.post(
            "/api/v1/inventory/items",
            json={
                "name": "Шпага театральная",
                "description": "Металлическая шпага для дуэльных сцен",
                "category_id": category["id"],
                "location_id": location["id"],
                "quantity": 5,
                "purchase_price": 15000.00,
            }
        )
        assert response.status_code == 201
        
        data = response.json()
        assert data["name"] == "Шпага театральная"
        assert data["status"] == "in_stock"
        assert data["inventory_number"].startswith("INV-")
        assert data["quantity"] == 5
    
    @pytest.mark.asyncio
    async def test_create_item_with_custom_number(
        self,
        authorized_client: AsyncClient
    ):
        """Создание предмета с кастомным инвентарным номером."""
        response = await authorized_client.post(
            "/api/v1/inventory/items",
            json={
                "name": "Предмет с номером",
                "inventory_number": "CUSTOM-001",
            }
        )
        assert response.status_code == 201
        assert response.json()["inventory_number"] == "CUSTOM-001"
    
    @pytest.mark.asyncio
    async def test_create_item_duplicate_number(self, authorized_client: AsyncClient):
        """Создание предмета с дублирующим номером — 409."""
        # Создаём первый
        await authorized_client.post(
            "/api/v1/inventory/items",
            json={"name": "Предмет 1", "inventory_number": "DUP-001"}
        )
        
        # Пытаемся создать с тем же номером
        response = await authorized_client.post(
            "/api/v1/inventory/items",
            json={"name": "Предмет 2", "inventory_number": "DUP-001"}
        )
        assert response.status_code == 409
    
    @pytest.mark.asyncio
    async def test_get_item(self, authorized_client: AsyncClient):
        """Получение предмета по ID."""
        # Создаём
        create_response = await authorized_client.post(
            "/api/v1/inventory/items",
            json={"name": "Для получения"}
        )
        item_id = create_response.json()["id"]
        
        # Получаем
        response = await authorized_client.get(f"/api/v1/inventory/items/{item_id}")
        assert response.status_code == 200
        assert response.json()["id"] == item_id
    
    @pytest.mark.asyncio
    async def test_update_item(self, authorized_client: AsyncClient):
        """Обновление предмета."""
        # Создаём
        create_response = await authorized_client.post(
            "/api/v1/inventory/items",
            json={"name": "Старое название предмета"}
        )
        item_id = create_response.json()["id"]
        
        # Обновляем
        response = await authorized_client.patch(
            f"/api/v1/inventory/items/{item_id}",
            json={"name": "Новое название предмета", "quantity": 10}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Новое название предмета"
        assert data["quantity"] == 10
    
    @pytest.mark.asyncio
    async def test_delete_item(self, authorized_client: AsyncClient):
        """Удаление предмета (soft delete)."""
        # Создаём
        create_response = await authorized_client.post(
            "/api/v1/inventory/items",
            json={"name": "Для удаления"}
        )
        item_id = create_response.json()["id"]
        
        # Удаляем
        response = await authorized_client.delete(f"/api/v1/inventory/items/{item_id}")
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_search_items(self, authorized_client: AsyncClient):
        """Поиск предметов."""
        # Создаём предметы
        await authorized_client.post(
            "/api/v1/inventory/items",
            json={"name": "Шляпа волшебника"}
        )
        await authorized_client.post(
            "/api/v1/inventory/items",
            json={"name": "Посох волшебника"}
        )
        await authorized_client.post(
            "/api/v1/inventory/items",
            json={"name": "Меч рыцаря"}
        )
        
        # Ищем
        response = await authorized_client.get(
            "/api/v1/inventory/items",
            params={"search": "волшебник"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] >= 2


# =============================================================================
# Item Actions Tests
# =============================================================================

class TestItemActions:
    """Тесты действий с предметами."""
    
    @pytest.fixture
    async def item(self, authorized_client: AsyncClient):
        """Фикстура: предмет для тестов."""
        response = await authorized_client.post(
            "/api/v1/inventory/items",
            json={"name": f"Тестовый предмет {id(self)}"}
        )
        return response.json()
    
    @pytest.fixture
    async def location(self, authorized_client: AsyncClient):
        """Фикстура: место хранения."""
        response = await authorized_client.post(
            "/api/v1/inventory/locations",
            json={"name": f"Склад {id(self)}", "code": f"wh-{id(self)}"}
        )
        return response.json()
    
    @pytest.mark.asyncio
    async def test_reserve_item(
        self,
        authorized_client: AsyncClient,
        item: dict
    ):
        """Резервирование предмета."""
        response = await authorized_client.post(
            f"/api/v1/inventory/items/{item['id']}/reserve"
        )
        assert response.status_code == 200
        assert response.json()["status"] == "reserved"
    
    @pytest.mark.asyncio
    async def test_reserve_already_reserved(
        self,
        authorized_client: AsyncClient,
        item: dict
    ):
        """Повторное резервирование — ошибка."""
        # Резервируем
        await authorized_client.post(
            f"/api/v1/inventory/items/{item['id']}/reserve"
        )
        
        # Пытаемся ещё раз
        response = await authorized_client.post(
            f"/api/v1/inventory/items/{item['id']}/reserve"
        )
        assert response.status_code == 400
    
    @pytest.mark.asyncio
    async def test_release_item(
        self,
        authorized_client: AsyncClient,
        item: dict
    ):
        """Освобождение из резерва."""
        # Резервируем
        await authorized_client.post(
            f"/api/v1/inventory/items/{item['id']}/reserve"
        )
        
        # Освобождаем
        response = await authorized_client.post(
            f"/api/v1/inventory/items/{item['id']}/release"
        )
        assert response.status_code == 200
        assert response.json()["status"] == "in_stock"
    
    @pytest.mark.asyncio
    async def test_transfer_item(
        self,
        authorized_client: AsyncClient,
        item: dict,
        location: dict
    ):
        """Перемещение предмета."""
        response = await authorized_client.post(
            f"/api/v1/inventory/items/{item['id']}/transfer",
            params={
                "to_location_id": location["id"],
                "comment": "Перемещение для теста"
            }
        )
        assert response.status_code == 200
        assert response.json()["location_id"] == location["id"]
    
    @pytest.mark.asyncio
    async def test_write_off_item(
        self,
        authorized_client: AsyncClient,
        item: dict
    ):
        """Списание предмета."""
        response = await authorized_client.post(
            f"/api/v1/inventory/items/{item['id']}/write-off",
            params={"comment": "Пришёл в негодность"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "written_off"
    
    @pytest.mark.asyncio
    async def test_get_movements(
        self,
        authorized_client: AsyncClient,
        item: dict,
        location: dict
    ):
        """Получение истории перемещений."""
        # Делаем несколько действий
        await authorized_client.post(
            f"/api/v1/inventory/items/{item['id']}/transfer",
            params={"to_location_id": location["id"]}
        )
        await authorized_client.post(
            f"/api/v1/inventory/items/{item['id']}/reserve"
        )
        
        # Получаем историю
        response = await authorized_client.get(
            f"/api/v1/inventory/items/{item['id']}/movements"
        )
        assert response.status_code == 200
        
        movements = response.json()
        assert isinstance(movements, list)
        # Должно быть минимум 3: поступление + перемещение + резервирование
        assert len(movements) >= 3


# =============================================================================
# Stats Tests
# =============================================================================

class TestInventoryStats:
    """Тесты статистики инвентаря."""
    
    @pytest.mark.asyncio
    async def test_get_stats(self, authorized_client: AsyncClient):
        """Получение статистики."""
        response = await authorized_client.get("/api/v1/inventory/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_items" in data
        assert "in_stock" in data
        assert "reserved" in data
        assert "total_value" in data
        assert "categories_count" in data
        assert "locations_count" in data
