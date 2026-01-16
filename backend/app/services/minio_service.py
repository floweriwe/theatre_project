"""
Сервис для работы с MinIO (S3-совместимое хранилище).

Предоставляет методы для:
- Загрузки файлов (upload)
- Получения URL файлов (get_file_url)
- Удаления файлов (delete)
- Автоматического создания бакетов
"""
import io
import uuid
from datetime import timedelta
from pathlib import Path
from typing import BinaryIO

from minio import Minio
from minio.error import S3Error

from app.config import settings


class MinioService:
    """
    Сервис для работы с MinIO.

    Инкапсулирует операции с S3-совместимым хранилищем.
    """

    # Поддерживаемые MIME-типы для изображений
    IMAGE_CONTENT_TYPES = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }

    # Поддерживаемые MIME-типы для документов
    DOCUMENT_CONTENT_TYPES = {
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xls": "application/vnd.ms-excel",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".txt": "text/plain",
    }

    def __init__(self) -> None:
        """Инициализировать клиент MinIO."""
        self._client: Minio | None = None
        self._initialized = False

    def _get_client(self) -> Minio:
        """Получить или создать клиент MinIO (ленивая инициализация)."""
        if self._client is None:
            self._client = Minio(
                endpoint=settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE,
            )
        return self._client

    @property
    def client(self) -> Minio:
        """Получить клиент MinIO."""
        return self._get_client()

    async def init_buckets(self) -> None:
        """
        Создать необходимые бакеты при запуске приложения.

        Создаёт бакеты если они не существуют:
        - inventory-images — для фото инвентаря
        - documents — для документов
        """
        if self._initialized:
            return

        buckets = [
            settings.MINIO_BUCKET_INVENTORY,
            settings.MINIO_BUCKET_DOCUMENTS,
        ]

        for bucket_name in buckets:
            try:
                if not self.client.bucket_exists(bucket_name):
                    self.client.make_bucket(bucket_name)
                    # Настраиваем публичный доступ на чтение
                    policy = self._get_public_read_policy(bucket_name)
                    self.client.set_bucket_policy(bucket_name, policy)
            except S3Error as e:
                # Логируем ошибку, но не падаем — бакет мог быть создан другим процессом
                if e.code != "BucketAlreadyOwnedByYou":
                    raise

        self._initialized = True

    def _get_public_read_policy(self, bucket_name: str) -> str:
        """Получить политику публичного чтения для бакета."""
        return f'''{{
            "Version": "2012-10-17",
            "Statement": [
                {{
                    "Effect": "Allow",
                    "Principal": {{"AWS": ["*"]}},
                    "Action": ["s3:GetObject"],
                    "Resource": ["arn:aws:s3:::{bucket_name}/*"]
                }}
            ]
        }}'''

    def _generate_object_name(self, original_filename: str, prefix: str = "") -> str:
        """
        Сгенерировать уникальное имя объекта.

        Args:
            original_filename: Оригинальное имя файла
            prefix: Префикс пути (например, "items/123/")

        Returns:
            Уникальное имя объекта
        """
        ext = Path(original_filename).suffix.lower()
        unique_id = uuid.uuid4().hex[:12]
        return f"{prefix}{unique_id}{ext}"

    def _get_content_type(self, filename: str) -> str:
        """
        Определить MIME-тип по расширению файла.

        Args:
            filename: Имя файла

        Returns:
            MIME-тип
        """
        ext = Path(filename).suffix.lower()

        if ext in self.IMAGE_CONTENT_TYPES:
            return self.IMAGE_CONTENT_TYPES[ext]
        if ext in self.DOCUMENT_CONTENT_TYPES:
            return self.DOCUMENT_CONTENT_TYPES[ext]

        return "application/octet-stream"

    # =========================================================================
    # Upload Operations
    # =========================================================================

    async def upload_file(
        self,
        bucket: str,
        file_data: BinaryIO | bytes,
        original_filename: str,
        prefix: str = "",
        content_type: str | None = None,
    ) -> str:
        """
        Загрузить файл в MinIO.

        Args:
            bucket: Имя бакета
            file_data: Данные файла (file-like object или bytes)
            original_filename: Оригинальное имя файла
            prefix: Префикс пути (например, "items/123/")
            content_type: MIME-тип (если не указан — определяется автоматически)

        Returns:
            Путь к файлу в бакете (object_name)
        """
        object_name = self._generate_object_name(original_filename, prefix)

        if content_type is None:
            content_type = self._get_content_type(original_filename)

        # Если передали bytes, обернём в BytesIO
        if isinstance(file_data, bytes):
            file_data = io.BytesIO(file_data)
            file_data.seek(0, 2)  # Перейти в конец
            file_size = file_data.tell()
            file_data.seek(0)  # Вернуться в начало
        else:
            # Для file-like объекта определяем размер
            file_data.seek(0, 2)
            file_size = file_data.tell()
            file_data.seek(0)

        self.client.put_object(
            bucket_name=bucket,
            object_name=object_name,
            data=file_data,
            length=file_size,
            content_type=content_type,
        )

        return object_name

    async def upload_inventory_image(
        self,
        file_data: BinaryIO | bytes,
        original_filename: str,
        item_id: int,
    ) -> str:
        """
        Загрузить фото инвентаря.

        Args:
            file_data: Данные файла
            original_filename: Оригинальное имя файла
            item_id: ID предмета инвентаря

        Returns:
            Путь к файлу
        """
        return await self.upload_file(
            bucket=settings.MINIO_BUCKET_INVENTORY,
            file_data=file_data,
            original_filename=original_filename,
            prefix=f"items/{item_id}/",
        )

    async def upload_document(
        self,
        file_data: BinaryIO | bytes,
        original_filename: str,
        department_id: int | None = None,
    ) -> str:
        """
        Загрузить документ.

        Args:
            file_data: Данные файла
            original_filename: Оригинальное имя файла
            department_id: ID цеха (опционально)

        Returns:
            Путь к файлу
        """
        prefix = f"departments/{department_id}/" if department_id else "general/"
        return await self.upload_file(
            bucket=settings.MINIO_BUCKET_DOCUMENTS,
            file_data=file_data,
            original_filename=original_filename,
            prefix=prefix,
        )

    # =========================================================================
    # URL Operations
    # =========================================================================

    def get_file_url(
        self,
        bucket: str,
        object_name: str,
        expires: timedelta | None = None,
    ) -> str:
        """
        Получить URL для доступа к файлу.

        Args:
            bucket: Имя бакета
            object_name: Имя объекта
            expires: Время жизни URL (по умолчанию 1 час)

        Returns:
            Presigned URL
        """
        if expires is None:
            expires = timedelta(hours=1)

        return self.client.presigned_get_object(
            bucket_name=bucket,
            object_name=object_name,
            expires=expires,
        )

    def get_public_url(self, bucket: str, object_name: str) -> str:
        """
        Получить публичный URL файла (без подписи).

        Работает только для бакетов с публичной политикой чтения.

        Args:
            bucket: Имя бакета
            object_name: Имя объекта

        Returns:
            Публичный URL
        """
        protocol = "https" if settings.MINIO_SECURE else "http"
        return f"{protocol}://{settings.MINIO_ENDPOINT}/{bucket}/{object_name}"

    def get_inventory_image_url(self, object_name: str) -> str:
        """
        Получить URL фото инвентаря.

        Args:
            object_name: Имя объекта

        Returns:
            URL
        """
        return self.get_public_url(settings.MINIO_BUCKET_INVENTORY, object_name)

    def get_document_url(self, object_name: str, expires: timedelta | None = None) -> str:
        """
        Получить URL документа.

        Args:
            object_name: Имя объекта
            expires: Время жизни URL

        Returns:
            Presigned URL
        """
        return self.get_file_url(settings.MINIO_BUCKET_DOCUMENTS, object_name, expires)

    # =========================================================================
    # Delete Operations
    # =========================================================================

    async def delete_file(self, bucket: str, object_name: str) -> bool:
        """
        Удалить файл из MinIO.

        Args:
            bucket: Имя бакета
            object_name: Имя объекта

        Returns:
            True если успешно удалён
        """
        try:
            self.client.remove_object(bucket_name=bucket, object_name=object_name)
            return True
        except S3Error:
            return False

    async def delete_inventory_image(self, object_name: str) -> bool:
        """
        Удалить фото инвентаря.

        Args:
            object_name: Имя объекта

        Returns:
            True если успешно
        """
        return await self.delete_file(settings.MINIO_BUCKET_INVENTORY, object_name)

    async def delete_document(self, object_name: str) -> bool:
        """
        Удалить документ.

        Args:
            object_name: Имя объекта

        Returns:
            True если успешно
        """
        return await self.delete_file(settings.MINIO_BUCKET_DOCUMENTS, object_name)

    async def delete_files_by_prefix(self, bucket: str, prefix: str) -> int:
        """
        Удалить все файлы с заданным префиксом.

        Полезно для удаления всех фото предмета.

        Args:
            bucket: Имя бакета
            prefix: Префикс пути (например, "items/123/")

        Returns:
            Количество удалённых файлов
        """
        objects = self.client.list_objects(bucket, prefix=prefix, recursive=True)
        deleted_count = 0

        for obj in objects:
            try:
                self.client.remove_object(bucket, obj.object_name)
                deleted_count += 1
            except S3Error:
                pass

        return deleted_count

    # =========================================================================
    # Utility Operations
    # =========================================================================

    def file_exists(self, bucket: str, object_name: str) -> bool:
        """
        Проверить существование файла.

        Args:
            bucket: Имя бакета
            object_name: Имя объекта

        Returns:
            True если файл существует
        """
        try:
            self.client.stat_object(bucket, object_name)
            return True
        except S3Error:
            return False

    def list_files(self, bucket: str, prefix: str = "") -> list[str]:
        """
        Получить список файлов в бакете.

        Args:
            bucket: Имя бакета
            prefix: Префикс для фильтрации

        Returns:
            Список имён объектов
        """
        objects = self.client.list_objects(bucket, prefix=prefix, recursive=True)
        return [obj.object_name for obj in objects]


# Глобальный экземпляр
minio_service = MinioService()
