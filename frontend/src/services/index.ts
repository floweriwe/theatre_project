/**
 * Экспорт всех сервисов.
 */

export { api, getErrorMessage } from './api';
export type { ApiResponse, PaginatedResponse, ApiError } from './api';
export { authService } from './auth_service';
export { inventoryService } from './inventory_service';
export { documentService } from './document_service';
export { performanceService } from './performance_service';
export { scheduleService } from './schedule_service';
