"""
Базовые Pydantic схемы.

Содержит общие схемы, используемые в разных модулях.
"""
from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """
    Базовая схема с общими настройками.
    
    Все схемы должны наследоваться от неё.
    """
    
    model_config = ConfigDict(
        from_attributes=True,  # Позволяет создавать из ORM моделей
        populate_by_name=True,  # Использовать alias при парсинге
        str_strip_whitespace=True,  # Убирать пробелы из строк
    )


class TimestampSchema(BaseSchema):
    """Схема с временными метками."""
    
    created_at: datetime
    updated_at: datetime


class AuditSchema(TimestampSchema):
    """Схема с полным аудитом."""
    
    created_by_id: int | None = None
    updated_by_id: int | None = None


# Тип для generic пагинации
T = TypeVar("T")


class PaginatedResponse(BaseSchema, Generic[T]):
    """
    Схема пагинированного ответа.
    
    Используется для всех списковых endpoint'ов.
    
    Attributes:
        items: Список элементов на текущей странице
        total: Общее количество элементов
        page: Номер текущей страницы (начиная с 1)
        limit: Размер страницы (alias: size)
        pages: Общее количество страниц
    """
    
    items: list[T]
    total: int
    page: int
    limit: int  # Для совместимости с frontend
    pages: int
    
    @classmethod
    def create(
        cls,
        items: list[T],
        total: int,
        page: int,
        limit: int,
    ) -> "PaginatedResponse[T]":
        """
        Создать пагинированный ответ.
        
        Args:
            items: Элементы текущей страницы
            total: Общее количество
            page: Номер страницы
            limit: Размер страницы
            
        Returns:
            Экземпляр PaginatedResponse
        """
        pages = (total + limit - 1) // limit if limit > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )


class MessageResponse(BaseSchema):
    """Простой ответ с сообщением."""
    
    message: str
    success: bool = True
