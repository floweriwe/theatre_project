"""
Базовые классы для моделей SQLAlchemy.

Содержит declarative base и миксины для аудита.
"""
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column


class Base(DeclarativeBase):
    """
    Базовый класс для всех моделей SQLAlchemy.
    
    Все модели должны наследоваться от этого класса
    для корректной работы с Alembic.
    """
    
    # Позволяет использовать аннотации типов в моделях
    type_annotation_map = {
        datetime: DateTime(timezone=True),
    }


class TimestampMixin:
    """
    Миксин с временными метками.
    
    Добавляет поля created_at и updated_at с автозаполнением.
    """
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class AuditMixin(TimestampMixin):
    """
    Миксин для аудита изменений.
    
    Расширяет TimestampMixin полями created_by и updated_by
    для отслеживания авторства изменений.
    """
    
    @declared_attr
    def created_by_id(cls) -> Mapped[int | None]:
        """ID пользователя, создавшего запись."""
        return mapped_column(
            Integer,
            ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        )
    
    @declared_attr
    def updated_by_id(cls) -> Mapped[int | None]:
        """ID пользователя, последним изменившего запись."""
        return mapped_column(
            Integer,
            ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        )


class BaseModel(Base, AuditMixin):
    """
    Базовая модель с ID и полным аудитом.
    
    Используйте для сущностей, требующих отслеживание
    времени и авторства изменений.
    
    Example:
        class InventoryItem(BaseModel):
            __tablename__ = "inventory_items"
            
            name: Mapped[str] = mapped_column(String(255))
    """
    
    __abstract__ = True
    
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    
    def to_dict(self) -> dict[str, Any]:
        """
        Преобразовать модель в словарь.
        
        Полезно для сериализации и отладки.
        """
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }
