"""
Модели модуля спектаклей.

Содержит:
- Performance — спектакль (паспорт)
- PerformanceSection — раздел паспорта
"""
from datetime import datetime, date
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, AuditMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.theater import Theater
    from app.models.performance_inventory import PerformanceInventory
    from app.models.checklist import PerformanceChecklist


class PerformanceStatus(str, PyEnum):
    """Статус спектакля."""
    
    PREPARATION = "preparation"      # Подготовка
    IN_REPERTOIRE = "in_repertoire"  # В репертуаре
    PAUSED = "paused"                # На паузе
    ARCHIVED = "archived"            # В архиве


class Performance(Base, AuditMixin):
    """
    Спектакль (паспорт спектакля).
    
    Основная сущность модуля репертуара.
    """
    
    __tablename__ = "performances"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Основная информация
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    subtitle: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Авторы
    author: Mapped[str | None] = mapped_column(String(255), nullable=True)
    director: Mapped[str | None] = mapped_column(String(255), nullable=True)
    composer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    choreographer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Характеристики
    genre: Mapped[str | None] = mapped_column(String(100), nullable=True)
    age_rating: Mapped[str | None] = mapped_column(String(10), nullable=True)  # 0+, 6+, 12+, 16+, 18+
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    intermissions: Mapped[int] = mapped_column(Integer, default=0)
    
    # Даты
    premiere_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    
    # Статус
    status: Mapped[PerformanceStatus] = mapped_column(
        Enum(PerformanceStatus, values_callable=lambda x: [e.value for e in x]),
        default=PerformanceStatus.PREPARATION,
        nullable=False,
        index=True
    )
    
    # Изображение (постер)
    poster_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Дополнительные данные
    extra_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    # Флаги
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Мульти-тенантность
    theater_id: Mapped[int | None] = mapped_column(
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    
    # Связи
    sections: Mapped[list["PerformanceSection"]] = relationship(
        "PerformanceSection",
        back_populates="performance",
        cascade="all, delete-orphan"
    )
    inventory_items: Mapped[list["PerformanceInventory"]] = relationship(
        "PerformanceInventory",
        back_populates="performance",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    checklists: Mapped[list["PerformanceChecklist"]] = relationship(
        "PerformanceChecklist",
        back_populates="performance",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Performance(id={self.id}, title='{self.title}')>"


class SectionType(str, PyEnum):
    """Тип раздела паспорта."""
    
    LIGHTING = "lighting"        # Свет
    SOUND = "sound"              # Звук
    SCENERY = "scenery"          # Декорации
    PROPS = "props"              # Реквизит
    COSTUMES = "costumes"        # Костюмы
    MAKEUP = "makeup"            # Грим
    VIDEO = "video"              # Видео
    EFFECTS = "effects"          # Спецэффекты
    OTHER = "other"              # Прочее


class PerformanceSection(Base, AuditMixin):
    """
    Раздел паспорта спектакля.
    
    Содержит техническую информацию по конкретному направлению
    (свет, звук, декорации и т.д.).
    """
    
    __tablename__ = "performance_sections"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Связь со спектаклем
    performance_id: Mapped[int] = mapped_column(
        ForeignKey("performances.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Тип раздела
    section_type: Mapped[SectionType] = mapped_column(
        Enum(SectionType, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    
    # Содержимое
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Ответственный
    responsible_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Дополнительные данные (схемы, настройки и т.д.)
    data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    # Порядок сортировки
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Связи
    performance: Mapped["Performance"] = relationship(
        "Performance",
        back_populates="sections"
    )
    responsible: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[responsible_id]
    )
    
    def __repr__(self) -> str:
        return f"<PerformanceSection(id={self.id}, type='{self.section_type}')>"
