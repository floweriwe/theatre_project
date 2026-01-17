"""
Pydantic схемы для аналитики и отчётов.

Содержит схемы для:
- ReportTemplate — шаблоны отчётов
- ScheduledReport — запланированные отчёты
- Analytics — метрики и агрегации
"""
from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


# =============================================================================
# Enums
# =============================================================================

class ReportCategory(str, Enum):
    """Категория отчёта."""
    PERFORMANCE = "performance"
    INVENTORY = "inventory"
    SCHEDULE = "schedule"
    HR = "hr"
    FINANCIAL = "financial"
    CUSTOM = "custom"


class ReportFormat(str, Enum):
    """Формат генерации отчёта."""
    PDF = "pdf"
    EXCEL = "excel"
    HTML = "html"
    JSON = "json"


class ScheduleFrequency(str, Enum):
    """Частота запланированного отчёта."""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ON_DEMAND = "on_demand"


class AnalyticsMetricType(str, Enum):
    """Тип метрики аналитики."""
    COUNT = "count"
    SUM = "sum"
    AVERAGE = "average"
    PERCENTAGE = "percentage"
    TREND = "trend"


# =============================================================================
# Report Template Schemas
# =============================================================================

class ReportTemplateCreate(BaseModel):
    """Схема создания шаблона отчёта."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    category: ReportCategory
    structure: dict = Field(default_factory=dict)
    default_format: ReportFormat = ReportFormat.PDF
    default_filters: dict | None = None


class ReportTemplateUpdate(BaseModel):
    """Схема обновления шаблона отчёта."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    category: ReportCategory | None = None
    structure: dict | None = None
    default_format: ReportFormat | None = None
    default_filters: dict | None = None
    is_active: bool | None = None


class ReportTemplateResponse(BaseModel):
    """Схема ответа шаблона отчёта."""

    id: UUID
    name: str
    description: str | None
    category: ReportCategory
    structure: dict
    default_format: ReportFormat
    default_filters: dict | None
    is_active: bool
    is_system: bool
    theater_id: int | None
    created_by_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportTemplateListResponse(BaseModel):
    """Схема для списка шаблонов (облегчённая)."""

    id: UUID
    name: str
    category: ReportCategory
    default_format: ReportFormat
    is_active: bool
    is_system: bool

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Scheduled Report Schemas
# =============================================================================

class ScheduledReportCreate(BaseModel):
    """Схема создания запланированного отчёта."""

    template_id: UUID
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    frequency: ScheduleFrequency = ScheduleFrequency.WEEKLY
    cron_expression: str | None = Field(None, max_length=100)
    recipients: list[str] = Field(default_factory=list)
    format: ReportFormat = ReportFormat.PDF
    filters: dict | None = None


class ScheduledReportUpdate(BaseModel):
    """Схема обновления запланированного отчёта."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    frequency: ScheduleFrequency | None = None
    cron_expression: str | None = None
    recipients: list[str] | None = None
    format: ReportFormat | None = None
    filters: dict | None = None
    is_active: bool | None = None


class ScheduledReportResponse(BaseModel):
    """Схема ответа запланированного отчёта."""

    id: UUID
    template_id: UUID
    name: str
    description: str | None
    frequency: ScheduleFrequency
    cron_expression: str | None
    recipients: list[str]
    format: ReportFormat
    filters: dict | None
    is_active: bool
    last_run_at: datetime | None
    last_run_status: str | None
    next_run_at: datetime | None
    theater_id: int | None
    created_by_id: int | None
    created_at: datetime
    updated_at: datetime

    # Вложенная информация о шаблоне
    template_name: str | None = None
    template_category: ReportCategory | None = None

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Analytics Metrics Schemas
# =============================================================================

class MetricValue(BaseModel):
    """Базовая схема значения метрики."""
    pass


class CountMetric(MetricValue):
    """Метрика подсчёта."""
    total: int


class SumMetric(MetricValue):
    """Метрика суммы."""
    total: float
    currency: str | None = None


class AverageMetric(MetricValue):
    """Метрика среднего."""
    value: float
    count: int


class PercentageMetric(MetricValue):
    """Метрика процента."""
    value: float
    numerator: int
    denominator: int


class TrendMetric(MetricValue):
    """Метрика тренда."""
    current: float
    previous: float
    change: float
    change_percent: float


# =============================================================================
# Performance Analytics Schemas
# =============================================================================

class PerformanceAnalytics(BaseModel):
    """Аналитика по спектаклям."""

    # Общие счётчики
    total_performances: int
    active_performances: int
    archived_performances: int

    # Статусы
    status_breakdown: dict[str, int]  # {status: count}

    # Готовность
    average_readiness: float  # Средний процент готовности

    # Чеклисты
    total_checklists: int
    completed_checklists: int
    checklist_completion_rate: float

    # Топ спектаклей
    most_inventory_heavy: list[dict]  # [{id, title, inventory_count}]
    most_scheduled: list[dict]  # [{id, title, event_count}]


class PerformanceReadinessSummary(BaseModel):
    """Сводка по готовности спектакля."""

    performance_id: int
    title: str
    status: str

    # Общая готовность
    overall_readiness: float

    # По разделам
    sections_readiness: dict[str, float]  # {section_type: percentage}

    # Чеклисты
    pending_checklists: int
    completed_checklists: int

    # Инвентарь
    total_inventory: int
    confirmed_inventory: int


# =============================================================================
# Inventory Analytics Schemas
# =============================================================================

class InventoryAnalytics(BaseModel):
    """Аналитика по инвентарю."""

    # Общие счётчики
    total_items: int
    total_quantity: int
    total_value: float | None

    # По статусам
    status_breakdown: dict[str, int]  # {status: count}

    # По категориям
    category_breakdown: list[dict]  # [{category_id, name, count, value}]

    # По состоянию
    condition_breakdown: dict[str, int]  # {condition: count}

    # Использование
    items_in_use: int
    items_reserved: int
    items_available: int

    # Проблемные
    items_needing_repair: int
    low_stock_items: list[dict]  # [{id, name, quantity}]


class InventoryUsageReport(BaseModel):
    """Отчёт по использованию инвентаря."""

    period_start: datetime
    period_end: datetime

    # Движения
    total_movements: int
    movements_by_type: dict[str, int]  # {type: count}

    # Топ предметов
    most_used_items: list[dict]  # [{id, name, usage_count}]
    least_used_items: list[dict]  # [{id, name, days_idle}]

    # По спектаклям
    usage_by_performance: list[dict]  # [{performance_id, title, item_count}]


# =============================================================================
# Dashboard Widgets Schemas
# =============================================================================

class DashboardWidget(BaseModel):
    """Виджет для дашборда."""

    id: str
    type: str  # chart, stat, list, progress
    title: str
    data: dict
    size: str = "medium"  # small, medium, large


class AnalyticsDashboard(BaseModel):
    """Полный дашборд аналитики."""

    generated_at: datetime
    period_start: datetime | None
    period_end: datetime | None

    widgets: list[DashboardWidget]

    # Сводные метрики
    summary: dict


# =============================================================================
# Report Generation Schemas
# =============================================================================

class ReportGenerationRequest(BaseModel):
    """Запрос на генерацию отчёта."""

    template_id: UUID
    format: ReportFormat = ReportFormat.PDF
    filters: dict | None = None
    period_start: datetime | None = None
    period_end: datetime | None = None


class ReportGenerationResponse(BaseModel):
    """Ответ генерации отчёта."""

    id: UUID
    template_id: UUID
    format: ReportFormat
    status: str  # pending, generating, completed, failed
    download_url: str | None = None
    error_message: str | None = None
    generated_at: datetime | None = None
    expires_at: datetime | None = None
