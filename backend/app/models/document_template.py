"""
Модели шаблонов документов.

Содержит:
- DocumentTemplate — шаблон документа
- DocumentTemplateVariable — переменные шаблона
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
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, AuditMixin

if TYPE_CHECKING:
    from app.models.theater import Theater


class TemplateType(str, PyEnum):
    """Тип шаблона документа."""

    PASSPORT = "passport"       # Паспорт спектакля
    CONTRACT = "contract"       # Договор
    SCHEDULE = "schedule"       # Расписание
    REPORT = "report"          # Отчёт
    CHECKLIST = "checklist"    # Чеклист
    CUSTOM = "custom"          # Пользовательский


class VariableType(str, PyEnum):
    """Тип переменной в шаблоне."""

    TEXT = "text"                        # Текстовое поле
    NUMBER = "number"                    # Число
    DATE = "date"                        # Дата
    CHOICE = "choice"                    # Выбор из списка
    PERFORMANCE_FIELD = "performance_field"  # Поле из спектакля (автозаполнение)
    USER_FIELD = "user_field"            # Поле из пользователя (автозаполнение)
    ACTOR_LIST = "actor_list"            # Мультивыбор актёров
    STAFF_LIST = "staff_list"            # Мультивыбор сотрудников


class DocumentTemplate(Base, AuditMixin):
    """
    Шаблон документа.

    Хранит DOCX-файл шаблона с плейсхолдерами {{variable_name}}.
    Позволяет генерировать документы с подставленными значениями.
    """

    __tablename__ = "document_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Основные поля
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Файл шаблона
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Тип шаблона
    template_type: Mapped[TemplateType] = mapped_column(
        Enum(TemplateType, values_callable=lambda x: [e.value for e in x]),
        default=TemplateType.CUSTOM,
        nullable=False,
        index=True
    )

    # Флаги
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)  # Системные нельзя удалять

    # Настройки
    default_output_format: Mapped[str] = mapped_column(
        String(10),
        default="docx",
        nullable=False
    )  # docx, pdf

    # Дополнительные настройки
    settings: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Мульти-тенантность
    theater_id: Mapped[int | None] = mapped_column(
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    # Связи
    variables: Mapped[list["DocumentTemplateVariable"]] = relationship(
        "DocumentTemplateVariable",
        back_populates="template",
        cascade="all, delete-orphan",
        order_by="DocumentTemplateVariable.sort_order"
    )
    theater: Mapped["Theater | None"] = relationship(
        "Theater",
        foreign_keys=[theater_id]
    )

    def __repr__(self) -> str:
        return f"<DocumentTemplate(id={self.id}, code='{self.code}', name='{self.name}')>"


class DocumentTemplateVariable(Base):
    """
    Переменная шаблона документа.

    Определяет поля для заполнения при генерации документа.
    Поддерживает автозаполнение из связанных сущностей.
    """

    __tablename__ = "document_template_variables"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Связь с шаблоном
    template_id: Mapped[int] = mapped_column(
        ForeignKey("document_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Имя переменной (placeholder в шаблоне)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Отображаемое имя в UI
    label: Mapped[str] = mapped_column(String(255), nullable=False)

    # Описание/подсказка
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Тип переменной
    variable_type: Mapped[VariableType] = mapped_column(
        Enum(VariableType, values_callable=lambda x: [e.value for e in x]),
        default=VariableType.TEXT,
        nullable=False
    )

    # Значение по умолчанию
    default_value: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Обязательность
    is_required: Mapped[bool] = mapped_column(Boolean, default=True)

    # Источник для автозаполнения (например: "performance.title", "performance.director.full_name")
    source_field: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Варианты выбора (для типа CHOICE) — JSON массив строк
    choices: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # Порядок сортировки
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Группировка (для UI)
    group_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Дополнительные настройки валидации
    validation_rules: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Связи
    template: Mapped["DocumentTemplate"] = relationship(
        "DocumentTemplate",
        back_populates="variables"
    )

    def __repr__(self) -> str:
        return f"<DocumentTemplateVariable(id={self.id}, name='{self.name}', type='{self.variable_type}')>"
