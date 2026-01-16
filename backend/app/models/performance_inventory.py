"""
Модель связи спектаклей и инвентаря.

Содержит:
- PerformanceInventory — связь M2M между спектаклями и реквизитом
"""
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.performance import Performance
    from app.models.inventory import InventoryItem


class PerformanceInventory(Base, TimestampMixin):
    """
    Связь спектакля с предметом инвентаря.

    Many-to-many ассоциация, позволяющая отслеживать какой реквизит,
    декорации и оборудование используются в каждом спектакле.
    """

    __tablename__ = "performance_inventory"

    # Составной первичный ключ
    performance_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("performances.id", ondelete="CASCADE"),
        primary_key=True,
    )
    item_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("inventory_items.id", ondelete="CASCADE"),
        primary_key=True,
    )

    # Примечание к использованию (например, "Только в 1 акте")
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Требуемое количество (для групповых предметов, например "10 стульев")
    quantity_required: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Связи
    performance: Mapped["Performance"] = relationship(
        "Performance",
        back_populates="inventory_items",
    )
    item: Mapped["InventoryItem"] = relationship(
        "InventoryItem",
        back_populates="performances",
    )

    def __repr__(self) -> str:
        return f"<PerformanceInventory(performance_id={self.performance_id}, item_id={self.item_id})>"
