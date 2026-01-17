"""
Сервис для работы с шаблонами документов.

Бизнес-логика для:
- CRUD операций с шаблонами
- Управления переменными шаблонов
- Валидации
"""
from typing import Any

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AlreadyExistsError, NotFoundError, ValidationError
from app.models.document_template import (
    DocumentTemplate,
    DocumentTemplateVariable,
    TemplateType,
)
from app.repositories.template_repository import (
    TemplateRepository,
    TemplateVariableRepository,
)
from app.schemas.document_template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateVariableCreate,
    TemplateVariableUpdate,
)
from app.services.minio_service import MinioService


# Разрешённые расширения для шаблонов
ALLOWED_TEMPLATE_EXTENSIONS = {".docx"}


class TemplateService:
    """Сервис для работы с шаблонами документов."""

    def __init__(self, session: AsyncSession) -> None:
        """
        Инициализация сервиса.

        Args:
            session: Асинхронная сессия БД
        """
        self._session = session
        self._template_repo = TemplateRepository(session)
        self._variable_repo = TemplateVariableRepository(session)
        self._minio = MinioService()

    # =========================================================================
    # Template CRUD
    # =========================================================================

    async def get_template(self, template_id: int) -> DocumentTemplate:
        """
        Получить шаблон по ID.

        Args:
            template_id: ID шаблона

        Returns:
            Экземпляр шаблона

        Raises:
            NotFoundError: Если шаблон не найден
        """
        template = await self._template_repo.get_by_id(template_id)
        if template is None:
            raise NotFoundError(f"Шаблон с ID {template_id} не найден")
        return template

    async def get_template_by_code(self, code: str) -> DocumentTemplate:
        """
        Получить шаблон по коду.

        Args:
            code: Код шаблона

        Returns:
            Экземпляр шаблона

        Raises:
            NotFoundError: Если шаблон не найден
        """
        template = await self._template_repo.get_by_code(code)
        if template is None:
            raise NotFoundError(f"Шаблон с кодом '{code}' не найден")
        return template

    async def get_templates(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        theater_id: int | None = None,
        template_type: TemplateType | None = None,
        is_active: bool | None = None,
    ) -> tuple[list[DocumentTemplate], int]:
        """
        Получить список шаблонов с фильтрацией.

        Args:
            skip: Пропустить записей
            limit: Максимум записей
            theater_id: Фильтр по театру
            template_type: Фильтр по типу
            is_active: Фильтр по активности

        Returns:
            Кортеж (список шаблонов, общее количество)
        """
        templates = await self._template_repo.get_all(
            skip=skip,
            limit=limit,
            theater_id=theater_id,
            template_type=template_type,
            is_active=is_active,
        )

        total = await self._template_repo.count(
            theater_id=theater_id,
            template_type=template_type,
            is_active=is_active,
        )

        return templates, total

    async def create_template(
        self,
        data: TemplateCreate,
        file: UploadFile,
        theater_id: int | None = None,
        user_id: int | None = None,
    ) -> DocumentTemplate:
        """
        Создать новый шаблон.

        Args:
            data: Данные для создания
            file: Файл шаблона (DOCX)
            theater_id: ID театра
            user_id: ID пользователя-создателя

        Returns:
            Созданный шаблон

        Raises:
            AlreadyExistsError: Если код уже существует
            ValidationError: Если файл невалидный
        """
        # Проверка уникальности кода
        if await self._template_repo.code_exists(data.code):
            raise AlreadyExistsError(f"Шаблон с кодом '{data.code}' уже существует")

        # Валидация файла
        await self._validate_template_file(file)

        # Загрузка файла в MinIO
        file_path = await self._upload_template_file(file, data.code)

        # Создание шаблона
        template_data = {
            "name": data.name,
            "code": data.code,
            "description": data.description,
            "file_path": file_path,
            "file_name": file.filename,
            "template_type": data.template_type,
            "default_output_format": data.default_output_format,
            "settings": data.settings,
            "theater_id": theater_id,
            "created_by_id": user_id,
            "updated_by_id": user_id,
        }

        template = await self._template_repo.create(template_data)

        # Создание переменных, если переданы
        if data.variables:
            variables_data = [v.model_dump() for v in data.variables]
            await self._variable_repo.bulk_create(template.id, variables_data)

            # Перезагрузка шаблона с переменными
            template = await self._template_repo.get_by_id(template.id)

        await self._session.commit()
        return template

    async def update_template(
        self,
        template_id: int,
        data: TemplateUpdate,
        user_id: int | None = None,
    ) -> DocumentTemplate:
        """
        Обновить шаблон.

        Args:
            template_id: ID шаблона
            data: Данные для обновления
            user_id: ID пользователя

        Returns:
            Обновлённый шаблон

        Raises:
            NotFoundError: Если шаблон не найден
        """
        template = await self.get_template(template_id)

        update_data = data.model_dump(exclude_unset=True)
        if user_id:
            update_data["updated_by_id"] = user_id

        template = await self._template_repo.update(template, update_data)
        await self._session.commit()
        return template

    async def update_template_file(
        self,
        template_id: int,
        file: UploadFile,
        user_id: int | None = None,
    ) -> DocumentTemplate:
        """
        Обновить файл шаблона.

        Args:
            template_id: ID шаблона
            file: Новый файл шаблона
            user_id: ID пользователя

        Returns:
            Обновлённый шаблон
        """
        template = await self.get_template(template_id)

        # Валидация файла
        await self._validate_template_file(file)

        # Удаление старого файла
        try:
            await self._minio.delete_file(template.file_path)
        except Exception:
            pass  # Игнорируем ошибки удаления

        # Загрузка нового файла
        file_path = await self._upload_template_file(file, template.code)

        update_data = {
            "file_path": file_path,
            "file_name": file.filename,
        }
        if user_id:
            update_data["updated_by_id"] = user_id

        template = await self._template_repo.update(template, update_data)
        await self._session.commit()
        return template

    async def delete_template(self, template_id: int) -> None:
        """
        Удалить шаблон.

        Args:
            template_id: ID шаблона

        Raises:
            NotFoundError: Если шаблон не найден
            ValidationError: Если шаблон системный
        """
        template = await self.get_template(template_id)

        if template.is_system:
            raise ValidationError("Нельзя удалить системный шаблон")

        # Удаление файла из MinIO
        try:
            await self._minio.delete_file(template.file_path)
        except Exception:
            pass

        await self._template_repo.delete(template)
        await self._session.commit()

    # =========================================================================
    # Variable CRUD
    # =========================================================================

    async def get_variable(self, variable_id: int) -> DocumentTemplateVariable:
        """Получить переменную по ID."""
        variable = await self._variable_repo.get_by_id(variable_id)
        if variable is None:
            raise NotFoundError(f"Переменная с ID {variable_id} не найдена")
        return variable

    async def get_template_variables(
        self,
        template_id: int,
    ) -> list[DocumentTemplateVariable]:
        """Получить все переменные шаблона."""
        # Проверка существования шаблона
        await self.get_template(template_id)
        return await self._variable_repo.get_by_template_id(template_id)

    async def create_variable(
        self,
        template_id: int,
        data: TemplateVariableCreate,
    ) -> DocumentTemplateVariable:
        """
        Создать переменную шаблона.

        Args:
            template_id: ID шаблона
            data: Данные переменной

        Returns:
            Созданная переменная

        Raises:
            NotFoundError: Если шаблон не найден
            AlreadyExistsError: Если переменная с таким именем уже есть
        """
        # Проверка существования шаблона
        await self.get_template(template_id)

        # Проверка уникальности имени в шаблоне
        existing = await self._variable_repo.get_by_name(template_id, data.name)
        if existing:
            raise AlreadyExistsError(
                f"Переменная '{data.name}' уже существует в шаблоне"
            )

        variable_data = data.model_dump()
        variable_data["template_id"] = template_id

        variable = await self._variable_repo.create(variable_data)
        await self._session.commit()
        return variable

    async def update_variable(
        self,
        variable_id: int,
        data: TemplateVariableUpdate,
    ) -> DocumentTemplateVariable:
        """Обновить переменную."""
        variable = await self.get_variable(variable_id)

        # Проверка уникальности имени, если меняется
        if data.name and data.name != variable.name:
            existing = await self._variable_repo.get_by_name(
                variable.template_id, data.name
            )
            if existing:
                raise AlreadyExistsError(
                    f"Переменная '{data.name}' уже существует в шаблоне"
                )

        update_data = data.model_dump(exclude_unset=True)
        variable = await self._variable_repo.update(variable, update_data)
        await self._session.commit()
        return variable

    async def delete_variable(self, variable_id: int) -> None:
        """Удалить переменную."""
        variable = await self.get_variable(variable_id)
        await self._variable_repo.delete(variable)
        await self._session.commit()

    async def reorder_variables(
        self,
        template_id: int,
        variable_ids: list[int],
    ) -> list[DocumentTemplateVariable]:
        """
        Изменить порядок переменных.

        Args:
            template_id: ID шаблона
            variable_ids: Список ID переменных в новом порядке

        Returns:
            Список переменных в новом порядке
        """
        # Проверка существования шаблона
        await self.get_template(template_id)

        await self._variable_repo.reorder(template_id, variable_ids)
        await self._session.commit()

        return await self._variable_repo.get_by_template_id(template_id)

    # =========================================================================
    # Helper Methods
    # =========================================================================

    async def _validate_template_file(self, file: UploadFile) -> None:
        """Валидация файла шаблона."""
        if not file.filename:
            raise ValidationError("Имя файла не указано")

        # Проверка расширения
        ext = "." + file.filename.rsplit(".", 1)[-1].lower()
        if ext not in ALLOWED_TEMPLATE_EXTENSIONS:
            raise ValidationError(
                f"Недопустимый формат файла. Разрешены: {', '.join(ALLOWED_TEMPLATE_EXTENSIONS)}"
            )

        # Проверка размера (10 MB макс для шаблонов)
        max_size = 10 * 1024 * 1024
        content = await file.read()
        await file.seek(0)

        if len(content) > max_size:
            raise ValidationError("Размер файла превышает 10 MB")

    async def _upload_template_file(
        self,
        file: UploadFile,
        template_code: str,
    ) -> str:
        """
        Загрузить файл шаблона в MinIO.

        Args:
            file: Файл для загрузки
            template_code: Код шаблона

        Returns:
            Путь к файлу в хранилище
        """
        content = await file.read()
        await file.seek(0)

        # Формируем путь: templates/{code}/{filename}
        file_path = f"templates/{template_code.lower()}/{file.filename}"

        await self._minio.upload_file(
            file_path=file_path,
            content=content,
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

        return file_path
