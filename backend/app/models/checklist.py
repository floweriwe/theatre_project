"""
Модели чеклистов готовности к спектаклям.

Содержит:
- ChecklistType — тип чеклиста (enum)
- ChecklistStatus — статус выполнения чеклиста (enum)
- ChecklistTemplate — шаблон чеклиста
- ChecklistInstance — экземпляр чеклиста для конкретного спектакля
- PerformanceChecklist — чеклист готовности (legacy, сохранён для совместимости)
- ChecklistItem — элемент чеклиста
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, AuditMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.performance import Performance
    from app.models.user import User


class ChecklistType(str, PyEnum):
    """Тип чеклиста."""
    PRE_SHOW = "pre_show"         # Перед спектаклем
    DAY_OF = "day_of"             # В день спектакля
    POST_SHOW = "post_show"       # После спектакля
    MONTAGE = "montage"           # Монтаж
    REHEARSAL = "rehearsal"       # Репетиция


class ChecklistStatus(str, PyEnum):
    """Статус выполнения чеклиста."""
    PENDING = "pending"           # Ожидает начала
    IN_PROGRESS = "in_progress"   # В процессе
    COMPLETED = "completed"       # Завершён


class ChecklistTemplate(Base, TimestampMixin):
    """
    Шаблон чеклиста.

    Содержит определение чеклиста, который можно переиспользовать
    для разных спектаклей и событий.
    """

    __tablename__ = "checklist_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Название и описание
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Тип чеклиста
    type: Mapped[ChecklistType] = mapped_column(
        Enum(ChecklistType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )

    # Элементы чеклиста в формате JSONB
    # [{label: str, description?: str, required?: bool}]
    items: Mapped[list[dict]] = mapped_column(JSONB, default=list, nullable=False)

    # Флаг активности
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Связь с театром (tenant)
    theater_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Связь с экземплярами
    instances: Mapped[list["ChecklistInstance"]] = relationship(
        "ChecklistInstance",
        back_populates="template",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<ChecklistTemplate(id={self.id}, name='{self.name}')>"


class ChecklistInstance(Base, TimestampMixin):
    """
    Экземпляр чеклиста для конкретного спектакля/события.

    Создаётся на основе шаблона и отслеживает выполнение.
    """

    __tablename__ = "checklist_instances"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Связь со спектаклем
    performance_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("performances.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Связь с шаблоном
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("checklist_templates.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Название (может быть кастомным или взятым из шаблона)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Статус выполнения
    status: Mapped[ChecklistStatus] = mapped_column(
        Enum(ChecklistStatus, values_callable=lambda x: [e.value for e in x]),
        default=ChecklistStatus.PENDING,
        nullable=False,
        index=True,
    )

    # Данные о выполнении в JSONB
    # {items: [{index: int, is_checked: bool, comment?: str, photo_url?: str,
    #           checked_by_id?: int, checked_at?: datetime}]}
    completion_data: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    # Связи
    performance: Mapped["Performance"] = relationship(
        "Performance",
        back_populates="checklist_instances",
    )
    template: Mapped["ChecklistTemplate | None"] = relationship(
        "ChecklistTemplate",
        back_populates="instances",
    )

    @property
    def total_items(self) -> int:
        """Общее количество элементов."""
        items = self.completion_data.get("items", [])
        return len(items)

    @property
    def completed_items(self) -> int:
        """Количество выполненных элементов."""
        items = self.completion_data.get("items", [])
        return sum(1 for item in items if item.get("is_checked", False))

    @property
    def completion_percentage(self) -> int:
        """Процент выполнения (0-100)."""
        if self.total_items == 0:
            return 0
        return int((self.completed_items / self.total_items) * 100)

    def __repr__(self) -> str:
        return f"<ChecklistInstance(id={self.id}, name='{self.name}', status='{self.status}')>"


class PerformanceChecklist(Base, AuditMixin):
    """
    Чеклист готовности к спектаклю.

    Позволяет создавать списки задач для подготовки к премьере.
    """

    __tablename__ = "performance_checklists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Связь со спектаклем
    performance_id: Mapped[int] = mapped_column(
        ForeignKey("performances.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Основные поля
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Статус
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Связи
    performance: Mapped["Performance"] = relationship(
        "Performance",
        back_populates="checklists"
    )
    items: Mapped[list["ChecklistItem"]] = relationship(
        "ChecklistItem",
        back_populates="checklist",
        cascade="all, delete-orphan",
        order_by="ChecklistItem.sort_order"
    )

    @property
    def total_items(self) -> int:
        """Общее количество элементов."""
        return len(self.items) if self.items else 0

    @property
    def completed_items(self) -> int:
        """Количество выполненных элементов."""
        return sum(1 for item in self.items if item.is_completed) if self.items else 0

    @property
    def completion_percentage(self) -> int:
        """Процент выполнения (0-100)."""
        if self.total_items == 0:
            return 0
        return int((self.completed_items / self.total_items) * 100)

    def __repr__(self) -> str:
        return f"<PerformanceChecklist(id={self.id}, name='{self.name}')>"


class ChecklistItem(Base):
    """
    Элемент чеклиста.

    Отдельная задача для выполнения.
    """

    __tablename__ = "checklist_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Связь с чеклистом
    checklist_id: Mapped[int] = mapped_column(
        ForeignKey("performance_checklists.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Основные поля
    description: Mapped[str] = mapped_column(String(500), nullable=False)

    # Статус выполнения
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Порядок сортировки
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Ответственный (опционально)
    assigned_to_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # Даты
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Связи
    checklist: Mapped["PerformanceChecklist"] = relationship(
        "PerformanceChecklist",
        back_populates="items"
    )
    assigned_to: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[assigned_to_id]
    )

    def __repr__(self) -> str:
        status = "✓" if self.is_completed else "○"
        return f"<ChecklistItem({status} {self.description[:30]})>"
