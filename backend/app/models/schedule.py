"""
Модели модуля расписания.

Содержит:
- ScheduleEvent — событие (спектакль, репетиция, мероприятие)
- EventParticipant — участник события
"""
from datetime import datetime, date, time
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
    from app.models.performance import Performance
    from app.models.venue import Venue


class EventType(str, PyEnum):
    """Тип события."""
    
    PERFORMANCE = "performance"      # Спектакль
    REHEARSAL = "rehearsal"          # Репетиция
    TECH_REHEARSAL = "tech_rehearsal"  # Технический прогон
    DRESS_REHEARSAL = "dress_rehearsal"  # Генеральная репетиция
    MEETING = "meeting"              # Совещание
    MAINTENANCE = "maintenance"      # Техническое обслуживание
    OTHER = "other"                  # Прочее


class EventStatus(str, PyEnum):
    """Статус события."""
    
    PLANNED = "planned"          # Запланировано
    CONFIRMED = "confirmed"      # Подтверждено
    IN_PROGRESS = "in_progress"  # В процессе
    COMPLETED = "completed"      # Завершено
    CANCELLED = "cancelled"      # Отменено


class ScheduleEvent(Base, AuditMixin):
    """
    Событие в расписании.
    
    Может быть связано со спектаклем или быть отдельным мероприятием.
    """
    
    __tablename__ = "schedule_events"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Основная информация
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Тип и статус
    event_type: Mapped[EventType] = mapped_column(
        Enum(EventType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=EventType.OTHER,
        index=True
    )
    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=EventStatus.PLANNED,
        index=True
    )
    
    # Дата и время
    event_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    
    # Место проведения (FK на venues)
    venue_id: Mapped[int | None] = mapped_column(
        ForeignKey("venues.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Связь со спектаклем (опционально)
    performance_id: Mapped[int | None] = mapped_column(
        ForeignKey("performances.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Цвет для отображения в календаре
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)  # HEX
    
    # Дополнительные данные
    extra_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    # Флаги
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)  # Показывать на сайте
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Мульти-тенантность
    theater_id: Mapped[int | None] = mapped_column(
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    
    # Связи
    performance: Mapped["Performance | None"] = relationship("Performance")
    venue: Mapped["Venue | None"] = relationship("Venue", lazy="selectin")
    participants: Mapped[list["EventParticipant"]] = relationship(
        "EventParticipant",
        back_populates="event",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<ScheduleEvent(id={self.id}, title='{self.title}', date={self.event_date})>"


class ParticipantRole(str, PyEnum):
    """Роль участника в событии."""
    
    PERFORMER = "performer"      # Исполнитель
    TECHNICIAN = "technician"    # Технический персонал
    MANAGER = "manager"          # Менеджер/организатор
    GUEST = "guest"              # Гость
    OTHER = "other"              # Прочее


class ParticipantStatus(str, PyEnum):
    """Статус участия."""
    
    INVITED = "invited"          # Приглашён
    CONFIRMED = "confirmed"      # Подтвердил
    DECLINED = "declined"        # Отказался
    TENTATIVE = "tentative"      # Под вопросом


class EventParticipant(Base):
    """
    Участник события.
    
    Связывает пользователя с событием и указывает его роль.
    """
    
    __tablename__ = "event_participants"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Связи
    event_id: Mapped[int] = mapped_column(
        ForeignKey("schedule_events.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Роль и статус
    role: Mapped[ParticipantRole] = mapped_column(
        Enum(ParticipantRole, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ParticipantRole.OTHER
    )
    status: Mapped[ParticipantStatus] = mapped_column(
        Enum(ParticipantStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ParticipantStatus.INVITED
    )
    
    # Комментарий
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Связи
    event: Mapped["ScheduleEvent"] = relationship(
        "ScheduleEvent",
        back_populates="participants"
    )
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id]
    )
    
    def __repr__(self) -> str:
        return f"<EventParticipant(event_id={self.event_id}, user_id={self.user_id})>"
