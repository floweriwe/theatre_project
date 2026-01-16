"""Unit tests for performance repository."""
import pytest
from app.models.performance import Performance, PerformanceSection, PerformanceStatus, SectionType
from app.repositories.performance_repository import PerformanceRepository, PerformanceSectionRepository

@pytest.mark.asyncio
@pytest.mark.unit
class TestPerformanceRepository:
    async def test_search_performances(self, test_db):
        repo = PerformanceRepository(test_db)
        perf1 = Performance(title="Hamlet", author="Shakespeare", status=PerformanceStatus.IN_REPERTOIRE)
        perf2 = Performance(title="Romeo", author="Shakespeare", status=PerformanceStatus.PREPARATION)
        test_db.add_all([perf1, perf2])
        await test_db.commit()
        
        results, total = await repo.search(search="hamlet")
        assert total == 1
        assert results[0].title == "Hamlet"
        
        results, total = await repo.search(status=PerformanceStatus.IN_REPERTOIRE)
        assert total == 1
        assert results[0].title == "Hamlet"
    
    async def test_get_repertoire(self, test_db):
        repo = PerformanceRepository(test_db)
        perf1 = Performance(title="In Repertoire", status=PerformanceStatus.IN_REPERTOIRE)
        perf2 = Performance(title="Archived", status=PerformanceStatus.ARCHIVED)
        test_db.add_all([perf1, perf2])
        await test_db.commit()
        
        repertoire = await repo.get_repertoire()
        assert len(repertoire) == 1
        assert repertoire[0].title == "In Repertoire"
    
    async def test_get_with_sections(self, test_db):
        repo = PerformanceRepository(test_db)
        perf = Performance(title="Test Performance", status=PerformanceStatus.PREPARATION)
        test_db.add(perf)
        await test_db.commit()
        await test_db.refresh(perf)
        
        section = PerformanceSection(
            performance_id=perf.id,
            section_type=SectionType.LIGHTING,
            title="Lighting Plan"
        )
        test_db.add(section)
        await test_db.commit()
        
        result = await repo.get_with_sections(perf.id)
        assert result is not None
        assert len(result.sections) == 1
        assert result.sections[0].title == "Lighting Plan"
    
    async def test_get_by_status(self, test_db):
        repo = PerformanceRepository(test_db)
        perf1 = Performance(title="Active", status=PerformanceStatus.IN_REPERTOIRE)
        perf2 = Performance(title="Paused", status=PerformanceStatus.PAUSED)
        test_db.add_all([perf1, perf2])
        await test_db.commit()
        
        active = await repo.get_by_status(PerformanceStatus.IN_REPERTOIRE)
        assert len(active) == 1
        assert active[0].title == "Active"


@pytest.mark.asyncio
@pytest.mark.unit
class TestPerformanceSectionRepository:
    async def test_get_by_performance(self, test_db):
        repo = PerformanceSectionRepository(test_db)
        
        perf = Performance(title="Test", status=PerformanceStatus.PREPARATION)
        test_db.add(perf)
        await test_db.commit()
        await test_db.refresh(perf)
        
        sections = [
            PerformanceSection(performance_id=perf.id, section_type=SectionType.LIGHTING, title="Light", sort_order=1),
            PerformanceSection(performance_id=perf.id, section_type=SectionType.SOUND, title="Sound", sort_order=2),
        ]
        test_db.add_all(sections)
        await test_db.commit()
        
        results = await repo.get_by_performance(perf.id)
        assert len(results) == 2
        assert results[0].title == "Light"
        assert results[1].title == "Sound"
    
    async def test_get_by_type(self, test_db):
        repo = PerformanceSectionRepository(test_db)
        
        perf = Performance(title="Test", status=PerformanceStatus.PREPARATION)
        test_db.add(perf)
        await test_db.commit()
        await test_db.refresh(perf)
        
        section = PerformanceSection(
            performance_id=perf.id,
            section_type=SectionType.PROPS,
            title="Props List"
        )
        test_db.add(section)
        await test_db.commit()
        
        result = await repo.get_by_type(perf.id, SectionType.PROPS)
        assert result is not None
        assert result.title == "Props List"
