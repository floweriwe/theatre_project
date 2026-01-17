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

    # Путь к миниатюре (генерируется автоматически)
    thumbnail_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Флаг основного изображения
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Порядок сортировки (для ручного упорядочивания)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Подпись/описание фото
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Метаданные изображения (EXIF, размеры и т.д.)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)  # bytes

    # Связи
    item: Mapped["InventoryItem"] = relationship(
        "InventoryItem",
        back_populates="photos",
    )

    def __repr__(self) -> str:
        return f"<InventoryPhoto(id={self.id}, item_id={self.item_id}, is_primary={self.is_primary})>"
