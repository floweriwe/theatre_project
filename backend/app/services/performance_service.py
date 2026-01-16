"""
Сервис модуля спектаклей.

Бизнес-логика для работы со спектаклями:
- CRUD операции
- Управление паспортом спектакля
- Статистика
"""
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import NotFoundError, ValidationError
from app.models.performance import (
    Performance,
    PerformanceSection,
    PerformanceStatus,
    SectionType,
)
from app.repositories.performance_repository import (
    PerformanceRepository,
    PerformanceSectionRepository,
)
from app.schemas.performance import (
    PerformanceCreate,
    PerformanceUpdate,
    SectionCreate,
    SectionUpdate,
    PerformanceStats,
)


class PerformanceService:
    """
    Сервис спектаклей.
    
    Управляет спектаклями, их паспортами и статусами.
    """
    
    def __init__(self, session: AsyncSession):
        self._session = session
        self._performance_repo = PerformanceRepository(session)
        self._section_repo = PerformanceSectionRepository(session)
        self._storage_path = Path(settings.STORAGE_PATH) / "performances"
        self._storage_path.mkdir(parents=True, exist_ok=True)
    
    # =========================================================================
    # Performances
    # =========================================================================
    
    async def get_performances(
        self,
        search: str | None = None,
        status: PerformanceStatus | None = None,
        genre: str | None = None,
        is_active: bool | None = True,
        theater_id: int | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Performance], int]:
        """Получить список спектаклей с фильтрацией."""
        performances, total = await self._performance_repo.search(
            search=search,
            status=status,
            genre=genre,
            is_active=is_active,
            theater_id=theater_id,
            skip=skip,
            limit=limit,
        )
        return list(performances), total
    
    async def get_performance(self, performance_id: int) -> Performance:
        """Получить спектакль по ID с разделами."""
        performance = await self._performance_repo.get_with_sections(performance_id)
        if not performance:
            raise NotFoundError(f"Спектакль с ID {performance_id} не найден")
        return performance
    
    async def get_repertoire(
        self,
        theater_id: int | None = None,
    ) -> list[Performance]:
        """Получить текущий репертуар."""
        performances = await self._performance_repo.get_repertoire(theater_id)
        return list(performances)
    
    async def create_performance(
        self,
        data: PerformanceCreate,
        user_id: int,
        theater_id: int | None = None,
        create_default_sections: bool = True,
    ) -> Performance:
        """
        Создать спектакль.
        
        Args:
            data: Данные спектакля
            user_id: ID пользователя
            theater_id: ID театра
            create_default_sections: Создать стандартные разделы паспорта
        """
        performance = Performance(
            **data.model_dump(),
            status=PerformanceStatus.PREPARATION,
            theater_id=theater_id,
            created_by_id=user_id,
            updated_by_id=user_id,
        )
        
        self._session.add(performance)
        await self._session.flush()
        
        # Создаём стандартные разделы паспорта
        if create_default_sections:
            await self._section_repo.create_default_sections(
                performance_id=performance.id,
                user_id=user_id,
            )
        
        await self._session.commit()
        
        return await self._performance_repo.get_with_sections(performance.id)
    
    async def update_performance(
        self,
        performance_id: int,
        data: PerformanceUpdate,
        user_id: int,
    ) -> Performance:
        """Обновить спектакль."""
        await self.get_performance(performance_id)
        
        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_by_id"] = user_id
        
        await self._performance_repo.update_by_id(performance_id, update_data)
        await self._session.commit()
        
        return await self._performance_repo.get_with_sections(performance_id)
    
    async def delete_performance(self, performance_id: int, user_id: int) -> bool:
        """Удалить спектакль (soft delete)."""
        await self.get_performance(performance_id)
        await self._performance_repo.update_by_id(performance_id, {
            "is_active": False,
            "updated_by_id": user_id,
        })
        await self._session.commit()
        return True
    
    # =========================================================================
    # Status Management
    # =========================================================================
    
    async def change_status(
        self,
        performance_id: int,
        new_status: PerformanceStatus,
        user_id: int,
    ) -> Performance:
        """
        Изменить статус спектакля.
        
        Валидирует переходы между статусами.
        """
        performance = await self.get_performance(performance_id)
        current_status = performance.status
        
        # Правила перехода
        valid_transitions = {
            PerformanceStatus.PREPARATION: [
                PerformanceStatus.IN_REPERTOIRE,
                PerformanceStatus.ARCHIVED,
            ],
            PerformanceStatus.IN_REPERTOIRE: [
                PerformanceStatus.PAUSED,
                PerformanceStatus.ARCHIVED,
            ],
            PerformanceStatus.PAUSED: [
                PerformanceStatus.IN_REPERTOIRE,
                PerformanceStatus.ARCHIVED,
            ],
            PerformanceStatus.ARCHIVED: [
                PerformanceStatus.PREPARATION,  # Восстановление
            ],
        }
        
        if new_status not in valid_transitions.get(current_status, []):
            raise ValidationError(
                f"Невозможно перейти из статуса '{current_status.value}' в '{new_status.value}'"
            )
        
        await self._performance_repo.update_by_id(performance_id, {
            "status": new_status,
            "updated_by_id": user_id,
        })
        await self._session.commit()
        
        return await self._performance_repo.get_with_sections(performance_id)
    
    async def to_repertoire(self, performance_id: int, user_id: int) -> Performance:
        """Перевести спектакль в репертуар."""
        return await self.change_status(
            performance_id,
            PerformanceStatus.IN_REPERTOIRE,
            user_id,
        )
    
    async def pause(self, performance_id: int, user_id: int) -> Performance:
        """Поставить спектакль на паузу."""
        return await self.change_status(
            performance_id,
            PerformanceStatus.PAUSED,
            user_id,
        )
    
    async def archive(self, performance_id: int, user_id: int) -> Performance:
        """Архивировать спектакль."""
        return await self.change_status(
            performance_id,
            PerformanceStatus.ARCHIVED,
            user_id,
        )
    
    async def restore(self, performance_id: int, user_id: int) -> Performance:
        """Восстановить спектакль из архива."""
        return await self.change_status(
            performance_id,
            PerformanceStatus.PREPARATION,
            user_id,
        )
    
    # =========================================================================
    # Poster
    # =========================================================================
    
    async def upload_poster(
        self,
        performance_id: int,
        file: UploadFile,
        user_id: int,
    ) -> Performance:
        """Загрузить постер спектакля."""
        performance = await self.get_performance(performance_id)
        
        # Проверяем тип файла
        allowed_types = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
        if file.content_type not in allowed_types:
            raise ValidationError("Допустимы только изображения (PNG, JPEG, WebP)")
        
        # Читаем файл
        content = await file.read()
        max_size = 5 * 1024 * 1024  # 5 MB
        if len(content) > max_size:
            raise ValidationError("Размер файла не должен превышать 5 MB")
        
        # Сохраняем
        ext = Path(file.filename or "poster.jpg").suffix or ".jpg"
        poster_path = f"{performance_id}/poster{ext}"
        full_path = self._storage_path / poster_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(full_path, "wb") as f:
            f.write(content)
        
        # Обновляем спектакль
        await self._performance_repo.update_by_id(performance_id, {
            "poster_path": poster_path,
            "updated_by_id": user_id,
        })
        await self._session.commit()
        
        return await self._performance_repo.get_with_sections(performance_id)
    
    # =========================================================================
    # Sections
    # =========================================================================
    
    async def get_sections(self, performance_id: int) -> list[PerformanceSection]:
        """Получить разделы паспорта спектакля."""
        await self.get_performance(performance_id)
        sections = await self._section_repo.get_by_performance(performance_id)
        return list(sections)
    
    async def get_section(self, section_id: int) -> PerformanceSection:
        """Получить раздел по ID."""
        section = await self._section_repo.get_by_id(section_id)
        if not section:
            raise NotFoundError(f"Раздел с ID {section_id} не найден")
        return section
    
    async def create_section(
        self,
        performance_id: int,
        data: SectionCreate,
        user_id: int,
    ) -> PerformanceSection:
        """Создать раздел паспорта."""
        await self.get_performance(performance_id)
        
        # Проверяем, нет ли уже раздела такого типа
        existing = await self._section_repo.get_by_type(
            performance_id,
            data.section_type,
        )
        if existing:
            raise ValidationError(
                f"Раздел типа '{data.section_type.value}' уже существует"
            )
        
        section = PerformanceSection(
            performance_id=performance_id,
            **data.model_dump(),
            created_by_id=user_id,
            updated_by_id=user_id,
        )
        
        self._session.add(section)
        await self._session.commit()
        
        return await self._section_repo.get_by_id(section.id)
    
    async def update_section(
        self,
        section_id: int,
        data: SectionUpdate,
        user_id: int,
    ) -> PerformanceSection:
        """Обновить раздел паспорта."""
        await self.get_section(section_id)
        
        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_by_id"] = user_id
        
        await self._section_repo.update_by_id(section_id, update_data)
        await self._session.commit()
        
        return await self._section_repo.get_by_id(section_id)
    
    async def delete_section(self, section_id: int) -> bool:
        """Удалить раздел паспорта."""
        section = await self.get_section(section_id)
        await self._session.delete(section)
        await self._session.commit()
        return True
    
    # =========================================================================
    # Statistics
    # =========================================================================
    
    async def get_stats(self, theater_id: int | None = None) -> PerformanceStats:
        """Получить статистику спектаклей."""
        stats = await self._performance_repo.get_stats(theater_id)
        
        return PerformanceStats(
            total_performances=stats["total_performances"],
            preparation=stats.get("preparation", 0),
            in_repertoire=stats.get("in_repertoire", 0),
            paused=stats.get("paused", 0),
            archived=stats.get("archived", 0),
            genres=stats.get("genres", []),
        )
