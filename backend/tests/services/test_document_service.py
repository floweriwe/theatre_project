"""
Unit-тесты для DocumentService.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.services.document_service import DocumentService
from app.models.document import Document, DocumentStatus
from app.core.exceptions import ValidationError


@pytest.mark.asyncio
@pytest.mark.service
class TestDocumentServiceVersioning:
    """Тесты для версионирования документов."""

    async def test_archive_document_success(self):
        """Успешное архивирование документа."""
        mock_session = AsyncMock()
        service = DocumentService(mock_session)
        
        document = Document(
            id=1,
            name="Тестовый документ",
            status=DocumentStatus.ACTIVE,
            file_path="path/to/file.pdf",
            file_name="file.pdf",
            file_size=1024,
            mime_type="application/pdf",
        )
        
        service._document_repo.get_with_relations = AsyncMock(return_value=document)
        service._document_repo.update_by_id = AsyncMock()
        service._document_repo.get_with_relations = AsyncMock(
            return_value=Document(
                id=1,
                name="Тестовый документ",
                status=DocumentStatus.ARCHIVED,
                file_path="path/to/file.pdf",
                file_name="file.pdf",
                file_size=1024,
                mime_type="application/pdf",
            )
        )
        
        result = await service.archive_document(document_id=1, user_id=1)
        
        assert result.status == DocumentStatus.ARCHIVED
        mock_session.commit.assert_called_once()

    async def test_restore_document_success(self):
        """Успешное восстановление документа."""
        mock_session = AsyncMock()
        service = DocumentService(mock_session)
        
        document = Document(
            id=1,
            name="Архивный документ",
            status=DocumentStatus.ARCHIVED,
            file_path="path/to/file.pdf",
            file_name="file.pdf",
            file_size=1024,
            mime_type="application/pdf",
        )
        
        service._document_repo.get_with_relations = AsyncMock(return_value=document)
        service._document_repo.update_by_id = AsyncMock()
        service._document_repo.get_with_relations = AsyncMock(
            return_value=Document(
                id=1,
                name="Архивный документ",
                status=DocumentStatus.ACTIVE,
                file_path="path/to/file.pdf",
                file_name="file.pdf",
                file_size=1024,
                mime_type="application/pdf",
            )
        )
        
        result = await service.restore_document(document_id=1, user_id=1)
        
        assert result.status == DocumentStatus.ACTIVE
        mock_session.commit.assert_called_once()

    async def test_archive_already_archived_fails(self):
        """Попытка архивировать уже архивный документ."""
        mock_session = AsyncMock()
        service = DocumentService(mock_session)
        
        document = Document(
            id=1,
            name="Архивный",
            status=DocumentStatus.ARCHIVED,
            file_path="path/to/file.pdf",
            file_name="file.pdf",
            file_size=1024,
            mime_type="application/pdf",
        )
        
        service._document_repo.get_with_relations = AsyncMock(return_value=document)
        
        with pytest.raises(ValidationError):
            await service.archive_document(document_id=1, user_id=1)

    async def test_restore_non_archived_fails(self):
        """Попытка восстановить неархивный документ."""
        mock_session = AsyncMock()
        service = DocumentService(mock_session)
        
        document = Document(
            id=1,
            name="Активный",
            status=DocumentStatus.ACTIVE,
            file_path="path/to/file.pdf",
            file_name="file.pdf",
            file_size=1024,
            mime_type="application/pdf",
        )
        
        service._document_repo.get_with_relations = AsyncMock(return_value=document)
        
        with pytest.raises(ValidationError):
            await service.restore_document(document_id=1, user_id=1)


@pytest.mark.asyncio
@pytest.mark.service
class TestDocumentServiceStats:
    """Тесты для статистики."""

    async def test_get_stats(self):
        """Получение статистики документов."""
        mock_session = AsyncMock()
        service = DocumentService(mock_session)
        
        service._document_repo.get_stats = AsyncMock(return_value={
            "total_documents": 150,
            "active": 100,
            "draft": 30,
            "archived": 20,
            "total_size": 5242880,
            "pdf_count": 50,
            "document_count": 60,
            "spreadsheet_count": 20,
            "image_count": 15,
            "other_count": 5,
        })
        
        service._category_repo.get_all = AsyncMock(return_value=[
            MagicMock(id=1, is_active=True),
            MagicMock(id=2, is_active=True),
        ])
        service._category_repo.count = AsyncMock(return_value=2)
        
        service._tag_repo.get_all = AsyncMock(return_value=[
            MagicMock(id=1),
            MagicMock(id=2),
            MagicMock(id=3),
        ])
        
        result = await service.get_stats(theater_id=1)
        
        assert result.total_documents == 150
        assert result.active == 100
        assert result.archived == 20
        assert result.pdf_count == 50
        assert result.categories_count == 2
        assert result.tags_count == 3
