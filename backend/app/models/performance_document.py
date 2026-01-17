"""
Модель документов спектакля.

Содержит:
- DocumentSection — разделы паспорта спектакля (1.0-4.0)
- PerformanceDocumentCategory — категории документов
- ReportInclusion — включение в отчёт
- PerformanceDocument — документы спектакля
"""
from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    BigInteger,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.performance import Performance


class DocumentSection(str, PyEnum):
    """
    Раздел паспорта спектакля.

    Соответствует структуре технической документации театра.
    """

    GENERAL = "1.0"           # Общая часть
    PRODUCTION = "2.0"        # Производство сценического оформления
    OPERATION = "3.0"         # Эксплуатация спектакля
    APPENDIX = "4.0"          # Приложение


class PerformanceDocumentCategory(str, PyEnum):
    """
    Категория документа спектакля.

    На основе реального анализа документации театра.
    """

    # 1.0 Общая часть
    PASSPORT = "passport"                  # Паспорт спектакля
    RECEPTION_ACT = "reception_act"        # Акт приёмки декораций
    FIRE_PROTECTION = "fire_protection"    # Огнезащитная обработка
    WELDING_ACTS = "welding_acts"          # Акты сварочных работ
    MATERIAL_CERTS = "material_certs"      # Сертификаты материалов
    CALCULATIONS = "calculations"          # Расчёты конструкций

    # 2.0 Производство
    SKETCHES = "sketches"                  # Эскизы к спектаклю
    TECH_SPEC_DECOR = "tech_spec_decor"    # ТЗ декорация
    TECH_SPEC_LIGHT = "tech_spec_light"    # ТЗ свет
    TECH_SPEC_COSTUME = "tech_spec_costume"  # ТЗ костюм
    TECH_SPEC_PROPS = "tech_spec_props"    # ТЗ реквизит
    TECH_SPEC_SOUND = "tech_spec_sound"    # ТЗ звук

    # 3.0 Эксплуатация
    DECOR_PHOTOS = "decor_photos"          # Фото декораций
    LAYOUTS = "layouts"                    # Планировки
    MOUNT_LIST = "mount_list"              # Монтировочная опись
    HANGING_LIST = "hanging_list"          # Ведомость развески
    MOUNT_INSTRUCTION = "mount_instruction"  # Инструкция монтажа
    LIGHT_PARTITION = "light_partition"    # Партитура света
    SOUND_PARTITION = "sound_partition"    # Партитура звука
    VIDEO_PARTITION = "video_partition"    # Партитура видео
    COSTUME_LIST = "costume_list"          # Опись костюмов
    MAKEUP_CARD = "makeup_card"            # Грим-карта

    # 4.0 Приложение
    RIDER = "rider"                        # Райдер спектакля
    ESTIMATES = "estimates"                # Сметы
    DRAWINGS = "drawings"                  # Чертежи (DWG)

    # Общее
    OTHER = "other"                        # Прочее


class ReportInclusion(str, PyEnum):
    """Включение документа в отчёт по спектаклю."""

    FULL = "full"             # Полностью входит
    PARTIAL = "partial"       # Частично (ссылка/превью)
    EXCLUDED = "excluded"     # Не входит в отчёт


class PerformanceDocument(Base):
    """
    Документ спектакля.

    Файл, прикреплённый к спектаклю с категоризацией
    по разделам паспорта.
    """

    __tablename__ = "performance_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Связь со спектаклем
    performance_id: Mapped[int] = mapped_column(
        ForeignKey("performances.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Файл
    file_path: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)

    # Категоризация
    section: Mapped[DocumentSection] = mapped_column(
        Enum(DocumentSection, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )
    category: Mapped[PerformanceDocumentCategory] = mapped_column(
        Enum(PerformanceDocumentCategory, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )
    subcategory: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Отображение
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Связь с отчётом
    report_inclusion: Mapped[ReportInclusion] = mapped_column(
        Enum(ReportInclusion, values_callable=lambda x: [e.value for e in x]),
        default=ReportInclusion.FULL,
        nullable=False
    )
    report_page: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Версионирование
    version: Mapped[int] = mapped_column(Integer, default=1)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("performance_documents.id", ondelete="SET NULL"),
        nullable=True
    )
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    # Аудит
    uploaded_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Связи
    performance: Mapped["Performance"] = relationship(
        "Performance",
        back_populates="documents"
    )
    uploaded_by: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[uploaded_by_id]
    )
    parent: Mapped["PerformanceDocument | None"] = relationship(
        "PerformanceDocument",
        remote_side=[id],
        back_populates="versions"
    )
    versions: Mapped[list["PerformanceDocument"]] = relationship(
        "PerformanceDocument",
        back_populates="parent",
        order_by="desc(PerformanceDocument.version)"
    )

    # Индексы
    __table_args__ = (
        Index('ix_performance_documents_perf_section', 'performance_id', 'section'),
        Index('ix_performance_documents_perf_category', 'performance_id', 'category'),
    )

    def __repr__(self) -> str:
        return f"<PerformanceDocument(id={self.id}, name='{self.display_name}')>"
