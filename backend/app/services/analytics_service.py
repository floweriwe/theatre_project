"""
Сервисы аналитики.

Содержит:
- PerformanceAnalyticsService — аналитика по спектаклям
- InventoryAnalyticsService — аналитика по инвентарю
- ReportService — генерация и управление отчётами
"""
from datetime import datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import func, select, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.performance import Performance, PerformanceStatus
from app.models.performance_inventory import PerformanceInventory
from app.models.checklist import ChecklistInstance, ChecklistStatus
from app.models.inventory import InventoryItem, ItemStatus, InventoryMovement
from app.models.schedule import ScheduleEvent
from app.models.analytics import (
    ReportTemplate,
    ScheduledReport,
    AnalyticsSnapshot,
    ReportCategory,
    AnalyticsMetricType,
)
from app.schemas.analytics import (
    PerformanceAnalytics,
    PerformanceReadinessSummary,
    InventoryAnalytics,
    InventoryUsageReport,
    ReportTemplateCreate,
    ReportTemplateResponse,
    ScheduledReportCreate,
    ScheduledReportResponse,
)


# =============================================================================
# Performance Analytics Service
# =============================================================================

class PerformanceAnalyticsService:
    """Сервис аналитики по спектаклям."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_overview(self, theater_id: int | None = None) -> PerformanceAnalytics:
        """Получить обзорную аналитику по спектаклям."""

        # Базовый запрос
        base_query = select(Performance)
        if theater_id:
            base_query = base_query.where(Performance.theater_id == theater_id)

        # Подсчёт по статусам
        status_query = (
            select(Performance.status, func.count(Performance.id))
            .group_by(Performance.status)
        )
        if theater_id:
            status_query = status_query.where(Performance.theater_id == theater_id)

        status_result = await self.session.execute(status_query)
        status_breakdown = {str(row[0].value): row[1] for row in status_result.fetchall()}

        # Общие счётчики
        total = sum(status_breakdown.values())
        active = status_breakdown.get(PerformanceStatus.IN_REPERTOIRE.value, 0)
        archived = status_breakdown.get(PerformanceStatus.ARCHIVED.value, 0)

        # Чеклисты
        checklist_query = (
            select(
                func.count(ChecklistInstance.id),
                func.count(case(
                    (ChecklistInstance.status == ChecklistStatus.COMPLETED, 1)
                ))
            )
            .select_from(ChecklistInstance)
            .join(Performance, ChecklistInstance.performance_id == Performance.id)
        )
        if theater_id:
            checklist_query = checklist_query.where(Performance.theater_id == theater_id)

        checklist_result = await self.session.execute(checklist_query)
        checklist_row = checklist_result.fetchone()
        total_checklists = checklist_row[0] if checklist_row else 0
        completed_checklists = checklist_row[1] if checklist_row else 0
        checklist_rate = (completed_checklists / total_checklists * 100) if total_checklists > 0 else 0

        # Топ спектаклей по количеству инвентаря
        inventory_query = (
            select(
                Performance.id,
                Performance.title,
                func.count(PerformanceInventory.id).label('count')
            )
            .join(PerformanceInventory, Performance.id == PerformanceInventory.performance_id)
            .group_by(Performance.id, Performance.title)
            .order_by(func.count(PerformanceInventory.id).desc())
            .limit(5)
        )
        if theater_id:
            inventory_query = inventory_query.where(Performance.theater_id == theater_id)

        inventory_result = await self.session.execute(inventory_query)
        most_inventory = [
            {"id": row[0], "title": row[1], "inventory_count": row[2]}
            for row in inventory_result.fetchall()
        ]

        # Топ спектаклей по количеству событий
        schedule_query = (
            select(
                Performance.id,
                Performance.title,
                func.count(ScheduleEvent.id).label('count')
            )
            .join(ScheduleEvent, Performance.id == ScheduleEvent.performance_id)
            .group_by(Performance.id, Performance.title)
            .order_by(func.count(ScheduleEvent.id).desc())
            .limit(5)
        )
        if theater_id:
            schedule_query = schedule_query.where(Performance.theater_id == theater_id)

        schedule_result = await self.session.execute(schedule_query)
        most_scheduled = [
            {"id": row[0], "title": row[1], "event_count": row[2]}
            for row in schedule_result.fetchall()
        ]

        return PerformanceAnalytics(
            total_performances=total,
            active_performances=active,
            archived_performances=archived,
            status_breakdown=status_breakdown,
            average_readiness=0.0,  # TODO: вычислить из документов
            total_checklists=total_checklists,
            completed_checklists=completed_checklists,
            checklist_completion_rate=checklist_rate,
            most_inventory_heavy=most_inventory,
            most_scheduled=most_scheduled,
        )

    async def get_performance_readiness(
        self,
        performance_id: int
    ) -> PerformanceReadinessSummary | None:
        """Получить сводку по готовности спектакля."""

        # Получить спектакль
        query = select(Performance).where(Performance.id == performance_id)
        result = await self.session.execute(query)
        performance = result.scalar_one_or_none()

        if not performance:
            return None

        # Чеклисты
        checklist_query = (
            select(
                func.count(ChecklistInstance.id),
                func.count(case(
                    (ChecklistInstance.status == ChecklistStatus.COMPLETED, 1)
                ))
            )
            .where(ChecklistInstance.performance_id == performance_id)
        )
        checklist_result = await self.session.execute(checklist_query)
        checklist_row = checklist_result.fetchone()
        total_checklists = checklist_row[0] if checklist_row else 0
        completed_checklists = checklist_row[1] if checklist_row else 0
        pending_checklists = total_checklists - completed_checklists

        # Инвентарь
        inventory_query = (
            select(func.count(PerformanceInventory.id))
            .where(PerformanceInventory.performance_id == performance_id)
        )
        inventory_result = await self.session.execute(inventory_query)
        total_inventory = inventory_result.scalar() or 0

        return PerformanceReadinessSummary(
            performance_id=performance_id,
            title=performance.title,
            status=performance.status.value,
            overall_readiness=0.0,  # TODO: вычислить
            sections_readiness={},  # TODO: вычислить из документов
            pending_checklists=pending_checklists,
            completed_checklists=completed_checklists,
            total_inventory=total_inventory,
            confirmed_inventory=total_inventory,  # TODO: добавить статус подтверждения
        )


# =============================================================================
# Inventory Analytics Service
# =============================================================================

class InventoryAnalyticsService:
    """Сервис аналитики по инвентарю."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_overview(self, theater_id: int | None = None) -> InventoryAnalytics:
        """Получить обзорную аналитику по инвентарю."""

        # Базовый запрос
        base_filter = InventoryItem.is_active == True
        if theater_id:
            base_filter = and_(base_filter, InventoryItem.theater_id == theater_id)

        # Общие счётчики
        total_query = (
            select(
                func.count(InventoryItem.id),
                func.sum(InventoryItem.quantity),
                func.sum(InventoryItem.current_value)
            )
            .where(base_filter)
        )
        total_result = await self.session.execute(total_query)
        total_row = total_result.fetchone()
        total_items = total_row[0] or 0
        total_quantity = total_row[1] or 0
        total_value = float(total_row[2]) if total_row[2] else None

        # По статусам
        status_query = (
            select(InventoryItem.status, func.count(InventoryItem.id))
            .where(base_filter)
            .group_by(InventoryItem.status)
        )
        status_result = await self.session.execute(status_query)
        status_breakdown = {str(row[0].value): row[1] for row in status_result.fetchall()}

        # По категориям (топ 10)
        category_query = (
            select(
                InventoryItem.category_id,
                func.count(InventoryItem.id).label('count'),
                func.sum(InventoryItem.current_value).label('value')
            )
            .where(base_filter)
            .group_by(InventoryItem.category_id)
            .order_by(func.count(InventoryItem.id).desc())
            .limit(10)
        )
        category_result = await self.session.execute(category_query)
        category_breakdown = [
            {
                "category_id": row[0],
                "name": f"Category {row[0]}",  # TODO: join с таблицей категорий
                "count": row[1],
                "value": float(row[2]) if row[2] else 0
            }
            for row in category_result.fetchall()
        ]

        # По состоянию
        condition_query = (
            select(InventoryItem.condition, func.count(InventoryItem.id))
            .where(base_filter)
            .group_by(InventoryItem.condition)
        )
        condition_result = await self.session.execute(condition_query)
        condition_breakdown = {
            str(row[0].value) if row[0] else "unknown": row[1]
            for row in condition_result.fetchall()
        }

        # Счётчики по использованию
        items_in_use = status_breakdown.get(ItemStatus.IN_USE.value, 0)
        items_reserved = status_breakdown.get(ItemStatus.RESERVED.value, 0)
        items_available = status_breakdown.get(ItemStatus.IN_STOCK.value, 0)
        items_needing_repair = status_breakdown.get(ItemStatus.REPAIR.value, 0)

        # Предметы с низким запасом (quantity < 3)
        low_stock_query = (
            select(InventoryItem.id, InventoryItem.name, InventoryItem.quantity)
            .where(and_(base_filter, InventoryItem.quantity < 3))
            .order_by(InventoryItem.quantity)
            .limit(10)
        )
        low_stock_result = await self.session.execute(low_stock_query)
        low_stock_items = [
            {"id": row[0], "name": row[1], "quantity": row[2]}
            for row in low_stock_result.fetchall()
        ]

        return InventoryAnalytics(
            total_items=total_items,
            total_quantity=total_quantity,
            total_value=total_value,
            status_breakdown=status_breakdown,
            category_breakdown=category_breakdown,
            condition_breakdown=condition_breakdown,
            items_in_use=items_in_use,
            items_reserved=items_reserved,
            items_available=items_available,
            items_needing_repair=items_needing_repair,
            low_stock_items=low_stock_items,
        )

    async def get_usage_report(
        self,
        theater_id: int | None = None,
        period_start: datetime | None = None,
        period_end: datetime | None = None,
    ) -> InventoryUsageReport:
        """Получить отчёт по использованию инвентаря."""

        # Период по умолчанию - последние 30 дней
        if not period_end:
            period_end = datetime.utcnow()
        if not period_start:
            period_start = period_end - timedelta(days=30)

        # Базовый фильтр для движений
        movement_filter = and_(
            InventoryMovement.created_at >= period_start,
            InventoryMovement.created_at <= period_end,
        )
        if theater_id:
            movement_filter = and_(
                movement_filter,
                InventoryMovement.item_id.in_(
                    select(InventoryItem.id).where(InventoryItem.theater_id == theater_id)
                )
            )

        # Общее количество движений
        total_query = (
            select(func.count(InventoryMovement.id))
            .where(movement_filter)
        )
        total_result = await self.session.execute(total_query)
        total_movements = total_result.scalar() or 0

        # По типам движений
        type_query = (
            select(InventoryMovement.movement_type, func.count(InventoryMovement.id))
            .where(movement_filter)
            .group_by(InventoryMovement.movement_type)
        )
        type_result = await self.session.execute(type_query)
        movements_by_type = {str(row[0].value): row[1] for row in type_result.fetchall()}

        # Самые используемые предметы
        most_used_query = (
            select(
                InventoryMovement.item_id,
                InventoryItem.name,
                func.count(InventoryMovement.id).label('usage_count')
            )
            .join(InventoryItem, InventoryMovement.item_id == InventoryItem.id)
            .where(movement_filter)
            .group_by(InventoryMovement.item_id, InventoryItem.name)
            .order_by(func.count(InventoryMovement.id).desc())
            .limit(10)
        )
        most_used_result = await self.session.execute(most_used_query)
        most_used_items = [
            {"id": row[0], "name": row[1], "usage_count": row[2]}
            for row in most_used_result.fetchall()
        ]

        # Использование по спектаклям
        performance_query = (
            select(
                PerformanceInventory.performance_id,
                Performance.title,
                func.count(PerformanceInventory.item_id).label('item_count')
            )
            .join(Performance, PerformanceInventory.performance_id == Performance.id)
            .group_by(PerformanceInventory.performance_id, Performance.title)
            .order_by(func.count(PerformanceInventory.item_id).desc())
            .limit(10)
        )
        if theater_id:
            performance_query = performance_query.where(Performance.theater_id == theater_id)

        performance_result = await self.session.execute(performance_query)
        usage_by_performance = [
            {"performance_id": row[0], "title": row[1], "item_count": row[2]}
            for row in performance_result.fetchall()
        ]

        return InventoryUsageReport(
            period_start=period_start,
            period_end=period_end,
            total_movements=total_movements,
            movements_by_type=movements_by_type,
            most_used_items=most_used_items,
            least_used_items=[],  # TODO: вычислить неиспользуемые
            usage_by_performance=usage_by_performance,
        )


# =============================================================================
# Report Service
# =============================================================================

class ReportService:
    """Сервис управления отчётами."""

    def __init__(self, session: AsyncSession):
        self.session = session

    # -------------------------------------------------------------------------
    # Report Templates
    # -------------------------------------------------------------------------

    async def get_templates(
        self,
        theater_id: int | None = None,
        category: ReportCategory | None = None,
    ) -> list[ReportTemplate]:
        """Получить список шаблонов отчётов."""

        query = select(ReportTemplate).where(ReportTemplate.is_active == True)

        # Системные шаблоны + шаблоны театра
        if theater_id:
            query = query.where(
                (ReportTemplate.theater_id == theater_id) |
                (ReportTemplate.is_system == True)
            )

        if category:
            query = query.where(ReportTemplate.category == category)

        query = query.order_by(ReportTemplate.name)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_template(self, template_id: UUID) -> ReportTemplate | None:
        """Получить шаблон отчёта по ID."""

        query = select(ReportTemplate).where(ReportTemplate.id == template_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def create_template(
        self,
        data: ReportTemplateCreate,
        theater_id: int | None,
        user_id: int | None,
    ) -> ReportTemplate:
        """Создать шаблон отчёта."""

        template = ReportTemplate(
            name=data.name,
            description=data.description,
            category=data.category,
            structure=data.structure,
            default_format=data.default_format,
            default_filters=data.default_filters,
            theater_id=theater_id,
            created_by_id=user_id,
        )

        self.session.add(template)
        await self.session.commit()
        await self.session.refresh(template)

        return template

    # -------------------------------------------------------------------------
    # Scheduled Reports
    # -------------------------------------------------------------------------

    async def get_scheduled_reports(
        self,
        theater_id: int | None = None,
    ) -> list[ScheduledReport]:
        """Получить список запланированных отчётов."""

        query = select(ScheduledReport)

        if theater_id:
            query = query.where(ScheduledReport.theater_id == theater_id)

        query = query.order_by(ScheduledReport.name)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def create_scheduled_report(
        self,
        data: ScheduledReportCreate,
        theater_id: int | None,
        user_id: int | None,
    ) -> ScheduledReport:
        """Создать запланированный отчёт."""

        report = ScheduledReport(
            template_id=data.template_id,
            name=data.name,
            description=data.description,
            frequency=data.frequency,
            cron_expression=data.cron_expression,
            recipients=data.recipients,
            format=data.format,
            filters=data.filters,
            theater_id=theater_id,
            created_by_id=user_id,
        )

        self.session.add(report)
        await self.session.commit()
        await self.session.refresh(report)

        return report

    # -------------------------------------------------------------------------
    # Analytics Snapshots
    # -------------------------------------------------------------------------

    async def save_snapshot(
        self,
        metric_type: AnalyticsMetricType,
        metric_name: str,
        period_start: datetime,
        period_end: datetime,
        value: dict,
        context: dict | None = None,
        theater_id: int | None = None,
    ) -> AnalyticsSnapshot:
        """Сохранить снапшот аналитических данных."""

        snapshot = AnalyticsSnapshot(
            metric_type=metric_type,
            metric_name=metric_name,
            period_start=period_start,
            period_end=period_end,
            value=value,
            context=context,
            theater_id=theater_id,
        )

        self.session.add(snapshot)
        await self.session.commit()
        await self.session.refresh(snapshot)

        return snapshot

    async def get_snapshots(
        self,
        metric_name: str,
        theater_id: int | None = None,
        period_start: datetime | None = None,
        period_end: datetime | None = None,
        limit: int = 100,
    ) -> list[AnalyticsSnapshot]:
        """Получить снапшоты по имени метрики."""

        query = select(AnalyticsSnapshot).where(
            AnalyticsSnapshot.metric_name == metric_name
        )

        if theater_id:
            query = query.where(AnalyticsSnapshot.theater_id == theater_id)

        if period_start:
            query = query.where(AnalyticsSnapshot.period_start >= period_start)

        if period_end:
            query = query.where(AnalyticsSnapshot.period_end <= period_end)

        query = query.order_by(AnalyticsSnapshot.period_end.desc()).limit(limit)

        result = await self.session.execute(query)
        return list(result.scalars().all())
