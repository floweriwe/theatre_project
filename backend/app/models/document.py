"""
Модели модуля документооборота.

Содержит:
- DocumentCategory — категории документов
- Document — документы с версионированием
- DocumentVersion — версии документов (N+1)
- DocumentTag — теги документов
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
    Table,
    Column,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, AuditMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.theater import Theater


class DocumentStatus(str, PyEnum):
    """Статус документа."""
    
    DRAFT = "draft"           # Черновик
    ACTIVE = "active"         # Активный
    ARCHIVED = "archived"     # В архиве


class FileType(str, PyEnum):
    """Тип файла для определения превью."""
    
    PDF = "pdf"
    DOCUMENT = "document"     # docx, doc, odt, txt
    SPREADSHEET = "spreadsheet"  # xlsx, xls, csv
    IMAGE = "image"           # png, jpg, gif, svg
    OTHER = "other"


# Таблица связи документов и тегов
document_tags = Table(
    "document_tags",
    Base.metadata,
    Column("document_id", Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class DocumentCategory(Base, AuditMixin):
    """
    Категория документов.
    
    Иерархическая структура для организации документов.
    """
    
    __tablename__ = "document_categories"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Основные поля
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Иерархия
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("document_categories.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Настройки
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Права доступа (список разрешений для просмотра)
    required_permissions: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    
    # Мульти-тенантность
    theater_id: Mapped[int | None] = mapped_column(
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True
    )
    
    # Связи
    parent: Mapped["DocumentCategory | None"] = relationship(
        "DocumentCategory",
        remote_side=[id],
        back_populates="children"
    )
    children: Mapped[list["DocumentCategory"]] = relationship(
        "DocumentCategory",
        back_populates="parent"
    )
    documents: Mapped[list["Document"]] = relationship(
        "Document",
        back_populates="category"
    )
    
    def __repr__(self) -> str:
        return f"<DocumentCategory(id={self.id}, name='{self.name}')>"


class Tag(Base):
    """
    Тег для документов.
    
    Позволяет гибко классифицировать документы.
    """
    
    __tablename__ = "tags"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)
    
    # Мульти-тенантность
    theater_id: Mapped[int | None] = mapped_column(
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True
    )
    
    # Связь с документами
    documents: Mapped[list["Document"]] = relationship(
        "Document",
        secondary=document_tags,
        back_populates="tags"
    )
    
    def __repr__(self) -> str:
        return f"<Tag(id={self.id}, name='{self.name}')>"


class Document(Base, AuditMixin):
    """
    Документ.
    
    Основная сущность документооборота.
    Поддерживает версионирование (N+1: текущая + предыдущая).
    """
    
    __tablename__ = "documents"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Основные поля
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Категоризация
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("document_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Текущий файл
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)  # в байтах
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_type: Mapped[FileType] = mapped_column(
        Enum(FileType, values_callable=lambda x: [e.value for e in x]),
        default=FileType.OTHER,
        nullable=False
    )
    
    # Версионирование
    current_version: Mapped[int] = mapped_column(Integer, default=1)
    
    # Статус
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus, values_callable=lambda x: [e.value for e in x]),
        default=DocumentStatus.ACTIVE,
        nullable=False,
        index=True
    )
    
    # Связь со спектаклем (опционально)
    performance_id: Mapped[int | None] = mapped_column(
        ForeignKey("performances.id", ondelete="SET NULL"),
        nullable=True
    )

    # Связь с цехом (для фильтрации документов по цехам)
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Дополнительные метаданные
    extra_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    # Флаги
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Мульти-тенантность
    theater_id: Mapped[int | None] = mapped_column(
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    
    # Связи
    category: Mapped["DocumentCategory | None"] = relationship(
        "DocumentCategory",
        back_populates="documents"
    )
    versions: Mapped[list["DocumentVersion"]] = relationship(
        "DocumentVersion",
        back_populates="document",
        order_by="desc(DocumentVersion.version)"
    )
    tags: Mapped[list["Tag"]] = relationship(
        "Tag",
        secondary=document_tags,
        back_populates="documents"
    )
    
    def __repr__(self) -> str:
        return f"<Document(id={self.id}, name='{self.name}')>"


class DocumentVersion(Base):
    """
    Версия документа.
    
    Хранит предыдущие версии документа.
    Политика: хранить текущую + 1 предыдущую версию.
    """
    
    __tablename__ = "document_versions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Связь с документом
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Версия
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Файл этой версии
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    
    # Комментарий к версии
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Аудит
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Связи
    document: Mapped["Document"] = relationship(
        "Document",
        back_populates="versions"
    )
    created_by: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[created_by_id]
    )
    
    def __repr__(self) -> str:
        return f"<DocumentVersion(document_id={self.document_id}, version={self.version})>"
