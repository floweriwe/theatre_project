"""
Модель фотографий инвентаря.

Содержит:
- InventoryPhoto — фотография предмета инвентаря
"""
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.inventory import InventoryItem


class InventoryPhoto(Base, TimestampMixin):
    """
    Фотография предмета инвентаря.

    Позволяет хранить несколько фотографий для каждого предмета
    с возможностью указания основного изображения.
    """

    __tablename__ = "inventory_photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Связь с предметом инвентаря
    item_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("inventory_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Путь к файлу (относительный путь в хранилище)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)

    # Флаг основного изображения
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Подпись/описание фото
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Связи
    item: Mapped["InventoryItem"] = relationship(
        "InventoryItem",
        back_populates="photos",
    )

    def __repr__(self) -> str:
        return f"<InventoryPhoto(id={self.id}, item_id={self.item_id}, is_primary={self.is_primary})>"
