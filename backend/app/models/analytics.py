"""
SQLAlchemy модели для аналитики и отчётов.

Содержит:
- ReportTemplate — шаблоны отчётов
- ScheduledReport — запланированные отчёты
- AnalyticsSnapshot — снапшоты агрегированных данных
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


# =============================================================================
# Enums
# =============================================================================

class ReportCategory(str, PyEnum):
    """Категория отчёта."""
    PERFORMANCE = "performance"
    INVENTORY = "inventory"
    SCHEDULE = "schedule"
    HR = "hr"
    FINANCIAL = "financial"
    CUSTOM = "custom"


class ReportFormat(str, PyEnum):
    """Формат генерации отчёта."""
    PDF = "pdf"
    EXCEL = "excel"
    HTML = "html"
    JSON = "json"


class ScheduleFrequency(str, PyEnum):
    """Частота запланированного отчёта."""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ON_DEMAND = "on_demand"


class AnalyticsMetricType(str, PyEnum):
    """Тип метрики аналитики."""
    COUNT = "count"
    SUM = "sum"
    AVERAGE = "average"
    PERCENTAGE = "percentage"
    TREND = "trend"


# =============================================================================
# Report Template Model
# =============================================================================

class ReportTemplate(Base, TimestampMixin):
    """Шаблон отчёта."""

    __tablename__ = "report_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Основные поля
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[ReportCategory] = mapped_column(
        Enum(ReportCategory, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )

    # Структура отчёта (JSON)
    # Содержит: sections, widgets, filters, layout
    structure: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    # Настройки по умолчанию
    default_format: Mapped[ReportFormat] = mapped_column(
        Enum(ReportFormat, values_callable=lambda x: [e.value for e in x]),
        default=ReportFormat.PDF,
        nullable=False,
    )
    default_filters: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Статус
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Владелец
    theater_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    created_by_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    theater = relationship("Theater", back_populates="report_templates")
    created_by = relationship("User", foreign_keys=[created_by_id])
    scheduled_reports = relationship(
        "ScheduledReport",
        back_populates="template",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<ReportTemplate(id={self.id}, name={self.name}, category={self.category})>"


# =============================================================================
# Scheduled Report Model
# =============================================================================

class ScheduledReport(Base, TimestampMixin):
    """Запланированный отчёт."""

    __tablename__ = "scheduled_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Связь с шаблоном
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("report_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Название и описание
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Расписание
    frequency: Mapped[ScheduleFrequency] = mapped_column(
        Enum(ScheduleFrequency, values_callable=lambda x: [e.value for e in x]),
        default=ScheduleFrequency.WEEKLY,
        nullable=False,
    )
    cron_expression: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Получатели (массив email)
    recipients: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        default=list,
        nullable=False,
    )

    # Параметры генерации
    format: Mapped[ReportFormat] = mapped_column(
        Enum(ReportFormat, values_callable=lambda x: [e.value for e in x]),
        default=ReportFormat.PDF,
        nullable=False,
    )
    filters: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Статус выполнения
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_run_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Владелец
    theater_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    created_by_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    template = relationship("ReportTemplate", back_populates="scheduled_reports")
    theater = relationship("Theater", back_populates="scheduled_reports")
    created_by = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self) -> str:
        return f"<ScheduledReport(id={self.id}, name={self.name}, frequency={self.frequency})>"


# =============================================================================
# Analytics Snapshot Model
# =============================================================================

class AnalyticsSnapshot(Base, TimestampMixin):
    """
    Снапшот агрегированных аналитических данных.

    Используется для кеширования вычисленных метрик и исторического анализа.
    """

    __tablename__ = "analytics_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Тип и период
    metric_type: Mapped[AnalyticsMetricType] = mapped_column(
        Enum(AnalyticsMetricType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Период данных
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Значения
    value: Mapped[dict] = mapped_column(JSONB, nullable=False)
    # Структура value зависит от metric_type:
    # COUNT: {"total": 123}
    # SUM: {"total": 1500.00, "currency": "RUB"}
    # AVERAGE: {"value": 75.5, "count": 100}
    # PERCENTAGE: {"value": 85.5, "numerator": 85, "denominator": 100}
    # TREND: {"current": 100, "previous": 90, "change": 10, "change_percent": 11.1}

    # Контекст (фильтры, по которым агрегировано)
    context: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # Например: {"performance_id": 1} или {"category_id": 5}

    # Владелец
    theater_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Relationships
    theater = relationship("Theater", back_populates="analytics_snapshots")

    def __repr__(self) -> str:
        return f"<AnalyticsSnapshot(id={self.id}, metric={self.metric_name}, period={self.period_start}-{self.period_end})>"
