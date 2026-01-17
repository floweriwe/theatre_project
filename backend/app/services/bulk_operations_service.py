"""
Сервис массовых операций с инвентарём.

Бизнес-логика для bulk-операций:
- Массовое изменение статуса
- Массовое перемещение
- Массовое удаление (soft delete)
- Массовое назначение тегов
- Массовое изменение категории
"""
from datetime import datetime
from typing import Any

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.models.inventory import (
    InventoryItem,
    InventoryMovement,
    ItemStatus,
    MovementType,
    inventory_item_tags,
)
from app.models.document import Tag
from app.repositories.inventory_repository import (
    InventoryItemRepository,
    InventoryMovementRepository,
)


class BulkOperationResult:
    """Результат bulk-операции."""

    def __init__(self):
        self.success_count: int = 0
        self.failed_count: int = 0
        self.failed_ids: list[int] = []
        self.errors: list[dict[str, Any]] = []

    def add_success(self) -> None:
        self.success_count += 1

    def add_failure(self, item_id: int, error: str) -> None:
        self.failed_count += 1
        self.failed_ids.append(item_id)
        self.errors.append({"item_id": item_id, "error": error})

    def to_dict(self) -> dict[str, Any]:
        return {
            "success_count": self.success_count,
            "failed_count": self.failed_count,
            "failed_ids": self.failed_ids,
            "errors": self.errors,
            "total_processed": self.success_count + self.failed_count,
        }


class BulkOperationsService:
    """
    Сервис массовых операций.

    Позволяет выполнять операции над несколькими
    предметами инвентаря одновременно.
    """

    def __init__(self, session: AsyncSession):
        self._session = session
        self._item_repo = InventoryItemRepository(session)
        self._movement_repo = InventoryMovementRepository(session)

    async def bulk_update_status(
        self,
        item_ids: list[int],
        new_status: ItemStatus,
        user_id: int,
        comment: str | None = None,
        theater_id: int | None = None,
    ) -> BulkOperationResult:
        """
        Массовое изменение статуса предметов.

        Args:
            item_ids: Список ID предметов
            new_status: Новый статус
            user_id: ID пользователя, выполняющего операцию
            comment: Комментарий к операции
            theater_id: ID театра (для проверки доступа)

        Returns:
            BulkOperationResult с результатами операции
        """
        result = BulkOperationResult()

        # Валидация: нельзя массово списывать
        if new_status == ItemStatus.WRITTEN_OFF:
            raise ValidationError(
                "Списание должно выполняться индивидуально для каждого предмета"
            )

        # Определяем тип перемещения
        movement_type_map = {
            ItemStatus.RESERVED: MovementType.RESERVE,
            ItemStatus.IN_STOCK: MovementType.RELEASE,
            ItemStatus.IN_USE: MovementType.ISSUE,
            ItemStatus.REPAIR: MovementType.REPAIR_START,
        }
        movement_type = movement_type_map.get(new_status, MovementType.TRANSFER)

        for item_id in item_ids:
            try:
                item = await self._item_repo.get_by_id(item_id)
                if not item:
                    result.add_failure(item_id, "Предмет не найден")
                    continue

                if theater_id and item.theater_id != theater_id:
                    result.add_failure(item_id, "Нет доступа к предмету")
                    continue

                # Валидация перехода статуса
                if item.status == ItemStatus.WRITTEN_OFF:
                    result.add_failure(item_id, "Списанный предмет нельзя изменять")
                    continue

                old_status = item.status

                # Обновляем статус
                item.status = new_status
                item.updated_at = datetime.utcnow()
                item.updated_by_id = user_id

                # Создаём запись о перемещении
                await self._movement_repo.create_movement(
                    item_id=item_id,
                    movement_type=movement_type,
                    user_id=user_id,
                    comment=comment or f"Массовое изменение статуса: {old_status.value} → {new_status.value}",
                )

                result.add_success()

            except Exception as e:
                result.add_failure(item_id, str(e))

        await self._session.commit()
        return result

    async def bulk_transfer(
        self,
        item_ids: list[int],
        to_location_id: int,
        user_id: int,
        comment: str | None = None,
        theater_id: int | None = None,
    ) -> BulkOperationResult:
        """
        Массовое перемещение предметов в новую локацию.

        Args:
            item_ids: Список ID предметов
            to_location_id: ID целевой локации
            user_id: ID пользователя
            comment: Комментарий
            theater_id: ID театра

        Returns:
            BulkOperationResult
        """
        result = BulkOperationResult()

        for item_id in item_ids:
            try:
                item = await self._item_repo.get_by_id(item_id)
                if not item:
                    result.add_failure(item_id, "Предмет не найден")
                    continue

                if theater_id and item.theater_id != theater_id:
                    result.add_failure(item_id, "Нет доступа к предмету")
                    continue

                if item.status == ItemStatus.WRITTEN_OFF:
                    result.add_failure(item_id, "Списанный предмет нельзя перемещать")
                    continue

                from_location_id = item.location_id

                # Обновляем локацию
                item.location_id = to_location_id
                item.updated_at = datetime.utcnow()
                item.updated_by_id = user_id

                # Создаём запись о перемещении
                await self._movement_repo.create_movement(
                    item_id=item_id,
                    movement_type=MovementType.TRANSFER,
                    user_id=user_id,
                    from_location_id=from_location_id,
                    to_location_id=to_location_id,
                    comment=comment or "Массовое перемещение",
                )

                result.add_success()

            except Exception as e:
                result.add_failure(item_id, str(e))

        await self._session.commit()
        return result

    async def bulk_delete(
        self,
        item_ids: list[int],
        user_id: int,
        hard_delete: bool = False,
        comment: str | None = None,
        theater_id: int | None = None,
    ) -> BulkOperationResult:
        """
        Массовое удаление (soft delete по умолчанию).

        Args:
            item_ids: Список ID предметов
            user_id: ID пользователя
            hard_delete: Полное удаление из БД (опасно!)
            comment: Комментарий
            theater_id: ID театра

        Returns:
            BulkOperationResult
        """
        result = BulkOperationResult()

        for item_id in item_ids:
            try:
                item = await self._item_repo.get_by_id(item_id)
                if not item:
                    result.add_failure(item_id, "Предмет не найден")
                    continue

                if theater_id and item.theater_id != theater_id:
                    result.add_failure(item_id, "Нет доступа к предмету")
                    continue

                if hard_delete:
                    # Полное удаление
                    await self._session.delete(item)
                else:
                    # Soft delete
                    item.is_active = False
                    item.updated_at = datetime.utcnow()
                    item.updated_by_id = user_id

                    # Создаём запись о списании
                    await self._movement_repo.create_movement(
                        item_id=item_id,
                        movement_type=MovementType.WRITE_OFF,
                        user_id=user_id,
                        comment=comment or "Массовое удаление",
                    )

                result.add_success()

            except Exception as e:
                result.add_failure(item_id, str(e))

        await self._session.commit()
        return result

    async def bulk_assign_tags(
        self,
        item_ids: list[int],
        tag_ids: list[int],
        replace: bool = False,
        user_id: int | None = None,
        theater_id: int | None = None,
    ) -> BulkOperationResult:
        """
        Массовое назначение тегов предметам.

        Args:
            item_ids: Список ID предметов
            tag_ids: Список ID тегов для назначения
            replace: Заменить существующие теги (True) или добавить (False)
            user_id: ID пользователя
            theater_id: ID театра

        Returns:
            BulkOperationResult
        """
        result = BulkOperationResult()

        # Проверяем существование тегов
        tags_query = select(Tag).where(Tag.id.in_(tag_ids))
        tags_result = await self._session.execute(tags_query)
        existing_tags = {tag.id for tag in tags_result.scalars().all()}

        invalid_tags = set(tag_ids) - existing_tags
        if invalid_tags:
            raise ValidationError(f"Теги не найдены: {invalid_tags}")

        for item_id in item_ids:
            try:
                item = await self._item_repo.get_by_id(item_id)
                if not item:
                    result.add_failure(item_id, "Предмет не найден")
                    continue

                if theater_id and item.theater_id != theater_id:
                    result.add_failure(item_id, "Нет доступа к предмету")
                    continue

                if replace:
                    # Удаляем существующие теги
                    await self._session.execute(
                        delete(inventory_item_tags).where(
                            inventory_item_tags.c.item_id == item_id
                        )
                    )

                # Получаем текущие теги для предмета
                current_tags_query = select(inventory_item_tags.c.tag_id).where(
                    inventory_item_tags.c.item_id == item_id
                )
                current_result = await self._session.execute(current_tags_query)
                current_tag_ids = {row[0] for row in current_result.fetchall()}

                # Добавляем новые теги
                new_tag_ids = set(tag_ids) - current_tag_ids
                for tag_id in new_tag_ids:
                    await self._session.execute(
                        inventory_item_tags.insert().values(
                            item_id=item_id,
                            tag_id=tag_id,
                        )
                    )

                # Обновляем timestamp предмета
                item.updated_at = datetime.utcnow()
                if user_id:
                    item.updated_by_id = user_id

                result.add_success()

            except Exception as e:
                result.add_failure(item_id, str(e))

        await self._session.commit()
        return result

    async def bulk_remove_tags(
        self,
        item_ids: list[int],
        tag_ids: list[int],
        user_id: int | None = None,
        theater_id: int | None = None,
    ) -> BulkOperationResult:
        """
        Массовое удаление тегов с предметов.

        Args:
            item_ids: Список ID предметов
            tag_ids: Список ID тегов для удаления
            user_id: ID пользователя
            theater_id: ID театра

        Returns:
            BulkOperationResult
        """
        result = BulkOperationResult()

        for item_id in item_ids:
            try:
                item = await self._item_repo.get_by_id(item_id)
                if not item:
                    result.add_failure(item_id, "Предмет не найден")
                    continue

                if theater_id and item.theater_id != theater_id:
                    result.add_failure(item_id, "Нет доступа к предмету")
                    continue

                # Удаляем указанные теги
                await self._session.execute(
                    delete(inventory_item_tags).where(
                        inventory_item_tags.c.item_id == item_id,
                        inventory_item_tags.c.tag_id.in_(tag_ids),
                    )
                )

                # Обновляем timestamp
                item.updated_at = datetime.utcnow()
                if user_id:
                    item.updated_by_id = user_id

                result.add_success()

            except Exception as e:
                result.add_failure(item_id, str(e))

        await self._session.commit()
        return result

    async def bulk_update_category(
        self,
        item_ids: list[int],
        category_id: int | None,
        user_id: int,
        theater_id: int | None = None,
    ) -> BulkOperationResult:
        """
        Массовое изменение категории предметов.

        Args:
            item_ids: Список ID предметов
            category_id: ID новой категории (None для удаления категории)
            user_id: ID пользователя
            theater_id: ID театра

        Returns:
            BulkOperationResult
        """
        result = BulkOperationResult()

        for item_id in item_ids:
            try:
                item = await self._item_repo.get_by_id(item_id)
                if not item:
                    result.add_failure(item_id, "Предмет не найден")
                    continue

                if theater_id and item.theater_id != theater_id:
                    result.add_failure(item_id, "Нет доступа к предмету")
                    continue

                # Обновляем категорию
                item.category_id = category_id
                item.updated_at = datetime.utcnow()
                item.updated_by_id = user_id

                result.add_success()

            except Exception as e:
                result.add_failure(item_id, str(e))

        await self._session.commit()
        return result
