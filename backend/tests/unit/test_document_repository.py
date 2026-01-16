"""Unit tests for document repository."""
import pytest
from app.models.document import Document, DocumentCategory, DocumentVersion, Tag, DocumentStatus, FileType
from app.repositories.document_repository import DocumentRepository, DocumentCategoryRepository, DocumentVersionRepository, TagRepository

@pytest.mark.asyncio
@pytest.mark.unit
class TestDocumentCategoryRepository:
    async def test_get_by_code(self, test_db):
        repo = DocumentCategoryRepository(test_db)
        category = DocumentCategory(name="Tech Docs", code="TECH")
        test_db.add(category)
        await test_db.commit()
        await test_db.refresh(category)
        
        found = await repo.get_by_code("TECH")
        assert found is not None
        assert found.name == "Tech Docs"
    
    async def test_get_tree(self, test_db):
        repo = DocumentCategoryRepository(test_db)
        parent = DocumentCategory(name="Parent", code="PAR")
        test_db.add(parent)
        await test_db.commit()
        await test_db.refresh(parent)
        
        child = DocumentCategory(name="Child", code="CHI", parent_id=parent.id)
        test_db.add(child)
        await test_db.commit()
        
        tree = await repo.get_tree()
        assert len(tree) >= 1


@pytest.mark.asyncio
@pytest.mark.unit
class TestDocumentRepository:
    async def test_search_documents(self, test_db):
        repo = DocumentRepository(test_db)
        
        doc1 = Document(
            name="Tech Manual",
            file_name="manual.pdf",
            file_path="/docs/manual.pdf",
            file_size=1024,
            file_type=FileType.PDF,
            status=DocumentStatus.PUBLISHED
        )
        doc2 = Document(
            name="User Guide",
            file_name="guide.pdf",
            file_path="/docs/guide.pdf",
            file_size=2048,
            file_type=FileType.PDF,
            status=DocumentStatus.DRAFT
        )
        test_db.add_all([doc1, doc2])
        await test_db.commit()
        
        results, total = await repo.search(search="manual")
        assert total == 1
        assert results[0].name == "Tech Manual"
        
        results, total = await repo.search(status=DocumentStatus.PUBLISHED)
        assert total == 1
        assert results[0].name == "Tech Manual"
    
    async def test_search_by_category(self, test_db):
        repo = DocumentRepository(test_db)
        
        category = DocumentCategory(name="Technical", code="TECH")
        test_db.add(category)
        await test_db.commit()
        await test_db.refresh(category)
        
        doc = Document(
            name="Doc1",
            file_name="doc1.pdf",
            file_path="/docs/doc1.pdf",
            file_size=1024,
            file_type=FileType.PDF,
            status=DocumentStatus.PUBLISHED,
            category_id=category.id
        )
        test_db.add(doc)
        await test_db.commit()
        
        results, total = await repo.search(category_id=category.id)
        assert total == 1
        assert results[0].name == "Doc1"
    
    async def test_get_by_category(self, test_db):
        repo = DocumentRepository(test_db)
        
        category = DocumentCategory(name="Scripts", code="SCR")
        test_db.add(category)
        await test_db.commit()
        await test_db.refresh(category)
        
        docs = [
            Document(name="Doc1", file_name="d1.pdf", file_path="/d1", file_size=100, file_type=FileType.PDF, status=DocumentStatus.PUBLISHED, category_id=category.id),
            Document(name="Doc2", file_name="d2.pdf", file_path="/d2", file_size=200, file_type=FileType.PDF, status=DocumentStatus.PUBLISHED, category_id=category.id),
        ]
        test_db.add_all(docs)
        await test_db.commit()
        
        results = await repo.get_by_category(category.id)
        assert len(results) == 2


@pytest.mark.asyncio
@pytest.mark.unit
class TestDocumentVersionRepository:
    async def test_get_by_document(self, test_db):
        repo = DocumentVersionRepository(test_db)
        
        doc = Document(
            name="Versioned Doc",
            file_name="doc.pdf",
            file_path="/doc.pdf",
            file_size=1024,
            file_type=FileType.PDF,
            status=DocumentStatus.PUBLISHED
        )
        test_db.add(doc)
        await test_db.commit()
        await test_db.refresh(doc)
        
        versions = [
            DocumentVersion(document_id=doc.id, version=1, file_name="v1.pdf", file_path="/v1.pdf", file_size=1000),
            DocumentVersion(document_id=doc.id, version=2, file_name="v2.pdf", file_path="/v2.pdf", file_size=1100),
        ]
        test_db.add_all(versions)
        await test_db.commit()
        
        results = await repo.get_by_document(doc.id)
        assert len(results) == 2
    
    async def test_get_latest_version(self, test_db):
        repo = DocumentVersionRepository(test_db)
        
        doc = Document(
            name="Test Doc",
            file_name="doc.pdf",
            file_path="/doc.pdf",
            file_size=1024,
            file_type=FileType.PDF,
            status=DocumentStatus.PUBLISHED
        )
        test_db.add(doc)
        await test_db.commit()
        await test_db.refresh(doc)
        
        versions = [
            DocumentVersion(document_id=doc.id, version=1, file_name="v1.pdf", file_path="/v1.pdf", file_size=1000),
            DocumentVersion(document_id=doc.id, version=2, file_name="v2.pdf", file_path="/v2.pdf", file_size=1100),
            DocumentVersion(document_id=doc.id, version=3, file_name="v3.pdf", file_path="/v3.pdf", file_size=1200),
        ]
        test_db.add_all(versions)
        await test_db.commit()
        
        latest = await repo.get_latest(doc.id)
        assert latest is not None
        assert latest.version == 3


@pytest.mark.asyncio
@pytest.mark.unit
class TestTagRepository:
    async def test_get_by_name(self, test_db):
        repo = TagRepository(test_db)
        
        tag = Tag(name="important")
        test_db.add(tag)
        await test_db.commit()
        await test_db.refresh(tag)
        
        found = await repo.get_by_name("important")
        assert found is not None
        assert found.name == "important"
    
    async def test_get_or_create(self, test_db):
        repo = TagRepository(test_db)
        
        tag1 = await repo.get_or_create("new-tag")
        assert tag1.name == "new-tag"
        
        tag2 = await repo.get_or_create("new-tag")
        assert tag2.id == tag1.id
