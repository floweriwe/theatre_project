"""
Модель связи спектаклей с участниками (каст и персонал).

Содержит:
- CastRoleType — тип роли (актёр/персонал)
- PerformanceCast — связь пользователя со спектаклем
"""
import uuid
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.performance import Performance
    from app.models.user import User


class CastRoleType(str, PyEnum):
    """Тип роли участника."""
    CAST = "cast"       # Актёр/артист
    CREW = "crew"       # Персонал (свет, звук, сцена)


class PerformanceCast(Base, TimestampMixin):
    """
    Связь участника (актёра или персонала) со спектаклем.

    Позволяет назначать пользователей на роли в спектакле,
    отслеживать актёрский состав и технический персонал.
    """

    __tablename__ = "performance_cast"
    __table_args__ = (
        UniqueConstraint(
            "performance_id", "user_id", "character_name",
            name="uq_performance_cast_user_character"
        ),
    )

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

    # Связь с пользователем
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Тип роли: актёр или персонал
    role_type: Mapped[CastRoleType] = mapped_column(
        Enum(CastRoleType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )

    # Название персонажа (для актёров)
    character_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Функциональная роль (для персонала, например "Звукорежиссёр")
    functional_role: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Флаг дублёра (understudy)
    is_understudy: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Примечание
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Связи
    performance: Mapped["Performance"] = relationship(
        "Performance",
        back_populates="cast_crew",
    )
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
    )

    def __repr__(self) -> str:
        role = self.character_name or self.functional_role or self.role_type.value
        return f"<PerformanceCast(id={self.id}, user_id={self.user_id}, role='{role}')>"
