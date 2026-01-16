# coding: utf-8
"""
Unit тесты для BaseRepository.

Тестируем все CRUD операции базового репозитория на примере Department модели.
"""
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department, DepartmentType
from app.models.theater import Theater
from app.repositories.base import BaseRepository


@pytest.mark.asyncio
@pytest.mark.unit
class TestBaseRepository:
    """Тесты для BaseRepository CRUD операций."""
    
    @pytest.fixture
    async def test_theater(self, test_db: AsyncSession) -> Theater:
        """Создать тестовый театр для связей."""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        theater = Theater(
            name=f"Тестовый театр {unique_id}",
            code=f"TEST_{unique_id}",
            database_name=f"test_db_{unique_id}",
            address="ул. Тестовая, 1",
        )
        test_db.add(theater)
        await test_db.flush()
        await test_db.refresh(theater)
        return theater
    
    @pytest.fixture
    def department_repo(self, test_db: AsyncSession) -> BaseRepository[Department]:
        """Создать репозиторий для Department."""
        return BaseRepository(Department, test_db)
    
    @pytest.fixture
    def sample_department_data(self, test_theater: Theater) -> dict:
        """Тестовые данные для создания департамента."""
        return {
            "name": "Звуковой цех",
            "code": "SOUND_01",
            "description": "Тестовый звуковой цех",
            "department_type": DepartmentType.SOUND,
            "theater_id": test_theater.id,
            "is_active": True,
        }
    
    async def test_create_entity(
        self,
        department_repo: BaseRepository[Department],
        sample_department_data: dict,
    ):
        """Тест создания новой записи."""
        # Act
        result = await department_repo.create(sample_department_data)
        
        # Assert
        assert result.id is not None
        assert result.name == sample_department_data["name"]
        assert result.code == sample_department_data["code"]
        assert result.description == sample_department_data["description"]
        assert result.department_type == DepartmentType.SOUND
        assert result.theater_id == sample_department_data["theater_id"]
        assert result.is_active is True
        assert result.created_at is not None
        assert result.updated_at is not None
    
    async def test_get_by_id_success(
        self,
        department_repo: BaseRepository[Department],
        sample_department_data: dict,
    ):
        """Тест получения существующей записи по ID."""
        # Arrange
        created = await department_repo.create(sample_department_data)
        
        # Act
        result = await department_repo.get_by_id(created.id)
        
        # Assert
        assert result is not None
        assert result.id == created.id
        assert result.name == created.name
        assert result.code == created.code
    
    async def test_get_by_id_not_found(
        self,
        department_repo: BaseRepository[Department],
    ):
        """Тест получения несуществующей записи - должен вернуть None."""
        # Act
        result = await department_repo.get_by_id(999999)
        
        # Assert
        assert result is None
    
    async def test_get_all_empty(
        self,
        department_repo: BaseRepository[Department],
    ):
        """Тест получения пустого списка."""
        # Act
        result = await department_repo.get_all()
        
        # Assert
        assert result == []
    
    async def test_get_all_with_data(
        self,
        department_repo: BaseRepository[Department],
        sample_department_data: dict,
        test_theater: Theater,
    ):
        """Тест получения списка с данными."""
        # Arrange - создаём 3 департамента
        dept1 = await department_repo.create(sample_department_data)
        dept2 = await department_repo.create({
            **sample_department_data,
            "name": "Световой цех",
            "code": "LIGHT_01",
            "department_type": DepartmentType.LIGHT,
        })
        dept3 = await department_repo.create({
            **sample_department_data,
            "name": "Сценический цех",
            "code": "STAGE_01",
            "department_type": DepartmentType.STAGE,
        })
        
        # Act
        result = await department_repo.get_all()
        
        # Assert
        assert len(result) == 3
        result_ids = {dept.id for dept in result}
        assert dept1.id in result_ids
        assert dept2.id in result_ids
        assert dept3.id in result_ids
    
    async def test_get_all_with_pagination(
        self,
        department_repo: BaseRepository[Department],
        sample_department_data: dict,
        test_theater: Theater,
    ):
        """Тест пагинации при получении списка."""
        # Arrange - создаём 5 департаментов
        for i in range(5):
            await department_repo.create({
                **sample_department_data,
                "name": f"Цех {i}",
                "code": f"CODE_{i}",
            })
        
        # Act - берём 2 записи со смещением 1
        result = await department_repo.get_all(skip=1, limit=2)
        
        # Assert
        assert len(result) == 2
    
    async def test_get_all_skip_exceeds_total(
        self,
        department_repo: BaseRepository[Department],
        sample_department_data: dict,
    ):
        """Тест пагинации когда skip превышает количество записей."""
        # Arrange
        await department_repo.create(sample_department_data)
        
        # Act
        result = await department_repo.get_all(skip=100)
        
        # Assert
        assert result == []
    
    async def test_count_empty(
        self,
        department_repo: BaseRepository[Department],
    ):
        """Тест подсчёта записей в пустой таблице."""
        # Act
        count = await department_repo.count()
        
        # Assert
        assert count == 0
    
    async def test_count_with_data(
        self,
        department_repo: BaseRepository[Department],
        sample_department_data: dict,
    ):
        """Тест подсчёта записей."""
        # Arrange - создаём 3 департамента
        await department_repo.create(sample_department_data)
        await department_repo.create({
            **sample_department_data,
            "code": "CODE_2",
        })
        await department_repo.create({
            **sample_department_data,
            "code": "CODE_3",
        })
        
        # Act
        count = await department_repo.count()
        
        # Assert
        assert count == 3
    
    async def test_update_entity(
        self,
        department_repo: BaseRepository[Department],
        sample_department_data: dict,
    ):
        """Тест обновления записи через instance."""
        # Arrange
        created = await department_repo.create(sample_department_data)
        original_name = created.name
        
        # Act
        update_data = {
            "name": "Обновлённое название",
            "description": "Новое описание",
        }
        result = await department_repo.update(created, update_data)
        
        # Assert
        assert result.id == created.id
        assert result.name == "Обновлённое название"
        assert result.name != original_name
        assert result.description == "Новое описание"
        assert result.code == sample_department_data["code"]
    
    async def test_update_ignores_invalid_fields(
        self,
        department_repo: BaseRepository[Department],
        sample_department_data: dict,
    ):
        """Тест что update игнорирует несуществующие поля."""
        # Arrange
        created = await department_repo.create(sample_department_data)
        
        # Act
        update_data = {
            "name": "Новое название",
            "invalid_field": "should be ignored",
            "another_fake": 123,
        }
        result = await department_repo.update(created, update_data)
        
        # Assert
        assert result.name == "Новое название"
        assert not hasattr(result, "invalid_field")
        assert not hasattr(result, "another_fake")
    
    async def test_update_by_id_success(
        self,
        department_repo: BaseRepository[Department],
        sample_department_data: dict,
    ):
        """Тест обновления записи по ID."""
        # Arrange
        created = await department_repo.create(sample_department_data)
        
        # Act
        update_data = {"name": "Обновлённое через ID"}
        result = await department_repo.update_by_id(created.id, update_data)
        
        # Assert
        assert result.id == created.id
        assert result.name == "Обновлённое через ID"
    
    async def test_update_by_id_not_found(
        self,
        department_repo: BaseRepository[Department],
    ):
        """Тест обновления несуществующей записи - должен выбросить ValueError."""
        # Act & Assert
        with pytest.raises(ValueError) as exc_info:
            await department_repo.update_by_id(999999, {"name": "Test"})
        
        assert "not found" in str(exc_info.value).lower()
        assert "999999" in str(exc_info.value)
    
    async def test_delete_entity(
        self,
        department_repo: BaseRepository[Department],
        sample_department_data: dict,
        test_db: AsyncSession,
    ):
        """Тест удаления записи."""
        # Arrange
        created = await department_repo.create(sample_department_data)
        created_id = created.id
        
        # Act
        await department_repo.delete(created)
        await test_db.commit()
        
        # Assert
        result = await department_repo.get_by_id(created_id)
        assert result is None
    
    async def test_delete_entity_verifies_in_db(
        self,
        department_repo: BaseRepository[Department],
        sample_department_data: dict,
        test_db: AsyncSession,
    ):
        """Тест что удаление действительно удаляет из БД."""
        # Arrange
        created = await department_repo.create(sample_department_data)
        created_id = created.id
        
        # Verify exists before delete
        exists_before = await department_repo.exists(created_id)
        assert exists_before is True
        
        # Act
        await department_repo.delete(created)
        await test_db.commit()
        
        # Assert
        stmt = select(Department).where(Department.id == created_id)
        result = await test_db.execute(stmt)
        deleted = result.scalar_one_or_none()
        assert deleted is None
    
    async def test_exists_true(
        self,
        department_repo: BaseRepository[Department],
        sample_department_data: dict,
    ):
        """Тест проверки существования записи - существует."""
        # Arrange
        created = await department_repo.create(sample_department_data)
        
        # Act
        exists = await department_repo.exists(created.id)
        
        # Assert
        assert exists is True
    
    async def test_exists_false(
        self,
        department_repo: BaseRepository[Department],
    ):
        """Тест проверки существования записи - не существует."""
        # Act
        exists = await department_repo.exists(999999)
        
        # Assert
        assert exists is False
    
    async def test_base_query(
        self,
        department_repo: BaseRepository[Department],
    ):
        """Тест базового запроса."""
        # Act
        query = department_repo._base_query()
        
        # Assert
        assert query is not None
        assert hasattr(query, 'whereclause')
