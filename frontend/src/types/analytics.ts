/**
 * Типы для аналитики и отчётов.
 */

// =============================================================================
// Enums
// =============================================================================

export type ReportCategory = 'performance' | 'inventory' | 'schedule' | 'hr' | 'financial' | 'custom';
export type ReportFormat = 'pdf' | 'excel' | 'html' | 'json';
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'on_demand';

// =============================================================================
// Performance Analytics
// =============================================================================

export interface PerformanceAnalytics {
  totalPerformances: number;
  activePerformances: number;
  archivedPerformances: number;
  statusBreakdown: Record<string, number>;
  averageReadiness: number;
  totalChecklists: number;
  completedChecklists: number;
  checklistCompletionRate: number;
  mostInventoryHeavy: Array<{ id: number; title: string; inventoryCount: number }>;
  mostScheduled: Array<{ id: number; title: string; eventCount: number }>;
}

export interface PerformanceReadinessSummary {
  performanceId: number;
  title: string;
  status: string;
  overallReadiness: number;
  sectionsReadiness: Record<string, number>;
  pendingChecklists: number;
  completedChecklists: number;
  totalInventory: number;
  confirmedInventory: number;
}

// =============================================================================
// Inventory Analytics
// =============================================================================

export interface InventoryAnalytics {
  totalItems: number;
  totalQuantity: number;
  totalValue: number | null;
  statusBreakdown: Record<string, number>;
  categoryBreakdown: Array<{ categoryId: number; name: string; count: number; value: number }>;
  conditionBreakdown: Record<string, number>;
  itemsInUse: number;
  itemsReserved: number;
  itemsAvailable: number;
  itemsNeedingRepair: number;
  lowStockItems: Array<{ id: number; name: string; quantity: number }>;
}

export interface InventoryUsageReport {
  periodStart: string;
  periodEnd: string;
  totalMovements: number;
  movementsByType: Record<string, number>;
  mostUsedItems: Array<{ id: number; name: string; usageCount: number }>;
  leastUsedItems: Array<{ id: number; name: string; daysIdle: number }>;
  usageByPerformance: Array<{ performanceId: number; title: string; itemCount: number }>;
}

// =============================================================================
// Report Templates
// =============================================================================

export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  category: ReportCategory;
  structure: Record<string, unknown>;
  defaultFormat: ReportFormat;
  defaultFilters: Record<string, unknown> | null;
  isActive: boolean;
  isSystem: boolean;
  theaterId: number | null;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportTemplateCreate {
  name: string;
  description?: string;
  category: ReportCategory;
  structure?: Record<string, unknown>;
  defaultFormat?: ReportFormat;
  defaultFilters?: Record<string, unknown>;
}

// =============================================================================
// Scheduled Reports
// =============================================================================

export interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  description: string | null;
  frequency: ScheduleFrequency;
  cronExpression: string | null;
  recipients: string[];
  format: ReportFormat;
  filters: Record<string, unknown> | null;
  isActive: boolean;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  nextRunAt: string | null;
  theaterId: number | null;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
  templateName: string | null;
  templateCategory: ReportCategory | null;
}

export interface ScheduledReportCreate {
  templateId: string;
  name: string;
  description?: string;
  frequency?: ScheduleFrequency;
  cronExpression?: string;
  recipients?: string[];
  format?: ReportFormat;
  filters?: Record<string, unknown>;
}

// =============================================================================
// Report Generation
// =============================================================================

export interface ReportGenerationRequest {
  templateId: string;
  format?: ReportFormat;
  filters?: Record<string, unknown>;
  periodStart?: string;
  periodEnd?: string;
}

export interface ReportGenerationResponse {
  id: string;
  templateId: string;
  format: ReportFormat;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  downloadUrl: string | null;
  errorMessage: string | null;
  generatedAt: string | null;
  expiresAt: string | null;
}

// =============================================================================
// UI Helpers
// =============================================================================

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  performance: 'Спектакли',
  inventory: 'Инвентарь',
  schedule: 'Расписание',
  hr: 'Персонал',
  financial: 'Финансы',
  custom: 'Пользовательские',
};

export const REPORT_FORMAT_LABELS: Record<ReportFormat, string> = {
  pdf: 'PDF',
  excel: 'Excel',
  html: 'HTML',
  json: 'JSON',
};

export const SCHEDULE_FREQUENCY_LABELS: Record<ScheduleFrequency, string> = {
  daily: 'Ежедневно',
  weekly: 'Еженедельно',
  monthly: 'Ежемесячно',
  on_demand: 'По запросу',
};
