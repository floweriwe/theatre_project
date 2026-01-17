/**
 * API сервис аналитики и отчётов.
 */

import api from './api';
import type {
  PerformanceAnalytics,
  PerformanceReadinessSummary,
  InventoryAnalytics,
  InventoryUsageReport,
  ReportTemplate,
  ReportTemplateCreate,
  ScheduledReport,
  ScheduledReportCreate,
  ReportGenerationRequest,
  ReportGenerationResponse,
  ReportCategory,
} from '@/types/analytics';

// =============================================================================
// Transformers
// =============================================================================

function transformPerformanceAnalytics(data: Record<string, unknown>): PerformanceAnalytics {
  return {
    totalPerformances: data.total_performances as number,
    activePerformances: data.active_performances as number,
    archivedPerformances: data.archived_performances as number,
    statusBreakdown: data.status_breakdown as Record<string, number>,
    averageReadiness: data.average_readiness as number,
    totalChecklists: data.total_checklists as number,
    completedChecklists: data.completed_checklists as number,
    checklistCompletionRate: data.checklist_completion_rate as number,
    mostInventoryHeavy: (data.most_inventory_heavy as Array<Record<string, unknown>>).map((item) => ({
      id: item.id as number,
      title: item.title as string,
      inventoryCount: item.inventory_count as number,
    })),
    mostScheduled: (data.most_scheduled as Array<Record<string, unknown>>).map((item) => ({
      id: item.id as number,
      title: item.title as string,
      eventCount: item.event_count as number,
    })),
  };
}

function transformInventoryAnalytics(data: Record<string, unknown>): InventoryAnalytics {
  return {
    totalItems: data.total_items as number,
    totalQuantity: data.total_quantity as number,
    totalValue: data.total_value as number | null,
    statusBreakdown: data.status_breakdown as Record<string, number>,
    categoryBreakdown: (data.category_breakdown as Array<Record<string, unknown>>).map((item) => ({
      categoryId: item.category_id as number,
      name: item.name as string,
      count: item.count as number,
      value: item.value as number,
    })),
    conditionBreakdown: data.condition_breakdown as Record<string, number>,
    itemsInUse: data.items_in_use as number,
    itemsReserved: data.items_reserved as number,
    itemsAvailable: data.items_available as number,
    itemsNeedingRepair: data.items_needing_repair as number,
    lowStockItems: (data.low_stock_items as Array<Record<string, unknown>>).map((item) => ({
      id: item.id as number,
      name: item.name as string,
      quantity: item.quantity as number,
    })),
  };
}

function transformInventoryUsageReport(data: Record<string, unknown>): InventoryUsageReport {
  return {
    periodStart: data.period_start as string,
    periodEnd: data.period_end as string,
    totalMovements: data.total_movements as number,
    movementsByType: data.movements_by_type as Record<string, number>,
    mostUsedItems: (data.most_used_items as Array<Record<string, unknown>>).map((item) => ({
      id: item.id as number,
      name: item.name as string,
      usageCount: item.usage_count as number,
    })),
    leastUsedItems: (data.least_used_items as Array<Record<string, unknown>>).map((item) => ({
      id: item.id as number,
      name: item.name as string,
      daysIdle: item.days_idle as number,
    })),
    usageByPerformance: (data.usage_by_performance as Array<Record<string, unknown>>).map((item) => ({
      performanceId: item.performance_id as number,
      title: item.title as string,
      itemCount: item.item_count as number,
    })),
  };
}

function transformReportTemplate(data: Record<string, unknown>): ReportTemplate {
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string | null,
    category: data.category as ReportCategory,
    structure: data.structure as Record<string, unknown>,
    defaultFormat: data.default_format as ReportTemplate['defaultFormat'],
    defaultFilters: data.default_filters as Record<string, unknown> | null,
    isActive: data.is_active as boolean,
    isSystem: data.is_system as boolean,
    theaterId: data.theater_id as number | null,
    createdById: data.created_by_id as number | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function transformScheduledReport(data: Record<string, unknown>): ScheduledReport {
  return {
    id: data.id as string,
    templateId: data.template_id as string,
    name: data.name as string,
    description: data.description as string | null,
    frequency: data.frequency as ScheduledReport['frequency'],
    cronExpression: data.cron_expression as string | null,
    recipients: data.recipients as string[],
    format: data.format as ScheduledReport['format'],
    filters: data.filters as Record<string, unknown> | null,
    isActive: data.is_active as boolean,
    lastRunAt: data.last_run_at as string | null,
    lastRunStatus: data.last_run_status as string | null,
    nextRunAt: data.next_run_at as string | null,
    theaterId: data.theater_id as number | null,
    createdById: data.created_by_id as number | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    templateName: data.template_name as string | null,
    templateCategory: data.template_category as ReportCategory | null,
  };
}

// =============================================================================
// API Service
// =============================================================================

export const analyticsService = {
  // ===========================================================================
  // Performance Analytics
  // ===========================================================================

  /**
   * Получить обзорную аналитику по спектаклям.
   */
  async getPerformanceAnalytics(): Promise<PerformanceAnalytics> {
    const response = await api.get('/analytics/performance');
    return transformPerformanceAnalytics(response.data);
  },

  /**
   * Получить готовность спектакля.
   */
  async getPerformanceReadiness(performanceId: number): Promise<PerformanceReadinessSummary> {
    const response = await api.get(`/analytics/performance/${performanceId}/readiness`);
    const data = response.data;
    return {
      performanceId: data.performance_id as number,
      title: data.title as string,
      status: data.status as string,
      overallReadiness: data.overall_readiness as number,
      sectionsReadiness: data.sections_readiness as Record<string, number>,
      pendingChecklists: data.pending_checklists as number,
      completedChecklists: data.completed_checklists as number,
      totalInventory: data.total_inventory as number,
      confirmedInventory: data.confirmed_inventory as number,
    };
  },

  // ===========================================================================
  // Inventory Analytics
  // ===========================================================================

  /**
   * Получить обзорную аналитику по инвентарю.
   */
  async getInventoryAnalytics(): Promise<InventoryAnalytics> {
    const response = await api.get('/analytics/inventory');
    return transformInventoryAnalytics(response.data);
  },

  /**
   * Получить отчёт по использованию инвентаря.
   */
  async getInventoryUsageReport(
    periodStart?: string,
    periodEnd?: string
  ): Promise<InventoryUsageReport> {
    const params = new URLSearchParams();
    if (periodStart) params.append('period_start', periodStart);
    if (periodEnd) params.append('period_end', periodEnd);

    const response = await api.get(`/analytics/inventory/usage?${params.toString()}`);
    return transformInventoryUsageReport(response.data);
  },

  // ===========================================================================
  // Report Templates
  // ===========================================================================

  /**
   * Получить список шаблонов отчётов.
   */
  async getReportTemplates(category?: ReportCategory): Promise<ReportTemplate[]> {
    const params = category ? `?category=${category}` : '';
    const response = await api.get(`/reports/templates${params}`);
    return response.data.map(transformReportTemplate);
  },

  /**
   * Получить шаблон отчёта по ID.
   */
  async getReportTemplate(templateId: string): Promise<ReportTemplate> {
    const response = await api.get(`/reports/templates/${templateId}`);
    return transformReportTemplate(response.data);
  },

  /**
   * Создать шаблон отчёта.
   */
  async createReportTemplate(data: ReportTemplateCreate): Promise<ReportTemplate> {
    const snakeData = {
      name: data.name,
      description: data.description,
      category: data.category,
      structure: data.structure || {},
      default_format: data.defaultFormat || 'pdf',
      default_filters: data.defaultFilters,
    };
    const response = await api.post('/reports/templates', snakeData);
    return transformReportTemplate(response.data);
  },

  // ===========================================================================
  // Scheduled Reports
  // ===========================================================================

  /**
   * Получить список запланированных отчётов.
   */
  async getScheduledReports(): Promise<ScheduledReport[]> {
    const response = await api.get('/reports/scheduled');
    return response.data.map(transformScheduledReport);
  },

  /**
   * Создать запланированный отчёт.
   */
  async createScheduledReport(data: ScheduledReportCreate): Promise<ScheduledReport> {
    const snakeData = {
      template_id: data.templateId,
      name: data.name,
      description: data.description,
      frequency: data.frequency || 'weekly',
      cron_expression: data.cronExpression,
      recipients: data.recipients || [],
      format: data.format || 'pdf',
      filters: data.filters,
    };
    const response = await api.post('/reports/scheduled', snakeData);
    return transformScheduledReport(response.data);
  },

  // ===========================================================================
  // Report Generation
  // ===========================================================================

  /**
   * Сгенерировать отчёт.
   */
  async generateReport(data: ReportGenerationRequest): Promise<ReportGenerationResponse> {
    const snakeData = {
      template_id: data.templateId,
      format: data.format || 'pdf',
      filters: data.filters,
      period_start: data.periodStart,
      period_end: data.periodEnd,
    };
    const response = await api.post('/reports/generate', snakeData);
    return {
      id: response.data.id as string,
      templateId: response.data.template_id as string,
      format: response.data.format as ReportGenerationResponse['format'],
      status: response.data.status as ReportGenerationResponse['status'],
      downloadUrl: response.data.download_url as string | null,
      errorMessage: response.data.error_message as string | null,
      generatedAt: response.data.generated_at as string | null,
      expiresAt: response.data.expires_at as string | null,
    };
  },
};

export default analyticsService;
