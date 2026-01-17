"""
Репозиторий для работы с шаблонами документов.
"""
from typing import Any

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.document_template import (
    DocumentTemplate,
    DocumentTemplateVariable,
    TemplateType,
)
from app.repositories.base import BaseRepository


class TemplateRepository(BaseRepository[DocumentTemplate]):
    """Репозиторий для шаблонов документов."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(DocumentTemplate, session)

    def _base_query(self) -> Select[tuple[DocumentTemplate]]:
        """Базовый запрос с загрузкой переменных."""
        return select(self._model).options(
            selectinload(DocumentTemplate.variables)
        )

    async def get_by_id(self, id: int) -> DocumentTemplate | None:
        """Получить шаблон по ID с переменными."""
        result = await self._session.execute(
            self._base_query().where(self._model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> DocumentTemplate | None:
        """Получить шаблон по коду."""
        result = await self._session.execute(
            self._base_query().where(self._model.code == code)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        theater_id: int | None = None,
        template_type: TemplateType | None = None,
        is_active: bool | None = None,
    ) -> list[DocumentTemplate]:
        """
        Получить список шаблонов с фильтрацией.

        Args:
            skip: Пропустить записей
            limit: Максимум записей
            theater_id: Фильтр по театру
            template_type: Фильтр по типу
            is_active: Фильтр по активности
        """
        query = self._base_query()

        if theater_id is not None:
            query = query.where(
                (self._model.theater_id == theater_id) |
                (self._model.theater_id.is_(None))  # Системные шаблоны для всех
            )

        if template_type is not None:
            query = query.where(self._model.template_type == template_type)

        if is_active is not None:
            query = query.where(self._model.is_active == is_active)

        query = query.order_by(self._model.template_type, self._model.name)
        query = query.offset(skip).limit(limit)

        result = await self._session.execute(query)
        return list(result.scalars().all())

    async def count(
        self,
        *,
        theater_id: int | None = None,
        template_type: TemplateType | None = None,
        is_active: bool | None = None,
    ) -> int:
        """Подсчёт шаблонов с фильтрацией."""
        query = select(func.count()).select_from(self._model)

        if theater_id is not None:
            query = query.where(
                (self._model.theater_id == theater_id) |
                (self._model.theater_id.is_(None))
            )

        if template_type is not None:
            query = query.where(self._model.template_type == template_type)

        if is_active is not None:
            query = query.where(self._model.is_active == is_active)

        result = await self._session.execute(query)
        return result.scalar_one()

    async def code_exists(self, code: str, exclude_id: int | None = None) -> bool:
        """Проверить, существует ли шаблон с таким кодом."""
        query = select(func.count()).select_from(self._model).where(
            self._model.code == code
        )

        if exclude_id is not None:
            query = query.where(self._model.id != exclude_id)

        result = await self._session.execute(query)
        return result.scalar_one() > 0


class TemplateVariableRepository(BaseRepository[DocumentTemplateVariable]):
    """Репозиторий для переменных шаблонов."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(DocumentTemplateVariable, session)

    async def get_by_template_id(
        self,
        template_id: int,
    ) -> list[DocumentTemplateVariable]:
        """Получить все переменные шаблона."""
        result = await self._session.execute(
            select(self._model)
            .where(self._model.template_id == template_id)
            .order_by(self._model.sort_order, self._model.id)
        )
        return list(result.scalars().all())

    async def get_by_name(
        self,
        template_id: int,
        name: str,
    ) -> DocumentTemplateVariable | None:
        """Получить переменную по имени в шаблоне."""
        result = await self._session.execute(
            select(self._model).where(
                self._model.template_id == template_id,
                self._model.name == name,
            )
        )
        return result.scalar_one_or_none()

    async def bulk_create(
        self,
        template_id: int,
        variables_data: list[dict[str, Any]],
    ) -> list[DocumentTemplateVariable]:
        """Массовое создание переменных."""
        variables = []
        for data in variables_data:
            data['template_id'] = template_id
            variable = DocumentTemplateVariable(**data)
            self._session.add(variable)
            variables.append(variable)

        await self._session.flush()

        for var in variables:
            await self._session.refresh(var)

        return variables

    async def delete_by_template_id(self, template_id: int) -> int:
        """Удалить все переменные шаблона."""
        from sqlalchemy import delete

        result = await self._session.execute(
            delete(self._model).where(self._model.template_id == template_id)
        )
        await self._session.flush()
        return result.rowcount

    async def reorder(
        self,
        template_id: int,
        variable_ids: list[int],
    ) -> None:
        """Изменить порядок переменных."""
        for order, var_id in enumerate(variable_ids):
            await self._session.execute(
                select(self._model).where(
                    self._model.id == var_id,
                    self._model.template_id == template_id,
                )
            )
            # Update order
            variable = await self.get_by_id(var_id)
            if variable and variable.template_id == template_id:
                variable.sort_order = order

        await self._session.flush()
