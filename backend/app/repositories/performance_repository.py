"""
Репозиторий модуля спектаклей.

Содержит классы для работы с БД:
- PerformanceRepository
- PerformanceSectionRepository
"""
from typing import Sequence

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.performance import (
    Performance,
    PerformanceSection,
    PerformanceStatus,
    SectionType,
)
from app.repositories.base import BaseRepository


class PerformanceRepository(BaseRepository[Performance]):
    """Репозиторий для работы со спектаклями."""
    
    def __init__(self, session: AsyncSession):
        super().__init__(Performance, session)
    
    async def get_with_sections(self, performance_id: int) -> Performance | None:
        """Получить спектакль с разделами паспорта."""
        query = (
            select(Performance)
            .options(selectinload(Performance.sections))
            .where(Performance.id == performance_id)
        )
        result = await self._session.execute(query)
        return result.scalar_one_or_none()
    
    async def search(
        self,
        search: str | None = None,
        status: PerformanceStatus | None = None,
        genre: str | None = None,
        is_active: bool | None = None,
        theater_id: int | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[Performance], int]:
        """
        Поиск спектаклей с фильтрацией.
        
        Returns:
            Кортеж (список спектаклей, общее количество)
        """
        # Базовый запрос
        query = select(Performance)
        count_query = select(func.count(Performance.id))
        
        # Фильтры
        filters = []
        
        if search:
            search_filter = or_(
                Performance.title.ilike(f"%{search}%"),
                Performance.subtitle.ilike(f"%{search}%"),
                Performance.author.ilike(f"%{search}%"),
                Performance.director.ilike(f"%{search}%"),
            )
            filters.append(search_filter)
        
        if status is not None:
            filters.append(Performance.status == status)
        
        if genre is not None:
            filters.append(Performance.genre.ilike(f"%{genre}%"))
        
        if is_active is not None:
            filters.append(Performance.is_active == is_active)
        
        if theater_id is not None:
            filters.append(Performance.theater_id == theater_id)
        
        # Применяем фильтры
        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))
        
        # Получаем общее количество
        total_result = await self._session.execute(count_query)
        total = total_result.scalar() or 0
        
        # Применяем пагинацию и сортировку
        query = (
            query
            .order_by(Performance.title)
            .offset(skip)
            .limit(limit)
        )
        
        result = await self._session.execute(query)
        performances = result.scalars().all()
        
        return performances, total
    
    async def get_by_status(
        self,
        status: PerformanceStatus,
        theater_id: int | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[Performance]:
        """Получить спектакли по статусу."""
        query = (
            select(Performance)
            .where(Performance.status == status)
            .where(Performance.is_active.is_(True))
            .order_by(Performance.title)
            .offset(skip)
            .limit(limit)
        )
        if theater_id:
            query = query.where(Performance.theater_id == theater_id)
        result = await self._session.execute(query)
        return result.scalars().all()
    
    async def get_repertoire(
        self,
        theater_id: int | None = None,
    ) -> Sequence[Performance]:
        """Получить текущий репертуар (спектакли в статусе in_repertoire)."""
        return await self.get_by_status(
            PerformanceStatus.IN_REPERTOIRE,
            theater_id=theater_id,
        )
    
    async def get_stats(self, theater_id: int | None = None) -> dict:
        """Получить статистику спектаклей."""
        base_filter = Performance.is_active.is_(True)
        if theater_id:
            base_filter = and_(base_filter, Performance.theater_id == theater_id)
        
        # Общее количество
        total_query = select(func.count(Performance.id)).where(base_filter)
        total_result = await self._session.execute(total_query)
        total = total_result.scalar() or 0
        
        stats = {"total_performances": total}
        
        # По статусам
        for status in PerformanceStatus:
            status_query = (
                select(func.count(Performance.id))
                .where(base_filter)
                .where(Performance.status == status)
            )
            result = await self._session.execute(status_query)
            stats[status.value] = result.scalar() or 0
        
        # Топ жанров
        genres_query = (
            select(Performance.genre, func.count(Performance.id).label('count'))
            .where(base_filter)
            .where(Performance.genre.isnot(None))
            .group_by(Performance.genre)
            .order_by(func.count(Performance.id).desc())
            .limit(5)
        )
        genres_result = await self._session.execute(genres_query)
        stats["genres"] = [
            {"genre": row[0], "count": row[1]}
            for row in genres_result.all()
        ]
        
        return stats


class PerformanceSectionRepository(BaseRepository[PerformanceSection]):
    """Репозиторий для работы с разделами паспорта."""
    
    def __init__(self, session: AsyncSession):
        super().__init__(PerformanceSection, session)
    
    async def get_by_performance(
        self,
        performance_id: int,
    ) -> Sequence[PerformanceSection]:
        """Получить разделы спектакля."""
        query = (
            select(PerformanceSection)
            .where(PerformanceSection.performance_id == performance_id)
            .order_by(PerformanceSection.sort_order, PerformanceSection.id)
        )
        result = await self._session.execute(query)
        return result.scalars().all()
    
    async def get_by_type(
        self,
        performance_id: int,
        section_type: SectionType,
    ) -> PerformanceSection | None:
        """Получить раздел по типу."""
        query = (
            select(PerformanceSection)
            .where(PerformanceSection.performance_id == performance_id)
            .where(PerformanceSection.section_type == section_type)
        )
        result = await self._session.execute(query)
        return result.scalar_one_or_none()
    
    async def create_default_sections(
        self,
        performance_id: int,
        user_id: int | None = None,
    ) -> list[PerformanceSection]:
        """
        Создать стандартные разделы паспорта для спектакля.
        
        Создаёт разделы всех типов с пустым содержимым.
        """
        section_titles = {
            SectionType.LIGHTING: "Световая партитура",
            SectionType.SOUND: "Звуковая партитура",
            SectionType.SCENERY: "Декорации",
            SectionType.PROPS: "Реквизит",
            SectionType.COSTUMES: "Костюмы",
            SectionType.MAKEUP: "Грим и причёски",
            SectionType.VIDEO: "Видеопроекции",
            SectionType.EFFECTS: "Спецэффекты",
            SectionType.OTHER: "Прочее",
        }
        
        sections = []
        for idx, (section_type, title) in enumerate(section_titles.items()):
            section = PerformanceSection(
                performance_id=performance_id,
                section_type=section_type,
                title=title,
                sort_order=idx,
                created_by_id=user_id,
                updated_by_id=user_id,
            )
            self._session.add(section)
            sections.append(section)
        
        await self._session.flush()
        return sections
