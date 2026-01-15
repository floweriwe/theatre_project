"""
Модель театра (tenant).

Каждый театр — отдельный tenant со своей базой данных.
Эта модель хранится в основной БД для маршрутизации.
"""
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class Theater(Base, TimestampMixin):
    """
    Театр (tenant системы).
    
    Представляет отдельную организацию в мульти-тенантной архитектуре.
    Каждый театр имеет:
    - Уникальный код для идентификации
    - Имя базы данных для хранения данных театра
    - Список пользователей
    
    Attributes:
        name: Полное название театра
        code: Уникальный код (используется в URL и для БД)
        database_name: Имя базы данных для этого театра
    """
    
    __tablename__ = "theaters"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Основная информация
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Имя базы данных для мульти-тенантности
    database_name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )
    
    # Контактная информация
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Статус
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Связи
    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="theater",
        lazy="selectin",
    )
    
    def __repr__(self) -> str:
        return f"<Theater(id={self.id}, code='{self.code}', name='{self.name}')>"
