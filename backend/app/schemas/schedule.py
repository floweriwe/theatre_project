"""
Pydantic схемы модуля расписания.

Содержит схемы для:
- События (ScheduleEvent)
- Участники (EventParticipant)
"""
from datetime import datetime, date, time
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.schemas.base import PaginatedResponse


# =============================================================================
# Enums
# =============================================================================

class EventType(str, Enum):
    """Тип события."""
    
    PERFORMANCE = "performance"
    REHEARSAL = "rehearsal"
    TECH_REHEARSAL = "tech_rehearsal"
    DRESS_REHEARSAL = "dress_rehearsal"
    MEETING = "meeting"
    MAINTENANCE = "maintenance"
    OTHER = "other"


class EventStatus(str, Enum):
    """Статус события."""
    
    PLANNED = "planned"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ParticipantRole(str, Enum):
    """Роль участника."""
    
    PERFORMER = "performer"
    TECHNICIAN = "technician"
    MANAGER = "manager"
    GUEST = "guest"
    OTHER = "other"


class ParticipantStatus(str, Enum):
    """Статус участия."""
    
    INVITED = "invited"
    CONFIRMED = "confirmed"
    DECLINED = "declined"
    TENTATIVE = "tentative"


# =============================================================================
# Participant Schemas
# =============================================================================

class ParticipantBase(BaseModel):
    """Базовая схема участника."""
    
    user_id: int
    role: ParticipantRole = ParticipantRole.OTHER
    status: ParticipantStatus = ParticipantStatus.INVITED
    note: str | None = Field(None, max_length=500)


class ParticipantCreate(ParticipantBase):
    """Схема создания участника."""
    pass


class ParticipantUpdate(BaseModel):
    """Схема обновления участника."""
    
    role: ParticipantRole | None = None
    status: ParticipantStatus | None = None
    note: str | None = None


class ParticipantResponse(ParticipantBase):
    """Схема ответа участника."""
    
    id: int
    event_id: int
    user_name: str | None = None  # Заполняется из связи
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Event Schemas
# =============================================================================

class EventBase(BaseModel):
    """Базовая схема события."""
    
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=5000)
    event_type: EventType = EventType.OTHER
    event_date: date
    start_time: time
    end_time: time | None = None
    venue: str | None = Field(None, max_length=255)
    performance_id: int | None = None
    color: str | None = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    is_public: bool = False
    
    @field_validator('end_time')
    @classmethod
    def validate_end_time(cls, v: time | None, info) -> time | None:
        """Проверить, что время окончания после начала."""
        if v is not None and 'start_time' in info.data:
            start = info.data['start_time']
            if start and v < start:
                raise ValueError('Время окончания должно быть после времени начала')
        return v


class EventCreate(EventBase):
    """Схема создания события."""
    
    participants: list[ParticipantCreate] = []


class EventUpdate(BaseModel):
    """Схема обновления события."""
    
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    event_type: EventType | None = None
    status: EventStatus | None = None
    event_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    venue: str | None = None
    performance_id: int | None = None
    color: str | None = None
    is_public: bool | None = None


class EventResponse(EventBase):
    """Схема ответа события."""
    
    id: int
    status: EventStatus
    metadata: dict | None
    is_active: bool
    theater_id: int | None
    created_at: datetime
    updated_at: datetime
    
    # Связанные данные
    performance_title: str | None = None
    participants: list[ParticipantResponse] = []
    
    model_config = ConfigDict(from_attributes=True)


class EventListResponse(BaseModel):
    """Схема для списка событий (облегчённая)."""
    
    id: int
    title: str
    event_type: EventType
    status: EventStatus
    event_date: date
    start_time: time
    end_time: time | None
    venue: str | None
    color: str | None
    is_public: bool
    performance_id: int | None
    performance_title: str | None = None
    participants_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Calendar View Schema
# =============================================================================

class CalendarEvent(BaseModel):
    """Событие для отображения в календаре."""
    
    id: int
    title: str
    event_type: EventType
    status: EventStatus
    date: date
    start: time
    end: time | None
    color: str | None
    performance_id: int | None


class CalendarDay(BaseModel):
    """День календаря с событиями."""
    
    date: date
    events: list[CalendarEvent]


# =============================================================================
# Paginated Response
# =============================================================================

class PaginatedEvents(PaginatedResponse):
    """Постраничный список событий."""
    
    items: list[EventListResponse]


# =============================================================================
# Filter Schema
# =============================================================================

class EventFilter(BaseModel):
    """Фильтры для поиска событий."""
    
    date_from: date | None = None
    date_to: date | None = None
    event_type: EventType | None = None
    status: EventStatus | None = None
    performance_id: int | None = None
    venue: str | None = None


# =============================================================================
# Statistics
# =============================================================================

class ScheduleStats(BaseModel):
    """Статистика расписания."""
    
    total_events: int
    planned: int
    confirmed: int
    completed: int
    cancelled: int
    
    # По типам
    performances_count: int
    rehearsals_count: int
    other_count: int
    
    # Ближайшие
    upcoming_events: int
