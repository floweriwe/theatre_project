"""
API эндпоинты аналитики и отчётов.

Роуты:
- /analytics/performance — аналитика спектаклей
- /analytics/inventory — аналитика инвентаря
- /reports/templates — шаблоны отчётов
- /reports/scheduled — запланированные отчёты
"""
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import CurrentUserDep, SessionDep
from app.schemas.base import MessageResponse
from app.schemas.analytics import (
    # Enums
    ReportCategory,
    ReportFormat,
    # Analytics
    PerformanceAnalytics,
    PerformanceReadinessSummary,
    InventoryAnalytics,
    InventoryUsageReport,
    # Templates
    ReportTemplateCreate,
    ReportTemplateUpdate,
    ReportTemplateResponse,
    ReportTemplateListResponse,
    # Scheduled
    ScheduledReportCreate,
    ScheduledReportUpdate,
    ScheduledReportResponse,
    # Reports
    ReportGenerationRequest,
    ReportGenerationResponse,
)
from app.services.analytics_service import (
    PerformanceAnalyticsService,
    InventoryAnalyticsService,
    ReportService,
)

router = APIRouter(tags=["Analytics"])


# =============================================================================
# Dependencies
# =============================================================================

async def get_performance_analytics(session: SessionDep) -> PerformanceAnalyticsService:
    """Получить сервис аналитики спектаклей."""
    return PerformanceAnalyticsService(session)


async def get_inventory_analytics(session: SessionDep) -> InventoryAnalyticsService:
    """Получить сервис аналитики инвентаря."""
    return InventoryAnalyticsService(session)


async def get_report_service(session: SessionDep) -> ReportService:
    """Получить сервис отчётов."""
    return ReportService(session)


PerformanceAnalyticsDep = Depends(get_performance_analytics)
InventoryAnalyticsDep = Depends(get_inventory_analytics)
ReportServiceDep = Depends(get_report_service)


# =============================================================================
# Performance Analytics Endpoints
# =============================================================================

@router.get(
    "/analytics/performance",
    response_model=PerformanceAnalytics,
    summary="Обзорная аналитика спектаклей",
)
async def get_performance_overview(
    current_user: CurrentUserDep,
    service: PerformanceAnalyticsService = PerformanceAnalyticsDep,
):
    """Получить обзорную аналитику по спектаклям."""
    return await service.get_overview(current_user.theater_id)


@router.get(
    "/analytics/performance/{performance_id}/readiness",
    response_model=PerformanceReadinessSummary,
    summary="Готовность спектакля",
)
async def get_performance_readiness(
    performance_id: int,
    current_user: CurrentUserDep,
    service: PerformanceAnalyticsService = PerformanceAnalyticsDep,
):
    """Получить сводку по готовности спектакля."""
    result = await service.get_performance_readiness(performance_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Спектакль {performance_id} не найден",
        )
    return result


# =============================================================================
# Inventory Analytics Endpoints
# =============================================================================

@router.get(
    "/analytics/inventory",
    response_model=InventoryAnalytics,
    summary="Обзорная аналитика инвентаря",
)
async def get_inventory_overview(
    current_user: CurrentUserDep,
    service: InventoryAnalyticsService = InventoryAnalyticsDep,
):
    """Получить обзорную аналитику по инвентарю."""
    return await service.get_overview(current_user.theater_id)


@router.get(
    "/analytics/inventory/usage",
    response_model=InventoryUsageReport,
    summary="Отчёт по использованию инвентаря",
)
async def get_inventory_usage(
    current_user: CurrentUserDep,
    period_start: datetime | None = Query(None, description="Начало периода"),
    period_end: datetime | None = Query(None, description="Конец периода"),
    service: InventoryAnalyticsService = InventoryAnalyticsDep,
):
    """Получить отчёт по использованию инвентаря за период."""
    return await service.get_usage_report(
        theater_id=current_user.theater_id,
        period_start=period_start,
        period_end=period_end,
    )


# =============================================================================
# Report Templates Endpoints
# =============================================================================

@router.get(
    "/reports/templates",
    response_model=list[ReportTemplateListResponse],
    summary="Список шаблонов отчётов",
)
async def get_report_templates(
    current_user: CurrentUserDep,
    category: ReportCategory | None = Query(None, description="Фильтр по категории"),
    service: ReportService = ReportServiceDep,
):
    """Получить список доступных шаблонов отчётов."""
    templates = await service.get_templates(
        theater_id=current_user.theater_id,
        category=category,
    )
    return [
        ReportTemplateListResponse(
            id=t.id,
            name=t.name,
            category=t.category,
            default_format=t.default_format,
            is_active=t.is_active,
            is_system=t.is_system,
        )
        for t in templates
    ]


@router.get(
    "/reports/templates/{template_id}",
    response_model=ReportTemplateResponse,
    summary="Получить шаблон отчёта",
)
async def get_report_template(
    template_id: UUID,
    current_user: CurrentUserDep,
    service: ReportService = ReportServiceDep,
):
    """Получить шаблон отчёта по ID."""
    template = await service.get_template(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шаблон не найден",
        )
    return template


@router.post(
    "/reports/templates",
    response_model=ReportTemplateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать шаблон отчёта",
)
async def create_report_template(
    data: ReportTemplateCreate,
    current_user: CurrentUserDep,
    service: ReportService = ReportServiceDep,
):
    """Создать новый шаблон отчёта."""
    return await service.create_template(
        data=data,
        theater_id=current_user.theater_id,
        user_id=current_user.id,
    )


# =============================================================================
# Scheduled Reports Endpoints
# =============================================================================

@router.get(
    "/reports/scheduled",
    response_model=list[ScheduledReportResponse],
    summary="Список запланированных отчётов",
)
async def get_scheduled_reports(
    current_user: CurrentUserDep,
    service: ReportService = ReportServiceDep,
):
    """Получить список запланированных отчётов."""
    reports = await service.get_scheduled_reports(
        theater_id=current_user.theater_id,
    )
    return [
        ScheduledReportResponse(
            id=r.id,
            template_id=r.template_id,
            name=r.name,
            description=r.description,
            frequency=r.frequency,
            cron_expression=r.cron_expression,
            recipients=r.recipients,
            format=r.format,
            filters=r.filters,
            is_active=r.is_active,
            last_run_at=r.last_run_at,
            last_run_status=r.last_run_status,
            next_run_at=r.next_run_at,
            theater_id=r.theater_id,
            created_by_id=r.created_by_id,
            created_at=r.created_at,
            updated_at=r.updated_at,
            template_name=r.template.name if r.template else None,
            template_category=r.template.category if r.template else None,
        )
        for r in reports
    ]


@router.post(
    "/reports/scheduled",
    response_model=ScheduledReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать запланированный отчёт",
)
async def create_scheduled_report(
    data: ScheduledReportCreate,
    current_user: CurrentUserDep,
    service: ReportService = ReportServiceDep,
):
    """Создать новый запланированный отчёт."""
    # Проверить существование шаблона
    template = await service.get_template(data.template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Шаблон не найден",
        )

    report = await service.create_scheduled_report(
        data=data,
        theater_id=current_user.theater_id,
        user_id=current_user.id,
    )

    return ScheduledReportResponse(
        id=report.id,
        template_id=report.template_id,
        name=report.name,
        description=report.description,
        frequency=report.frequency,
        cron_expression=report.cron_expression,
        recipients=report.recipients,
        format=report.format,
        filters=report.filters,
        is_active=report.is_active,
        last_run_at=report.last_run_at,
        last_run_status=report.last_run_status,
        next_run_at=report.next_run_at,
        theater_id=report.theater_id,
        created_by_id=report.created_by_id,
        created_at=report.created_at,
        updated_at=report.updated_at,
        template_name=template.name,
        template_category=template.category,
    )


# =============================================================================
# Report Generation Endpoints
# =============================================================================

@router.post(
    "/reports/generate",
    response_model=ReportGenerationResponse,
    summary="Сгенерировать отчёт",
)
async def generate_report(
    data: ReportGenerationRequest,
    current_user: CurrentUserDep,
    service: ReportService = ReportServiceDep,
):
    """Запустить генерацию отчёта."""
    # Проверить существование шаблона
    template = await service.get_template(data.template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Шаблон не найден",
        )

    # TODO: Реализовать асинхронную генерацию отчёта
    # Пока возвращаем заглушку
    import uuid
    return ReportGenerationResponse(
        id=uuid.uuid4(),
        template_id=data.template_id,
        format=data.format,
        status="pending",
        download_url=None,
        error_message=None,
        generated_at=None,
        expires_at=None,
    )
