"""
Pydantic схемы для шаблонов документов.

Содержит схемы для:
- Шаблонов документов
- Переменных шаблонов
- Генерации документов
"""
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, ConfigDict

from app.schemas.base import PaginatedResponse


# =============================================================================
# Enums
# =============================================================================

class TemplateType(str, Enum):
    """Тип шаблона документа."""

    PASSPORT = "passport"
    CONTRACT = "contract"
    SCHEDULE = "schedule"
    REPORT = "report"
    CHECKLIST = "checklist"
    CUSTOM = "custom"


class VariableType(str, Enum):
    """Тип переменной в шаблоне."""

    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    CHOICE = "choice"
    PERFORMANCE_FIELD = "performance_field"
    USER_FIELD = "user_field"
    ACTOR_LIST = "actor_list"
    STAFF_LIST = "staff_list"


# =============================================================================
# Template Variable Schemas
# =============================================================================

class TemplateVariableBase(BaseModel):
    """Базовая схема переменной шаблона."""

    name: str = Field(..., min_length=1, max_length=100, description="Имя переменной (placeholder)")
    label: str = Field(..., min_length=1, max_length=255, description="Отображаемое имя")
    description: str | None = Field(None, max_length=1000, description="Подсказка")
    variable_type: VariableType = Field(VariableType.TEXT, description="Тип переменной")
    default_value: str | None = Field(None, description="Значение по умолчанию")
    is_required: bool = Field(True, description="Обязательное поле")
    source_field: str | None = Field(None, max_length=255, description="Поле для автозаполнения")
    choices: list[str] | None = Field(None, description="Варианты для выбора")
    sort_order: int = Field(0, ge=0, description="Порядок сортировки")
    group_name: str | None = Field(None, max_length=100, description="Группа в UI")
    validation_rules: dict | None = Field(None, description="Правила валидации")


class TemplateVariableCreate(TemplateVariableBase):
    """Схема создания переменной."""
    pass


class TemplateVariableUpdate(BaseModel):
    """Схема обновления переменной."""

    name: str | None = Field(None, min_length=1, max_length=100)
    label: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    variable_type: VariableType | None = None
    default_value: str | None = None
    is_required: bool | None = None
    source_field: str | None = None
    choices: list[str] | None = None
    sort_order: int | None = None
    group_name: str | None = None
    validation_rules: dict | None = None


class TemplateVariableResponse(TemplateVariableBase):
    """Схема ответа переменной."""

    id: int
    template_id: int

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Template Schemas
# =============================================================================

class TemplateBase(BaseModel):
    """Базовая схема шаблона."""

    name: str = Field(..., min_length=1, max_length=255, description="Название шаблона")
    code: str = Field(..., min_length=1, max_length=50, pattern=r'^[A-Z_]+$',
                      description="Код шаблона (PASSPORT, CONTRACT и т.д.)")
    description: str | None = Field(None, max_length=2000, description="Описание")
    template_type: TemplateType = Field(TemplateType.CUSTOM, description="Тип шаблона")
    default_output_format: str = Field("docx", pattern=r'^(docx|pdf)$',
                                        description="Формат выходного документа")
    settings: dict | None = Field(None, description="Дополнительные настройки")


class TemplateCreate(TemplateBase):
    """Схема создания шаблона (файл передаётся отдельно)."""

    variables: list[TemplateVariableCreate] | None = Field(None, description="Переменные шаблона")


class TemplateUpdate(BaseModel):
    """Схема обновления шаблона."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    template_type: TemplateType | None = None
    default_output_format: str | None = Field(None, pattern=r'^(docx|pdf)$')
    settings: dict | None = None
    is_active: bool | None = None


class TemplateResponse(TemplateBase):
    """Схема ответа шаблона."""

    id: int
    file_path: str
    file_name: str
    is_active: bool
    is_system: bool
    theater_id: int | None
    created_at: datetime
    updated_at: datetime

    # Вложенные объекты
    variables: list[TemplateVariableResponse] = []

    model_config = ConfigDict(from_attributes=True)


class TemplateListResponse(BaseModel):
    """Облегчённая схема для списка шаблонов."""

    id: int
    name: str
    code: str
    template_type: TemplateType
    description: str | None
    is_active: bool
    is_system: bool
    default_output_format: str
    variables_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Paginated Responses
# =============================================================================

class PaginatedTemplates(PaginatedResponse):
    """Постраничный список шаблонов."""

    items: list[TemplateListResponse]


# =============================================================================
# Document Generation Schemas
# =============================================================================

class VariableValue(BaseModel):
    """Значение переменной для генерации."""

    name: str = Field(..., description="Имя переменной")
    value: Any = Field(..., description="Значение")


class GenerateDocumentRequest(BaseModel):
    """Запрос на генерацию документа."""

    template_id: int = Field(..., description="ID шаблона")
    performance_id: int | None = Field(None, description="ID спектакля (для автозаполнения)")
    variables: list[VariableValue] = Field(..., description="Значения переменных")
    output_format: str = Field("docx", pattern=r'^(docx|pdf)$', description="Выходной формат")
    document_name: str | None = Field(None, max_length=255, description="Название документа")


class GenerateDocumentPreviewRequest(BaseModel):
    """Запрос на предпросмотр сгенерированного документа."""

    template_id: int = Field(..., description="ID шаблона")
    performance_id: int | None = Field(None, description="ID спектакля")
    variables: list[VariableValue] = Field(..., description="Значения переменных")


class GeneratedDocumentResponse(BaseModel):
    """Ответ после генерации документа."""

    document_id: int = Field(..., description="ID созданного документа")
    document_name: str = Field(..., description="Название документа")
    file_path: str = Field(..., description="Путь к файлу")
    file_name: str = Field(..., description="Имя файла")
    file_size: int = Field(..., description="Размер файла")
    mime_type: str = Field(..., description="MIME-тип")
    download_url: str = Field(..., description="URL для скачивания")


class DocumentPreviewResponse(BaseModel):
    """Ответ с данными предпросмотра."""

    preview_url: str = Field(..., description="URL для предпросмотра")
    expires_in: int = Field(300, description="Время жизни URL в секундах")
    file_name: str = Field(..., description="Имя файла")


# =============================================================================
# Autocomplete Schemas
# =============================================================================

class AutocompleteOption(BaseModel):
    """Опция автозаполнения."""

    id: int | str
    label: str
    description: str | None = None
    data: dict | None = None


class AutocompleteSuggestions(BaseModel):
    """Подсказки для автозаполнения."""

    variable_name: str
    options: list[AutocompleteOption]


class TemplateAutocompleteResponse(BaseModel):
    """Ответ с данными автозаполнения для шаблона."""

    template_id: int
    performance_id: int | None
    suggestions: list[AutocompleteSuggestions]
    auto_filled_values: list[VariableValue] = []


# =============================================================================
# Statistics
# =============================================================================

class TemplateStats(BaseModel):
    """Статистика использования шаблонов."""

    template_id: int
    template_name: str
    documents_generated: int
    last_used: datetime | None
