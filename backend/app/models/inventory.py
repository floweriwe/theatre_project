"""
Модели модуля инвентаризации.

Содержит:
- InventoryCategory — категории инвентаря
- StorageLocation — места хранения
- InventoryItem — предметы инвентаря
- InventoryMovement — история перемещений
"""
from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, AuditMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.theater import Theater
    from app.models.inventory_photo import InventoryPhoto
    from app.models.performance_inventory import PerformanceInventory


class ItemStatus(str, PyEnum):
    """Статус предмета инвентаря."""
    
    IN_STOCK = "in_stock"           # На складе
    RESERVED = "reserved"           # Зарезервирован
    IN_USE = "in_use"               # Используется
    REPAIR = "repair"               # На ремонте
    WRITTEN_OFF = "written_off"     # Списан


class MovementType(str, PyEnum):
    """Тип перемещения."""

    RECEIPT = "receipt"             # Поступление
    TRANSFER = "transfer"           # Перемещение
    RESERVE = "reserve"             # Резервирование
    RELEASE = "release"             # Освобождение из резерва
    ISSUE = "issue"                 # Выдача
    RETURN = "return"               # Возврат
    WRITE_OFF = "write_off"         # Списание
    REPAIR_START = "repair_start"   # Отправка в ремонт
    REPAIR_END = "repair_end"       # Возврат из ремонта


class InventoryCondition(str, PyEnum):
    """Физическое состояние предмета инвентаря."""

    NEW = "new"           # Новый
    GOOD = "good"         # Хорошее
    FAIR = "fair"         # Удовлетворительное
    POOR = "poor"         # Плохое
    BROKEN = "broken"     # Сломан/непригоден


class InventoryCategory(Base, AuditMixin):
    """
    Категория инвентаря.
    
    Иерархическая структура категорий для классификации
    предметов инвентаря (реквизит, костюмы, декорации и т.д.).
    """
    
    __tablename__ = "inventory_categories"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Основные поля
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Иерархия категорий
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("inventory_categories.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Настройки категории
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)  # HEX цвет
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Название иконки
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Мульти-тенантность
    theater_id: Mapped[int | None] = mapped_column(
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True
    )
    
    # Связи
    parent: Mapped["InventoryCategory | None"] = relationship(
        "InventoryCategory",
        remote_side=[id],
        back_populates="children"
    )
    children: Mapped[list["InventoryCategory"]] = relationship(
        "InventoryCategory",
        back_populates="parent"
    )
    items: Mapped[list["InventoryItem"]] = relationship(
        "InventoryItem",
        back_populates="category"
    )
    theater: Mapped["Theater | None"] = relationship("Theater")
    
    def __repr__(self) -> str:
        return f"<InventoryCategory(id={self.id}, name='{self.name}')>"


class StorageLocation(Base, AuditMixin):
    """
    Место хранения.
    
    Иерархическая структура мест хранения
    (склад -> комната -> стеллаж -> полка).
    """
    
    __tablename__ = "storage_locations"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Основные поля
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Иерархия мест
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("storage_locations.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Дополнительная информация
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Мульти-тенантность
    theater_id: Mapped[int | None] = mapped_column(
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True
    )
    
    # Связи
    parent: Mapped["StorageLocation | None"] = relationship(
        "StorageLocation",
        remote_side=[id],
        back_populates="children"
    )
    children: Mapped[list["StorageLocation"]] = relationship(
        "StorageLocation",
        back_populates="parent"
    )
    items: Mapped[list["InventoryItem"]] = relationship(
        "InventoryItem",
        back_populates="location"
    )
    theater: Mapped["Theater | None"] = relationship("Theater")
    
    @property
    def full_path(self) -> str:
        """Полный путь места хранения."""
        if self.parent:
            return f"{self.parent.full_path} / {self.name}"
        return self.name
    
    def __repr__(self) -> str:
        return f"<StorageLocation(id={self.id}, name='{self.name}')>"


class InventoryItem(Base, AuditMixin):
    """
    Предмет инвентаря.
    
    Основная сущность модуля инвентаризации.
    Каждый экземпляр предмета учитывается индивидуально.
    """
    
    __tablename__ = "inventory_items"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Основные поля
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    inventory_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
        index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Классификация
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("inventory_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Местоположение
    location_id: Mapped[int | None] = mapped_column(
        ForeignKey("storage_locations.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Статус
    status: Mapped[ItemStatus] = mapped_column(
        Enum(ItemStatus, values_callable=lambda x: [e.value for e in x]),
        default=ItemStatus.IN_STOCK,
        nullable=False,
        index=True
    )
    
    # Количество (для групповых предметов)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    
    # Стоимость
    purchase_price: Mapped[float | None] = mapped_column(
        Numeric(12, 2),
        nullable=True
    )
    current_value: Mapped[float | None] = mapped_column(
        Numeric(12, 2),
        nullable=True
    )
    
    # Даты
    purchase_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    warranty_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Дополнительные характеристики (кастомные поля)
    custom_fields: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    # Изображения (пути к файлам)
    images: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # Физические характеристики
    dimensions: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment="Габариты (например, '2x3x1м')"
    )
    weight: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Вес в кг"
    )
    condition: Mapped[InventoryCondition | None] = mapped_column(
        Enum(InventoryCondition, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
        comment="Физическое состояние"
    )

    # Флаги
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Мульти-тенантность
    theater_id: Mapped[int | None] = mapped_column(
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    
    # Связи
    category: Mapped["InventoryCategory | None"] = relationship(
        "InventoryCategory",
        back_populates="items"
    )
    location: Mapped["StorageLocation | None"] = relationship(
        "StorageLocation",
        back_populates="items"
    )
    movements: Mapped[list["InventoryMovement"]] = relationship(
        "InventoryMovement",
        back_populates="item",
        order_by="desc(InventoryMovement.created_at)"
    )
    theater: Mapped["Theater | None"] = relationship("Theater")
    photos: Mapped[list["InventoryPhoto"]] = relationship(
        "InventoryPhoto",
        back_populates="item",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    performances: Mapped[list["PerformanceInventory"]] = relationship(
        "PerformanceInventory",
        back_populates="item",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<InventoryItem(id={self.id}, name='{self.name}', number='{self.inventory_number}')>"


class InventoryMovement(Base):
    """
    История перемещений инвентаря.
    
    Аудит-лог всех операций с предметами инвентаря.
    """
    
    __tablename__ = "inventory_movements"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Предмет
    item_id: Mapped[int] = mapped_column(
        ForeignKey("inventory_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Тип операции
    movement_type: Mapped[MovementType] = mapped_column(
        Enum(MovementType, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    
    # Откуда/куда (для перемещений)
    from_location_id: Mapped[int | None] = mapped_column(
        ForeignKey("storage_locations.id", ondelete="SET NULL"),
        nullable=True
    )
    to_location_id: Mapped[int | None] = mapped_column(
        ForeignKey("storage_locations.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Количество (если применимо)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    
    # Комментарий
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Связь со спектаклем (для резервирования)
    performance_id: Mapped[int | None] = mapped_column(
        ForeignKey("performances.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Аудит
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Связи
    item: Mapped["InventoryItem"] = relationship(
        "InventoryItem",
        back_populates="movements"
    )
    from_location: Mapped["StorageLocation | None"] = relationship(
        "StorageLocation",
        foreign_keys=[from_location_id]
    )
    to_location: Mapped["StorageLocation | None"] = relationship(
        "StorageLocation",
        foreign_keys=[to_location_id]
    )
    created_by: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[created_by_id]
    )
    
    def __repr__(self) -> str:
        return f"<InventoryMovement(id={self.id}, type='{self.movement_type}')>"
