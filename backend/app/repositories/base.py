"""
Базовый репозиторий с общими CRUD операциями.

Использует Generic для типизации модели.
"""
from typing import Any, Generic, TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.base import Base

# TypeVar для модели
ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Базовый репозиторий с общими CRUD операциями.
    
    Предоставляет стандартные методы работы с БД.
    Конкретные репозитории наследуются и добавляют
    специфичные методы.
    
    Attributes:
        _model: Класс SQLAlchemy модели
        _session: Асинхронная сессия БД
    """
    
    def __init__(self, model: type[ModelType], session: AsyncSession) -> None:
        """
        Инициализировать репозиторий.
        
        Args:
            model: Класс модели SQLAlchemy
            session: Асинхронная сессия БД
        """
        self._model = model
        self._session = session
    
    async def get_by_id(self, id: int) -> ModelType | None:
        """
        Получить запись по ID.
        
        Args:
            id: Первичный ключ
            
        Returns:
            Экземпляр модели или None
        """
        result = await self._session.execute(
            select(self._model).where(self._model.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_all(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ModelType]:
        """
        Получить список записей с пагинацией.
        
        Args:
            skip: Сколько записей пропустить
            limit: Максимум записей
            
        Returns:
            Список экземпляров модели
        """
        result = await self._session.execute(
            select(self._model).offset(skip).limit(limit)
        )
        return list(result.scalars().all())
    
    async def count(self) -> int:
        """
        Получить общее количество записей.
        
        Returns:
            Количество записей в таблице
        """
        result = await self._session.execute(
            select(func.count()).select_from(self._model)
        )
        return result.scalar_one()
    
    async def create(self, data: dict[str, Any]) -> ModelType:
        """
        Создать новую запись.
        
        Args:
            data: Словарь с данными для создания
            
        Returns:
            Созданный экземпляр модели
        """
        instance = self._model(**data)
        self._session.add(instance)
        await self._session.flush()
        await self._session.refresh(instance)
        return instance
    
    async def update(
        self,
        instance: ModelType,
        data: dict[str, Any],
    ) -> ModelType:
        """
        Обновить существующую запись.
        
        Args:
            instance: Экземпляр модели для обновления
            data: Словарь с новыми данными
            
        Returns:
            Обновлённый экземпляр
        """
        for key, value in data.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        
        await self._session.flush()
        await self._session.refresh(instance)
        return instance
    
    
    async def update(self, id: int, data: dict[str, Any]) -> ModelType:
        """Update entity by ID."""
        instance = await self.get_by_id(id)
        if not instance:
            raise ValueError(f"Entity with id {id} not found")
        
        for key, value in data.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        
        await self._session.flush()
        await self._session.refresh(instance)
        return instance

    async def delete(self, instance: ModelType) -> None:
        """
        Удалить запись.
        
        Args:
            instance: Экземпляр модели для удаления
        """
        await self._session.delete(instance)
        await self._session.flush()
    
    async def exists(self, id: int) -> bool:
        """
        Проверить существование записи.
        
        Args:
            id: Первичный ключ
            
        Returns:
            True если запись существует
        """
        result = await self._session.execute(
            select(func.count())
            .select_from(self._model)
            .where(self._model.id == id)
        )
        return result.scalar_one() > 0
    
    def _base_query(self) -> Select[tuple[ModelType]]:
        """
        Получить базовый запрос для модели.
        
        Можно переопределить в наследниках для добавления
        стандартных фильтров или eager loading.
        
        Returns:
            Select запрос
        """
        return select(self._model)
