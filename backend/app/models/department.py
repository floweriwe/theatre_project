"""
Модель цеха театра.

Содержит:
- DepartmentType — типы цехов
- Department — цех театра
"""
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, AuditMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.theater import Theater


class DepartmentType(str, PyEnum):
    """Тип цеха театра."""

    SOUND = "sound"             # Звуковой цех
    LIGHT = "light"             # Световой цех
    STAGE = "stage"             # Сценический/постановочный цех
    COSTUME = "costume"         # Костюмерный цех
    PROPS = "props"             # Бутафорский цех (реквизит)
    MAKEUP = "makeup"           # Гримёрный цех
    VIDEO = "video"             # Видеоцех


class Department(Base, AuditMixin):
    """
    Цех театра.

    Структурное подразделение театра, отвечающее за определённую
    область технического обеспечения спектаклей.
    """

    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Основные поля
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Тип цеха
    department_type: Mapped[DepartmentType] = mapped_column(
        Enum(DepartmentType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )

    # Руководитель цеха
    head_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", name="fk_departments_head_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

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
    head: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[head_id],
        lazy="selectin",
    )
    theater: Mapped["Theater | None"] = relationship(
        "Theater",
        back_populates="departments",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Department(id={self.id}, name='{self.name}', type='{self.department_type.value}')>"
