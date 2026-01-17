"""
Сервис для построения иерархического дерева документов спектакля.

Группирует документы по разделам и категориям для удобного отображения
в интерфейсе пользователя.
"""
from collections import defaultdict
from datetime import timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.performance_document import (
    PerformanceDocument,
    DocumentSection,
    PerformanceDocumentCategory,
)
from app.schemas.performance_document import (
    SECTION_NAMES,
    CATEGORY_NAMES,
    PerformanceDocumentsTree,
    DocumentTreeSection,
    DocumentTreeCategory,
    PerformanceDocumentListItem,
)
from app.services.performance_document_service import performance_document_storage


class DocumentTreeService:
    """
    Сервис для построения дерева документов спектакля.

    Создаёт иерархическую структуру:
    - Разделы паспорта (1.0, 2.0, 3.0, 4.0)
        - Категории документов
            - Список документов
    """

    def __init__(self) -> None:
        """Инициализация сервиса."""
        self._storage = performance_document_storage

    async def get_document_tree(
        self,
        session: AsyncSession,
        performance_id: int,
    ) -> PerformanceDocumentsTree:
        """
        Построить дерево документов спектакля.

        Args:
            session: Сессия БД
            performance_id: ID спектакля

        Returns:
            PerformanceDocumentsTree: Иерархическая структура документов
        """
        # Загружаем все текущие документы спектакля
        query = (
            select(PerformanceDocument)
            .where(PerformanceDocument.performance_id == performance_id)
            .where(PerformanceDocument.is_current == True)
            .order_by(
                PerformanceDocument.section,
                PerformanceDocument.category,
                PerformanceDocument.sort_order,
                PerformanceDocument.uploaded_at.desc(),
            )
        )

        result = await session.execute(query)
        documents = result.scalars().all()

        # Группируем документы по разделам и категориям
        tree_data = self._build_tree_structure(documents)

        # Формируем итоговую структуру
        sections = []
        total_documents = 0

        # Проходим по всем разделам в правильном порядке
        for section_enum in DocumentSection:
            section_categories = tree_data.get(section_enum, {})

            if not section_categories:
                # Пропускаем пустые разделы
                continue

            categories = []
            section_total = 0

            # Проходим по всем категориям в алфавитном порядке
            for category_enum, category_docs in sorted(
                section_categories.items(),
                key=lambda x: CATEGORY_NAMES.get(x[0], ""),
            ):
                # Создаём список документов с download URL
                doc_list = [
                    PerformanceDocumentListItem(
                        id=doc.id,
                        file_name=doc.file_name,
                        file_size=doc.file_size,
                        mime_type=doc.mime_type,
                        section=doc.section,
                        category=doc.category,
                        display_name=doc.display_name,
                        uploaded_at=doc.uploaded_at,
                        download_url=self._generate_download_url(doc),
                    )
                    for doc in category_docs
                ]

                category_total = len(doc_list)
                section_total += category_total

                categories.append(
                    DocumentTreeCategory(
                        category=category_enum,
                        category_name=CATEGORY_NAMES.get(
                            category_enum,
                            category_enum.value,
                        ),
                        documents=doc_list,
                        count=category_total,
                    )
                )

            total_documents += section_total

            sections.append(
                DocumentTreeSection(
                    section=section_enum,
                    section_name=SECTION_NAMES.get(
                        section_enum,
                        section_enum.value,
                    ),
                    categories=categories,
                    total_count=section_total,
                )
            )

        return PerformanceDocumentsTree(
            performance_id=performance_id,
            sections=sections,
            total_documents=total_documents,
        )

    async def get_document_stats(
        self,
        session: AsyncSession,
        performance_id: int,
    ) -> dict:
        """
        Получить статистику документов спектакля.

        Args:
            session: Сессия БД
            performance_id: ID спектакля

        Returns:
            dict: Статистика по разделам и категориям
        """
        # Подсчёт документов по разделам
        section_stats_query = (
            select(
                PerformanceDocument.section,
                func.count(PerformanceDocument.id).label("count"),
            )
            .where(PerformanceDocument.performance_id == performance_id)
            .where(PerformanceDocument.is_current == True)
            .group_by(PerformanceDocument.section)
        )

        section_result = await session.execute(section_stats_query)
        section_stats = {
            section: count for section, count in section_result.all()
        }

        # Подсчёт документов по категориям
        category_stats_query = (
            select(
                PerformanceDocument.category,
                func.count(PerformanceDocument.id).label("count"),
            )
            .where(PerformanceDocument.performance_id == performance_id)
            .where(PerformanceDocument.is_current == True)
            .group_by(PerformanceDocument.category)
        )

        category_result = await session.execute(category_stats_query)
        category_stats = {
            category: count for category, count in category_result.all()
        }

        # Общее количество документов
        total_query = (
            select(func.count(PerformanceDocument.id))
            .where(PerformanceDocument.performance_id == performance_id)
            .where(PerformanceDocument.is_current == True)
        )

        total_result = await session.execute(total_query)
        total_documents = total_result.scalar() or 0

        return {
            "total_documents": total_documents,
            "by_section": section_stats,
            "by_category": category_stats,
        }

    def _build_tree_structure(
        self,
        documents: list[PerformanceDocument],
    ) -> dict[DocumentSection, dict[PerformanceDocumentCategory, list[PerformanceDocument]]]:
        """
        Построить структуру дерева из списка документов.

        Args:
            documents: Список документов

        Returns:
            Словарь: section -> category -> [documents]
        """
        tree = defaultdict(lambda: defaultdict(list))

        for doc in documents:
            tree[doc.section][doc.category].append(doc)

        return dict(tree)

    def _generate_download_url(
        self,
        document: PerformanceDocument,
    ) -> str:
        """
        Сгенерировать presigned URL для скачивания документа.

        Args:
            document: Документ

        Returns:
            Presigned URL (действителен 1 час)
        """
        return self._storage.get_download_url(
            storage_path=document.file_path,
            expires=timedelta(hours=1),
        )


# Глобальный экземпляр сервиса
document_tree_service = DocumentTreeService()
