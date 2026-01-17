"""
Pydantic схемы для документов спектакля.
"""
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.performance_document import (
    DocumentSection,
    PerformanceDocumentCategory,
    ReportInclusion,
)


# =============================================================================
# Request Schemas
# =============================================================================

class PerformanceDocumentCreate(BaseModel):
    """Создание документа (метаданные для загрузки)."""

    section: DocumentSection | None = Field(
        None,
        description="Раздел паспорта (определяется автоматически если не указан)"
    )
    category: PerformanceDocumentCategory | None = Field(
        None,
        description="Категория документа (определяется автоматически если не указана)"
    )
    display_name: str | None = Field(
        None,
        description="Отображаемое имя (по умолчанию — имя файла)"
    )
    description: str | None = None
    report_inclusion: ReportInclusion = Field(
        default=ReportInclusion.FULL,
        description="Включение в отчёт"
    )


class PerformanceDocumentUpdate(BaseModel):
    """Обновление метаданных документа."""

    display_name: str | None = None
    description: str | None = None
    section: DocumentSection | None = None
    category: PerformanceDocumentCategory | None = None
    subcategory: str | None = None
    report_inclusion: ReportInclusion | None = None
    sort_order: int | None = None


# =============================================================================
# Response Schemas
# =============================================================================

class PerformanceDocumentResponse(BaseModel):
    """Ответ с документом спектакля."""

    id: int
    performance_id: int
    file_path: str
    file_name: str
    file_size: int
    mime_type: str
    section: DocumentSection
    category: PerformanceDocumentCategory
    subcategory: str | None = None
    display_name: str
    description: str | None = None
    sort_order: int
    report_inclusion: ReportInclusion
    version: int
    is_current: bool
    uploaded_by_id: int | None = None
    uploaded_at: datetime
    download_url: str | None = None

    model_config = {"from_attributes": True}


class PerformanceDocumentListItem(BaseModel):
    """Элемент списка документов."""

    id: int
    file_name: str
    file_size: int
    mime_type: str
    section: DocumentSection
    category: PerformanceDocumentCategory
    display_name: str
    uploaded_at: datetime
    download_url: str | None = None

    model_config = {"from_attributes": True}


class DocumentTreeCategory(BaseModel):
    """Категория в дереве документов."""

    category: PerformanceDocumentCategory
    category_name: str
    documents: list[PerformanceDocumentListItem]
    count: int


class DocumentTreeSection(BaseModel):
    """Раздел в дереве документов."""

    section: DocumentSection
    section_name: str
    categories: list[DocumentTreeCategory]
    total_count: int


class PerformanceDocumentsTree(BaseModel):
    """Дерево документов спектакля."""

    performance_id: int
    sections: list[DocumentTreeSection]
    total_documents: int


class BulkUploadResult(BaseModel):
    """Результат массовой загрузки."""

    uploaded: list[PerformanceDocumentResponse]
    failed: list[dict]  # {filename, error}
    total_uploaded: int
    total_failed: int


# =============================================================================
# Passport Readiness Schemas
# =============================================================================

class PassportSectionReadiness(BaseModel):
    """Готовность раздела паспорта."""

    section: str  # "1.0", "2.0", "3.0", "4.0"
    section_name: str
    progress: int  # 0-100
    status: str  # "EMPTY", "IN_PROGRESS", "COMPLETE"
    filled_categories: int
    total_categories: int


class PassportReadinessResponse(BaseModel):
    """Общая готовность паспорта спектакля."""

    overall_progress: int  # 0-100
    sections: list[PassportSectionReadiness]


class SectionDetailedReadiness(BaseModel):
    """Детализированная готовность раздела."""

    section: str
    section_name: str
    progress: int
    filled_categories: int
    total_categories: int
    categories: list[dict]  # {category, category_name, required, filled, documents_count}


# =============================================================================
# Section/Category Names
# =============================================================================

SECTION_NAMES = {
    DocumentSection.GENERAL: "1.0 Общая часть",
    DocumentSection.PRODUCTION: "2.0 Производство",
    DocumentSection.OPERATION: "3.0 Эксплуатация",
    DocumentSection.APPENDIX: "4.0 Приложение",
}

CATEGORY_NAMES = {
    PerformanceDocumentCategory.PASSPORT: "Паспорт спектакля",
    PerformanceDocumentCategory.RECEPTION_ACT: "Акт приёмки декораций",
    PerformanceDocumentCategory.FIRE_PROTECTION: "Огнезащитная обработка",
    PerformanceDocumentCategory.WELDING_ACTS: "Акты сварочных работ",
    PerformanceDocumentCategory.MATERIAL_CERTS: "Сертификаты материалов",
    PerformanceDocumentCategory.CALCULATIONS: "Расчёты конструкций",
    PerformanceDocumentCategory.SKETCHES: "Эскизы",
    PerformanceDocumentCategory.TECH_SPEC_DECOR: "ТЗ декорация",
    PerformanceDocumentCategory.TECH_SPEC_LIGHT: "ТЗ свет",
    PerformanceDocumentCategory.TECH_SPEC_COSTUME: "ТЗ костюм",
    PerformanceDocumentCategory.TECH_SPEC_PROPS: "ТЗ реквизит",
    PerformanceDocumentCategory.TECH_SPEC_SOUND: "ТЗ звук",
    PerformanceDocumentCategory.DECOR_PHOTOS: "Фото декораций",
    PerformanceDocumentCategory.LAYOUTS: "Планировки",
    PerformanceDocumentCategory.MOUNT_LIST: "Монтировочная опись",
    PerformanceDocumentCategory.HANGING_LIST: "Ведомость развески",
    PerformanceDocumentCategory.MOUNT_INSTRUCTION: "Инструкция монтажа",
    PerformanceDocumentCategory.LIGHT_PARTITION: "Партитура света",
    PerformanceDocumentCategory.SOUND_PARTITION: "Партитура звука",
    PerformanceDocumentCategory.VIDEO_PARTITION: "Партитура видео",
    PerformanceDocumentCategory.COSTUME_LIST: "Опись костюмов",
    PerformanceDocumentCategory.MAKEUP_CARD: "Грим-карта",
    PerformanceDocumentCategory.RIDER: "Райдер",
    PerformanceDocumentCategory.ESTIMATES: "Сметы",
    PerformanceDocumentCategory.DRAWINGS: "Чертежи",
    PerformanceDocumentCategory.OTHER: "Прочее",
}
