"""
Сервис Performance Hub.

Объединяет функционал для центра управления спектаклем:
- Структура и конфигурация спектакля
- Связь с инвентарём
- Чеклисты
- Каст и персонал
- Версионирование (снапшоты)
"""
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Performance,
    PerformanceSection,
    PerformanceInventory,
    InventoryItem,
    ChecklistTemplate,
    ChecklistInstance,
    PerformanceCast,
    User,
    ChecklistType,
    ChecklistStatus,
    CastRoleType,
)
from app.schemas.performance import (
    PerformanceInventoryLinkCreate,
    PerformanceInventoryLinkUpdate,
    PerformanceInventoryLinkResponse,
    PerformanceSnapshotResponse,
    PerformanceStructureResponse,
)
from app.schemas.checklist_hub import (
    ChecklistTemplateCreate,
    ChecklistTemplateUpdate,
    ChecklistTemplateResponse,
    ChecklistInstanceCreate,
    ChecklistInstanceResponse,
    ChecklistItemUpdate,
)
from app.schemas.performance_cast import (
    PerformanceCastCreate,
    PerformanceCastUpdate,
    PerformanceCastResponse,
    PerformanceCastGroupedResponse,
)


class PerformanceHubService:
    """Сервис для работы с Performance Hub."""

    def __init__(self, session: AsyncSession):
        self.session = session

    # =========================================================================
    # Performance Structure
    # =========================================================================

    async def get_performance_structure(
        self, performance_id: int
    ) -> dict[str, Any]:
        """Получить полную структуру спектакля."""
        query = (
            select(Performance)
            .options(
                selectinload(Performance.sections),
                selectinload(Performance.inventory_items).selectinload(
                    PerformanceInventory.item
                ),
                selectinload(Performance.inventory_items).selectinload(
                    PerformanceInventory.scene
                ),
                selectinload(Performance.cast_crew).selectinload(
                    PerformanceCast.user
                ),
                selectinload(Performance.checklist_instances).selectinload(
                    ChecklistInstance.template
                ),
            )
            .where(Performance.id == performance_id)
        )
        result = await self.session.execute(query)
        performance = result.scalar_one_or_none()

        if not performance:
            return None

        # Собираем структуру
        structure = {
            "id": performance.id,
            "title": performance.title,
            "subtitle": performance.subtitle,
            "status": performance.status.value,
            "configuration_version": performance.configuration_version,
            "is_template": performance.is_template,
            "sections": [
                {
                    "id": s.id,
                    "section_type": s.section_type.value,
                    "title": s.title,
                    "content": s.content,
                    "sort_order": s.sort_order,
                }
                for s in sorted(performance.sections, key=lambda x: x.sort_order)
            ],
            "inventory_items": [
                {
                    "id": str(inv.id),
                    "performance_id": inv.performance_id,
                    "item_id": inv.item_id,
                    "scene_id": inv.scene_id,
                    "quantity": inv.quantity,
                    "notes": inv.notes,
                    "created_at": inv.created_at.isoformat() if inv.created_at else None,
                    "updated_at": inv.updated_at.isoformat() if inv.updated_at else None,
                    "item_name": inv.item.name if inv.item else None,
                    "item_inventory_number": inv.item.inventory_number if inv.item else None,
                    "item_category": inv.item.category.name if inv.item and inv.item.category else None,
                    "scene_title": inv.scene.title if inv.scene else None,
                }
                for inv in performance.inventory_items
            ],
            "cast_crew": [
                {
                    "id": str(cc.id),
                    "user_id": cc.user_id,
                    "role_type": cc.role_type.value,
                    "character_name": cc.character_name,
                    "functional_role": cc.functional_role,
                    "is_understudy": cc.is_understudy,
                    "user_full_name": cc.user.full_name if cc.user else None,
                }
                for cc in performance.cast_crew
            ],
            "checklist_instances": [
                {
                    "id": str(ci.id),
                    "name": ci.name,
                    "status": ci.status.value,
                    "completion_percentage": ci.completion_percentage,
                    "template_name": ci.template.name if ci.template else None,
                    "template_type": ci.template.type.value if ci.template else None,
                }
                for ci in performance.checklist_instances
            ],
        }

        return structure

    async def create_snapshot(
        self, performance_id: int, description: str | None = None
    ) -> PerformanceSnapshotResponse:
        """Создать снапшот (новую версию) конфигурации спектакля."""
        query = select(Performance).where(Performance.id == performance_id)
        result = await self.session.execute(query)
        performance = result.scalar_one_or_none()

        if not performance:
            raise ValueError(f"Performance {performance_id} not found")

        # Увеличиваем версию
        performance.configuration_version += 1
        await self.session.commit()
        await self.session.refresh(performance)

        return PerformanceSnapshotResponse(
            performance_id=performance.id,
            version=performance.configuration_version,
            created_at=datetime.utcnow(),
            description=description,
        )

    # =========================================================================
    # Inventory Links
    # =========================================================================

    async def add_inventory_link(
        self, performance_id: int, data: PerformanceInventoryLinkCreate
    ) -> PerformanceInventoryLinkResponse:
        """Добавить связь инвентаря со спектаклем."""
        link = PerformanceInventory(
            performance_id=performance_id,
            item_id=data.item_id,
            scene_id=data.scene_id,
            quantity=data.quantity,
            notes=data.notes,
        )
        self.session.add(link)
        await self.session.commit()
        await self.session.refresh(link)

        # Загружаем связанные данные
        query = (
            select(PerformanceInventory)
            .options(
                selectinload(PerformanceInventory.item),
                selectinload(PerformanceInventory.scene),
            )
            .where(PerformanceInventory.id == link.id)
        )
        result = await self.session.execute(query)
        link = result.scalar_one()

        return self._map_inventory_link(link)

    async def update_inventory_link(
        self,
        performance_id: int,
        link_id: uuid.UUID,
        data: PerformanceInventoryLinkUpdate,
    ) -> PerformanceInventoryLinkResponse:
        """Обновить связь инвентаря."""
        query = (
            select(PerformanceInventory)
            .options(
                selectinload(PerformanceInventory.item),
                selectinload(PerformanceInventory.scene),
            )
            .where(
                and_(
                    PerformanceInventory.id == link_id,
                    PerformanceInventory.performance_id == performance_id,
                )
            )
        )
        result = await self.session.execute(query)
        link = result.scalar_one_or_none()

        if not link:
            raise ValueError(f"Inventory link {link_id} not found")

        if data.quantity is not None:
            link.quantity = data.quantity
        if data.notes is not None:
            link.notes = data.notes
        if data.scene_id is not None:
            link.scene_id = data.scene_id

        await self.session.commit()
        await self.session.refresh(link)

        return self._map_inventory_link(link)

    async def remove_inventory_link(
        self, performance_id: int, link_id: uuid.UUID
    ) -> bool:
        """Удалить связь инвентаря."""
        query = select(PerformanceInventory).where(
            and_(
                PerformanceInventory.id == link_id,
                PerformanceInventory.performance_id == performance_id,
            )
        )
        result = await self.session.execute(query)
        link = result.scalar_one_or_none()

        if not link:
            return False

        await self.session.delete(link)
        await self.session.commit()
        return True

    def _map_inventory_link(
        self, link: PerformanceInventory
    ) -> PerformanceInventoryLinkResponse:
        """Преобразовать модель в схему ответа."""
        return PerformanceInventoryLinkResponse(
            id=link.id,
            performance_id=link.performance_id,
            item_id=link.item_id,
            scene_id=link.scene_id,
            quantity=link.quantity,
            notes=link.notes,
            created_at=link.created_at,
            updated_at=link.updated_at,
            item_name=link.item.name if link.item else None,
            item_inventory_number=link.item.inventory_number if link.item else None,
            item_category=link.item.category.name if link.item and link.item.category else None,
            item_photo_url=None,  # TODO: добавить фото
            scene_title=link.scene.title if link.scene else None,
        )

    # =========================================================================
    # Checklist Templates
    # =========================================================================

    async def get_checklist_templates(
        self, theater_id: int | None = None
    ) -> list[ChecklistTemplateResponse]:
        """Получить список шаблонов чеклистов."""
        query = select(ChecklistTemplate).where(ChecklistTemplate.is_active == True)
        if theater_id:
            query = query.where(
                (ChecklistTemplate.theater_id == theater_id)
                | (ChecklistTemplate.theater_id.is_(None))
            )
        result = await self.session.execute(query)
        templates = result.scalars().all()

        return [
            ChecklistTemplateResponse(
                id=t.id,
                name=t.name,
                description=t.description,
                type=t.type,
                items=t.items or [],
                is_active=t.is_active,
                theater_id=t.theater_id,
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
            for t in templates
        ]

    async def create_checklist_template(
        self, data: ChecklistTemplateCreate, theater_id: int | None = None
    ) -> ChecklistTemplateResponse:
        """Создать шаблон чеклиста."""
        template = ChecklistTemplate(
            name=data.name,
            description=data.description,
            type=data.type,
            items=[item.model_dump() for item in data.items],
            theater_id=theater_id,
        )
        self.session.add(template)
        await self.session.commit()
        await self.session.refresh(template)

        return ChecklistTemplateResponse(
            id=template.id,
            name=template.name,
            description=template.description,
            type=template.type,
            items=template.items or [],
            is_active=template.is_active,
            theater_id=template.theater_id,
            created_at=template.created_at,
            updated_at=template.updated_at,
        )

    # =========================================================================
    # Checklist Instances
    # =========================================================================

    async def create_checklist_instance(
        self, performance_id: int, data: ChecklistInstanceCreate
    ) -> ChecklistInstanceResponse:
        """Создать экземпляр чеклиста для спектакля."""
        template = None
        items = []

        if data.template_id:
            query = select(ChecklistTemplate).where(
                ChecklistTemplate.id == data.template_id
            )
            result = await self.session.execute(query)
            template = result.scalar_one_or_none()
            if template:
                items = [
                    {"index": i, "is_checked": False}
                    for i in range(len(template.items))
                ]

        name = data.name or (template.name if template else "Custom Checklist")

        instance = ChecklistInstance(
            performance_id=performance_id,
            template_id=data.template_id,
            name=name,
            status=ChecklistStatus.PENDING,
            completion_data={"items": items},
        )
        self.session.add(instance)
        await self.session.commit()
        await self.session.refresh(instance)

        return self._map_checklist_instance(instance, template)

    async def update_checklist_item(
        self,
        instance_id: uuid.UUID,
        item_index: int,
        data: ChecklistItemUpdate,
        user_id: int,
    ) -> ChecklistInstanceResponse:
        """Обновить статус элемента чеклиста."""
        query = (
            select(ChecklistInstance)
            .options(selectinload(ChecklistInstance.template))
            .where(ChecklistInstance.id == instance_id)
        )
        result = await self.session.execute(query)
        instance = result.scalar_one_or_none()

        if not instance:
            raise ValueError(f"Checklist instance {instance_id} not found")

        # Обновляем данные элемента
        items = instance.completion_data.get("items", [])
        for item in items:
            if item.get("index") == item_index:
                item["is_checked"] = data.is_checked
                item["comment"] = data.comment
                item["photo_url"] = data.photo_url
                item["checked_by_id"] = user_id if data.is_checked else None
                item["checked_at"] = (
                    datetime.utcnow().isoformat() if data.is_checked else None
                )
                break

        # Обновляем статус
        completed = sum(1 for i in items if i.get("is_checked", False))
        total = len(items)

        if completed == 0:
            instance.status = ChecklistStatus.PENDING
        elif completed == total:
            instance.status = ChecklistStatus.COMPLETED
        else:
            instance.status = ChecklistStatus.IN_PROGRESS

        instance.completion_data = {"items": items}
        await self.session.commit()
        await self.session.refresh(instance)

        return self._map_checklist_instance(instance, instance.template)

    def _map_checklist_instance(
        self, instance: ChecklistInstance, template: ChecklistTemplate | None
    ) -> ChecklistInstanceResponse:
        """Преобразовать модель в схему ответа."""
        return ChecklistInstanceResponse(
            id=instance.id,
            performance_id=instance.performance_id,
            template_id=instance.template_id,
            name=instance.name,
            status=instance.status,
            completion_data=instance.completion_data,
            created_at=instance.created_at,
            updated_at=instance.updated_at,
            total_items=instance.total_items,
            completed_items=instance.completed_items,
            completion_percentage=instance.completion_percentage,
            template_name=template.name if template else None,
            template_type=template.type if template else None,
        )

    # =========================================================================
    # Cast & Crew
    # =========================================================================

    async def get_cast_crew(
        self, performance_id: int
    ) -> PerformanceCastGroupedResponse:
        """Получить каст и персонал спектакля."""
        query = (
            select(PerformanceCast)
            .options(selectinload(PerformanceCast.user))
            .where(PerformanceCast.performance_id == performance_id)
        )
        result = await self.session.execute(query)
        members = result.scalars().all()

        cast = []
        crew = []

        for m in members:
            item = {
                "id": m.id,
                "user_id": m.user_id,
                "user_full_name": m.user.full_name if m.user else None,
                "role_type": m.role_type,
                "character_name": m.character_name,
                "functional_role": m.functional_role,
                "is_understudy": m.is_understudy,
            }
            if m.role_type == CastRoleType.CAST:
                cast.append(item)
            else:
                crew.append(item)

        return PerformanceCastGroupedResponse(
            performance_id=performance_id,
            cast=cast,
            crew=crew,
            total_cast=len(cast),
            total_crew=len(crew),
        )

    async def add_cast_member(
        self, performance_id: int, data: PerformanceCastCreate
    ) -> PerformanceCastResponse:
        """Добавить участника к спектаклю."""
        member = PerformanceCast(
            performance_id=performance_id,
            user_id=data.user_id,
            role_type=data.role_type,
            character_name=data.character_name,
            functional_role=data.functional_role,
            is_understudy=data.is_understudy,
            notes=data.notes,
        )
        self.session.add(member)
        await self.session.commit()
        await self.session.refresh(member)

        # Загружаем пользователя
        query = (
            select(PerformanceCast)
            .options(selectinload(PerformanceCast.user))
            .where(PerformanceCast.id == member.id)
        )
        result = await self.session.execute(query)
        member = result.scalar_one()

        return self._map_cast_member(member)

    async def update_cast_member(
        self,
        performance_id: int,
        member_id: uuid.UUID,
        data: PerformanceCastUpdate,
    ) -> PerformanceCastResponse:
        """Обновить информацию об участнике."""
        query = (
            select(PerformanceCast)
            .options(selectinload(PerformanceCast.user))
            .where(
                and_(
                    PerformanceCast.id == member_id,
                    PerformanceCast.performance_id == performance_id,
                )
            )
        )
        result = await self.session.execute(query)
        member = result.scalar_one_or_none()

        if not member:
            raise ValueError(f"Cast member {member_id} not found")

        if data.character_name is not None:
            member.character_name = data.character_name
        if data.functional_role is not None:
            member.functional_role = data.functional_role
        if data.is_understudy is not None:
            member.is_understudy = data.is_understudy
        if data.notes is not None:
            member.notes = data.notes

        await self.session.commit()
        await self.session.refresh(member)

        return self._map_cast_member(member)

    async def remove_cast_member(
        self, performance_id: int, member_id: uuid.UUID
    ) -> bool:
        """Удалить участника из спектакля."""
        query = select(PerformanceCast).where(
            and_(
                PerformanceCast.id == member_id,
                PerformanceCast.performance_id == performance_id,
            )
        )
        result = await self.session.execute(query)
        member = result.scalar_one_or_none()

        if not member:
            return False

        await self.session.delete(member)
        await self.session.commit()
        return True

    def _map_cast_member(self, member: PerformanceCast) -> PerformanceCastResponse:
        """Преобразовать модель в схему ответа."""
        return PerformanceCastResponse(
            id=member.id,
            performance_id=member.performance_id,
            user_id=member.user_id,
            role_type=member.role_type,
            character_name=member.character_name,
            functional_role=member.functional_role,
            is_understudy=member.is_understudy,
            notes=member.notes,
            created_at=member.created_at,
            updated_at=member.updated_at,
            user_full_name=member.user.full_name if member.user else None,
            user_email=member.user.email if member.user else None,
            user_department=(
                member.user.department.name
                if member.user and member.user.department
                else None
            ),
        )
