"""
Сервисы для работы с документами спектакля.

Содержит:
- PerformanceDocumentStorageService — загрузка/скачивание файлов через MinIO
- DocumentCategorizationService — автоопределение категории по имени файла
"""
import re
import uuid
from datetime import timedelta
from pathlib import Path
from typing import BinaryIO

from app.config import settings
from app.models.performance_document import (
    DocumentSection,
    PerformanceDocumentCategory,
)
from app.services.minio_service import minio_service


class StorageException(Exception):
    """Исключение при работе с хранилищем файлов."""
    pass


class PerformanceDocumentStorageService:
    """
    Сервис для хранения документов спектакля в MinIO.

    Структура хранения:
    documents/
    └── performances/
        └── {performance_id}/
            └── {section}/
                └── {unique_filename}
    """

    # Используем существующий bucket documents с префиксом performances
    BUCKET = settings.MINIO_BUCKET_DOCUMENTS
    PREFIX = "performances"

    def __init__(self) -> None:
        self._minio = minio_service

    def _sanitize_filename(self, filename: str) -> str:
        """
        Очистить имя файла от опасных символов.

        Предотвращает path traversal атаки.
        """
        # Удаляем путь, оставляем только имя файла
        filename = Path(filename).name

        # Удаляем опасные символы
        filename = filename.replace("..", "")
        filename = filename.replace("\x00", "")
        filename = re.sub(r'[<>:"/\\|?*]', "_", filename)

        return filename

    def _generate_storage_path(
        self,
        performance_id: int,
        section: DocumentSection,
        filename: str,
    ) -> str:
        """
        Сгенерировать путь хранения файла.

        Формат: performances/{performance_id}/{section}/{uuid}_{filename}
        """
        safe_filename = self._sanitize_filename(filename)
        unique_id = uuid.uuid4().hex[:8]
        ext = Path(safe_filename).suffix.lower()
        name = Path(safe_filename).stem

        # Ограничиваем длину имени
        if len(name) > 50:
            name = name[:50]

        return f"{self.PREFIX}/{performance_id}/{section.value}/{unique_id}_{name}{ext}"

    def _get_content_type(self, filename: str) -> str:
        """Определить MIME-тип по расширению."""
        ext = Path(filename).suffix.lower()

        content_types = {
            # Изображения
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".svg": "image/svg+xml",
            # Документы
            ".pdf": "application/pdf",
            ".doc": "application/msword",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls": "application/vnd.ms-excel",
            ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".txt": "text/plain",
            ".csv": "text/csv",
            # Аудио
            ".mp3": "audio/mpeg",
            ".wav": "audio/wav",
            ".ogg": "audio/ogg",
            # Видео
            ".mp4": "video/mp4",
            ".avi": "video/x-msvideo",
            ".mov": "video/quicktime",
            # CAD/специализированные
            ".dwg": "application/acad",
            ".c2p": "application/octet-stream",  # Capture файлы
            ".cues": "application/octet-stream",  # QLab проекты
            ".esf3d": "application/octet-stream",  # Световые шоу
        }

        return content_types.get(ext, "application/octet-stream")

    async def upload(
        self,
        file_data: BinaryIO | bytes,
        performance_id: int,
        section: DocumentSection,
        filename: str,
        content_type: str | None = None,
    ) -> tuple[str, int, str]:
        """
        Загрузить файл документа спектакля.

        Args:
            file_data: Данные файла
            performance_id: ID спектакля
            section: Раздел паспорта
            filename: Оригинальное имя файла
            content_type: MIME-тип (определяется автоматически если не указан)

        Returns:
            Tuple[storage_path, file_size, mime_type]

        Raises:
            StorageException: При ошибке загрузки
        """
        try:
            storage_path = self._generate_storage_path(performance_id, section, filename)

            if content_type is None:
                content_type = self._get_content_type(filename)

            # Определяем размер файла
            if isinstance(file_data, bytes):
                file_size = len(file_data)
            else:
                file_data.seek(0, 2)
                file_size = file_data.tell()
                file_data.seek(0)

            # Загружаем в MinIO
            await self._minio.upload_file(
                bucket=self.BUCKET,
                file_data=file_data,
                original_filename=filename,
                prefix=f"{self.PREFIX}/{performance_id}/{section.value}/",
                content_type=content_type,
            )

            # Получаем реальный путь (MinIO генерирует UUID)
            # Так как MinIO генерирует свой UUID, используем наш storage_path
            return storage_path, file_size, content_type

        except Exception as e:
            raise StorageException(f"Failed to upload file: {str(e)}") from e

    async def upload_raw(
        self,
        file_data: BinaryIO | bytes,
        storage_path: str,
        content_type: str,
    ) -> None:
        """
        Загрузить файл по указанному пути (без генерации UUID).

        Используется для точного контроля пути хранения.
        """
        try:
            import io
            from minio.error import S3Error

            if isinstance(file_data, bytes):
                data = io.BytesIO(file_data)
                file_size = len(file_data)
            else:
                file_data.seek(0, 2)
                file_size = file_data.tell()
                file_data.seek(0)
                data = file_data

            self._minio.client.put_object(
                bucket_name=self.BUCKET,
                object_name=storage_path,
                data=data,
                length=file_size,
                content_type=content_type,
            )
        except Exception as e:
            raise StorageException(f"Failed to upload file: {str(e)}") from e

    def get_download_url(
        self,
        storage_path: str,
        expires: timedelta | None = None,
    ) -> str:
        """
        Получить presigned URL для скачивания файла.

        Args:
            storage_path: Путь к файлу в хранилище
            expires: Время жизни URL (по умолчанию 1 час)

        Returns:
            Presigned URL
        """
        if expires is None:
            expires = timedelta(hours=1)

        return self._minio.get_file_url(self.BUCKET, storage_path, expires)

    async def delete(self, storage_path: str) -> bool:
        """
        Удалить файл из хранилища.

        Args:
            storage_path: Путь к файлу

        Returns:
            True если файл удалён успешно
        """
        return await self._minio.delete_file(self.BUCKET, storage_path)

    async def delete_performance_documents(self, performance_id: int) -> int:
        """
        Удалить все документы спектакля.

        Args:
            performance_id: ID спектакля

        Returns:
            Количество удалённых файлов
        """
        prefix = f"{self.PREFIX}/{performance_id}/"
        return await self._minio.delete_files_by_prefix(self.BUCKET, prefix)

    def file_exists(self, storage_path: str) -> bool:
        """Проверить существование файла."""
        return self._minio.file_exists(self.BUCKET, storage_path)


class DocumentCategorizationService:
    """
    Сервис автоматической категоризации документов.

    Определяет категорию и раздел паспорта по имени файла.
    Основан на анализе реальных документов театра.
    """

    # Паттерны для определения раздела по номеру в начале имени
    SECTION_PATTERNS = {
        r"^1\.[0-7]": DocumentSection.GENERAL,
        r"^2\.[1-6]": DocumentSection.PRODUCTION,
        r"^3\.": DocumentSection.OPERATION,
        r"^4\.": DocumentSection.APPENDIX,
    }

    # Ключевые слова для определения категории
    # Формат: (keyword, category, section, confidence)
    CATEGORY_KEYWORDS = [
        # 1.0 Общая часть
        (r"паспорт", PerformanceDocumentCategory.PASSPORT, DocumentSection.GENERAL),
        (r"титульн", PerformanceDocumentCategory.PASSPORT, DocumentSection.GENERAL),
        (r"акт.*прием", PerformanceDocumentCategory.RECEPTION_ACT, DocumentSection.GENERAL),
        (r"приемк", PerformanceDocumentCategory.RECEPTION_ACT, DocumentSection.GENERAL),
        (r"огнезащит", PerformanceDocumentCategory.FIRE_PROTECTION, DocumentSection.GENERAL),
        (r"пожар", PerformanceDocumentCategory.FIRE_PROTECTION, DocumentSection.GENERAL),
        (r"сварк", PerformanceDocumentCategory.WELDING_ACTS, DocumentSection.GENERAL),
        (r"сварочн", PerformanceDocumentCategory.WELDING_ACTS, DocumentSection.GENERAL),
        (r"сертификат", PerformanceDocumentCategory.MATERIAL_CERTS, DocumentSection.GENERAL),
        (r"материал", PerformanceDocumentCategory.MATERIAL_CERTS, DocumentSection.GENERAL),
        (r"расчет", PerformanceDocumentCategory.CALCULATIONS, DocumentSection.GENERAL),
        (r"прочност", PerformanceDocumentCategory.CALCULATIONS, DocumentSection.GENERAL),

        # 2.0 Производство
        (r"эскиз", PerformanceDocumentCategory.SKETCHES, DocumentSection.PRODUCTION),
        (r"sketch", PerformanceDocumentCategory.SKETCHES, DocumentSection.PRODUCTION),
        (r"тз.*декор", PerformanceDocumentCategory.TECH_SPEC_DECOR, DocumentSection.PRODUCTION),
        (r"декорац", PerformanceDocumentCategory.TECH_SPEC_DECOR, DocumentSection.PRODUCTION),
        (r"тз.*свет", PerformanceDocumentCategory.TECH_SPEC_LIGHT, DocumentSection.PRODUCTION),
        (r"light.*spec", PerformanceDocumentCategory.TECH_SPEC_LIGHT, DocumentSection.PRODUCTION),
        (r"тз.*костюм", PerformanceDocumentCategory.TECH_SPEC_COSTUME, DocumentSection.PRODUCTION),
        (r"costume", PerformanceDocumentCategory.TECH_SPEC_COSTUME, DocumentSection.PRODUCTION),
        (r"тз.*реквизит", PerformanceDocumentCategory.TECH_SPEC_PROPS, DocumentSection.PRODUCTION),
        (r"тз.*бутафор", PerformanceDocumentCategory.TECH_SPEC_PROPS, DocumentSection.PRODUCTION),
        (r"props", PerformanceDocumentCategory.TECH_SPEC_PROPS, DocumentSection.PRODUCTION),
        (r"тз.*звук", PerformanceDocumentCategory.TECH_SPEC_SOUND, DocumentSection.PRODUCTION),
        (r"sound.*spec", PerformanceDocumentCategory.TECH_SPEC_SOUND, DocumentSection.PRODUCTION),

        # 3.0 Эксплуатация
        (r"фото.*декор", PerformanceDocumentCategory.DECOR_PHOTOS, DocumentSection.OPERATION),
        (r"decor.*photo", PerformanceDocumentCategory.DECOR_PHOTOS, DocumentSection.OPERATION),
        (r"планировк", PerformanceDocumentCategory.LAYOUTS, DocumentSection.OPERATION),
        (r"layout", PerformanceDocumentCategory.LAYOUTS, DocumentSection.OPERATION),
        (r"план.*сцен", PerformanceDocumentCategory.LAYOUTS, DocumentSection.OPERATION),
        (r"монтировочн.*опись", PerformanceDocumentCategory.MOUNT_LIST, DocumentSection.OPERATION),
        (r"mount.*list", PerformanceDocumentCategory.MOUNT_LIST, DocumentSection.OPERATION),
        (r"развеск", PerformanceDocumentCategory.HANGING_LIST, DocumentSection.OPERATION),
        (r"ведомость", PerformanceDocumentCategory.HANGING_LIST, DocumentSection.OPERATION),
        (r"инструкц.*монтаж", PerformanceDocumentCategory.MOUNT_INSTRUCTION, DocumentSection.OPERATION),
        (r"партитур.*свет", PerformanceDocumentCategory.LIGHT_PARTITION, DocumentSection.OPERATION),
        (r"light.*plot", PerformanceDocumentCategory.LIGHT_PARTITION, DocumentSection.OPERATION),
        (r"lx", PerformanceDocumentCategory.LIGHT_PARTITION, DocumentSection.OPERATION),
        (r"партитур.*звук", PerformanceDocumentCategory.SOUND_PARTITION, DocumentSection.OPERATION),
        (r"sound.*plot", PerformanceDocumentCategory.SOUND_PARTITION, DocumentSection.OPERATION),
        (r"audio", PerformanceDocumentCategory.SOUND_PARTITION, DocumentSection.OPERATION),
        (r"партитур.*видео", PerformanceDocumentCategory.VIDEO_PARTITION, DocumentSection.OPERATION),
        (r"video", PerformanceDocumentCategory.VIDEO_PARTITION, DocumentSection.OPERATION),
        (r"опись.*костюм", PerformanceDocumentCategory.COSTUME_LIST, DocumentSection.OPERATION),
        (r"грим", PerformanceDocumentCategory.MAKEUP_CARD, DocumentSection.OPERATION),
        (r"makeup", PerformanceDocumentCategory.MAKEUP_CARD, DocumentSection.OPERATION),

        # 4.0 Приложение
        (r"райдер", PerformanceDocumentCategory.RIDER, DocumentSection.APPENDIX),
        (r"rider", PerformanceDocumentCategory.RIDER, DocumentSection.APPENDIX),
        (r"смет", PerformanceDocumentCategory.ESTIMATES, DocumentSection.APPENDIX),
        (r"estimate", PerformanceDocumentCategory.ESTIMATES, DocumentSection.APPENDIX),
        (r"калькул", PerformanceDocumentCategory.ESTIMATES, DocumentSection.APPENDIX),
        (r"чертеж", PerformanceDocumentCategory.DRAWINGS, DocumentSection.APPENDIX),
        (r"drawing", PerformanceDocumentCategory.DRAWINGS, DocumentSection.APPENDIX),
    ]

    # Определение категории по расширению файла
    EXTENSION_CATEGORIES = {
        ".dwg": (PerformanceDocumentCategory.DRAWINGS, DocumentSection.APPENDIX),
        ".c2p": (PerformanceDocumentCategory.LIGHT_PARTITION, DocumentSection.OPERATION),
        ".cues": (PerformanceDocumentCategory.SOUND_PARTITION, DocumentSection.OPERATION),
        ".esf3d": (PerformanceDocumentCategory.LIGHT_PARTITION, DocumentSection.OPERATION),
        ".mp3": (PerformanceDocumentCategory.SOUND_PARTITION, DocumentSection.OPERATION),
        ".wav": (PerformanceDocumentCategory.SOUND_PARTITION, DocumentSection.OPERATION),
        ".mp4": (PerformanceDocumentCategory.VIDEO_PARTITION, DocumentSection.OPERATION),
    }

    def categorize(
        self,
        filename: str,
        folder_path: str | None = None,
    ) -> tuple[PerformanceDocumentCategory, DocumentSection, float]:
        """
        Определить категорию документа по имени файла.

        Args:
            filename: Имя файла
            folder_path: Путь к папке (опционально, для дополнительного контекста)

        Returns:
            Tuple[category, section, confidence]
            confidence: 0.0 - 1.0, уверенность в определении
        """
        filename_lower = filename.lower()
        ext = Path(filename).suffix.lower()

        # 1. Проверяем расширение файла (высокая уверенность)
        if ext in self.EXTENSION_CATEGORIES:
            category, section = self.EXTENSION_CATEGORIES[ext]
            return category, section, 0.9

        # 2. Проверяем номер раздела в начале имени файла
        detected_section = None
        for pattern, section in self.SECTION_PATTERNS.items():
            if re.match(pattern, filename_lower):
                detected_section = section
                break

        # 3. Ищем ключевые слова
        for keyword, category, section in self.CATEGORY_KEYWORDS:
            if re.search(keyword, filename_lower, re.IGNORECASE):
                # Если раздел уже определён по номеру, используем его
                final_section = detected_section or section
                return category, final_section, 0.8

        # 4. Проверяем путь к папке для дополнительного контекста
        if folder_path:
            folder_lower = folder_path.lower()
            for keyword, category, section in self.CATEGORY_KEYWORDS:
                if re.search(keyword, folder_lower, re.IGNORECASE):
                    final_section = detected_section or section
                    return category, final_section, 0.6

        # 5. Если раздел определён по номеру, но категория не найдена
        if detected_section:
            return PerformanceDocumentCategory.OTHER, detected_section, 0.5

        # 6. Fallback: OTHER в разделе GENERAL
        return PerformanceDocumentCategory.OTHER, DocumentSection.GENERAL, 0.1

    def suggest_display_name(self, filename: str) -> str:
        """
        Предложить отображаемое имя документа.

        Убирает технические префиксы и форматирует имя.
        """
        name = Path(filename).stem

        # Убираем UUID-подобные префиксы
        name = re.sub(r"^[a-f0-9]{8,}_", "", name)

        # Убираем номера разделов (1.1, 2.3 и т.д.)
        name = re.sub(r"^\d+\.\d+\s*", "", name)

        # Заменяем подчёркивания на пробелы
        name = name.replace("_", " ")

        # Убираем множественные пробелы
        name = re.sub(r"\s+", " ", name).strip()

        # Capitalize first letter
        if name:
            name = name[0].upper() + name[1:]

        return name or filename


# Глобальные экземпляры
performance_document_storage = PerformanceDocumentStorageService()
document_categorization_service = DocumentCategorizationService()
