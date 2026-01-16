"""
Модели чеклистов готовности к спектаклям.

Содержит:
- PerformanceChecklist — чеклист готовности
- ChecklistItem — элемент чеклиста
"""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, AuditMixin

if TYPE_CHECKING:
    from app.models.performance import Performance
    from app.models.user import User


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
