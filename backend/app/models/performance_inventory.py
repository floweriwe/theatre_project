"""
Модель связи спектаклей и инвентаря.

Содержит:
- PerformanceInventory — связь M2M между спектаклями и реквизитом
"""
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.performance import Performance, PerformanceSection
    from app.models.inventory import InventoryItem


class PerformanceInventory(Base, TimestampMixin):
    """
    Связь спектакля с предметом инвентаря.

    Many-to-many ассоциация, позволяющая отслеживать какой реквизит,
    декорации и оборудование используются в каждом спектакле.
    Поддерживает привязку к конкретной сцене/разделу.
    """

    __tablename__ = "performance_inventory"
    __table_args__ = (
        UniqueConstraint(
            "performance_id", "item_id", "scene_id",
            name="uq_performance_inventory_item_scene"
        ),
    )

    # UUID первичный ключ
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

    # Связь с инвентарём
    item_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("inventory_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Опциональная связь со сценой/разделом
    scene_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("performance_sections.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Примечание к использованию (например, "Только в 1 акте")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Требуемое количество (для групповых предметов, например "10 стульев")
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Связи
    performance: Mapped["Performance"] = relationship(
        "Performance",
        back_populates="inventory_items",
    )
    item: Mapped["InventoryItem"] = relationship(
        "InventoryItem",
        back_populates="performances",
    )
    scene: Mapped["PerformanceSection | None"] = relationship(
        "PerformanceSection",
        foreign_keys=[scene_id],
    )

    def __repr__(self) -> str:
        return f"<PerformanceInventory(id={self.id}, performance_id={self.performance_id}, item_id={self.item_id})>"
