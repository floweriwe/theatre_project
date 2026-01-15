"""
Модели пользователей и ролей.

Содержит:
- User: основная модель пользователя
- Role: роли с набором разрешений
- UserRole: связь пользователь-роль (many-to-many)
"""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.theater import Theater


class User(Base, TimestampMixin):
    """
    Пользователь системы.
    
    Содержит учётные данные и связи с ролями и театром.
    Поддерживает soft delete через поле is_active.
    """
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Учётные данные
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Профиль
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    patronymic: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    # Статусы
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Привязка к театру (tenant)
    theater_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("theaters.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    # Время последнего входа
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # Связи
    theater: Mapped["Theater | None"] = relationship(
        "Theater",
        back_populates="users",
        lazy="selectin",
    )
    user_roles: Mapped[list["UserRole"]] = relationship(
        "UserRole",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
        foreign_keys="[UserRole.user_id]",
    )
    
    @property
    def full_name(self) -> str:
        """Полное имя пользователя."""
        parts = [self.last_name, self.first_name]
        if self.patronymic:
            parts.append(self.patronymic)
        return " ".join(parts)
    
    @property
    def roles(self) -> list["Role"]:
        """Список ролей пользователя."""
        return [ur.role for ur in self.user_roles]
    
    @property
    def role_codes(self) -> list[str]:
        """Список кодов ролей."""
        return [role.code for role in self.roles]
    
    @property
    def permissions(self) -> list[str]:
        """
        Объединённый список разрешений из всех ролей.
        
        Для суперпользователя возвращает специальное разрешение admin:full.
        """
        if self.is_superuser:
            return ["admin:full"]
        
        perms: set[str] = set()
        for role in self.roles:
            perms.update(role.permissions)
        return list(perms)
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"


class Role(Base, TimestampMixin):
    """
    Роль пользователя.
    
    Роль определяет набор разрешений (permissions).
    Пользователь может иметь несколько ролей.
    """
    
    __tablename__ = "roles"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Название и код
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Список разрешений в виде массива строк
    permissions: Mapped[list[str]] = mapped_column(
        ARRAY(String(100)),
        default=list,
        nullable=False,
    )
    
    # Системная роль не может быть удалена
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Привязка к театру (None = глобальная роль)
    theater_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    
    # Связи
    user_roles: Mapped[list["UserRole"]] = relationship(
        "UserRole",
        back_populates="role",
        lazy="selectin",
    )
    
    def __repr__(self) -> str:
        return f"<Role(id={self.id}, code='{self.code}')>"


class UserRole(Base):
    """
    Связь пользователь-роль (many-to-many).
    
    Хранит дополнительную информацию о назначении роли:
    кто назначил и когда.
    """
    
    __tablename__ = "user_roles"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Кто и когда назначил роль
    assigned_by_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    
    # Связи
    user: Mapped["User"] = relationship(
        "User",
        back_populates="user_roles",
        foreign_keys=[user_id],
    )
    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="user_roles",
    )
    
    def __repr__(self) -> str:
        return f"<UserRole(user_id={self.user_id}, role_id={self.role_id})>"
