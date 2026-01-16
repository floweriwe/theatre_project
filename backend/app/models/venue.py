"""
Модель площадки театра.

Содержит:
- VenueType — типы площадок
- Venue — площадка театра
"""
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, AuditMixin

if TYPE_CHECKING:
    from app.models.theater import Theater


class VenueType(str, PyEnum):
    """Тип площадки театра."""

    MAIN_STAGE = "main_stage"       # Основная сцена
    REHEARSAL = "rehearsal"         # Репетиционный зал
    WAREHOUSE = "warehouse"         # Склад
    WORKSHOP = "workshop"           # Мастерская


class Venue(Base, AuditMixin):
    """
    Площадка театра.

    Физическое пространство театра: сцены, залы, склады, мастерские.
    """

    __tablename__ = "venues"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Основные поля
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Тип площадки
    venue_type: Mapped[VenueType] = mapped_column(
        Enum(VenueType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )

    # Вместимость (для залов и сцен)
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Адрес (если отличается от основного адреса театра)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Привязка к театру
    theater_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Статус
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Связи
    theater: Mapped["Theater | None"] = relationship(
        "Theater",
        back_populates="venues",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Venue(id={self.id}, name='{self.name}', type='{self.venue_type.value}')>"
