/**
 * Типы для Performance Hub (конструктор спектакля).
 */

// =============================================================================
// Enums
// =============================================================================

/** Тип роли участника */
export type CastRoleType = 'cast' | 'crew';

/** Тип чеклиста */
export type ChecklistType = 'pre_show' | 'day_of' | 'post_show' | 'montage' | 'rehearsal';

/** Статус чеклиста */
export type ChecklistStatus = 'pending' | 'in_progress' | 'completed';

// =============================================================================
// Inventory Links
// =============================================================================

/** Связь инвентаря со спектаклем */
export interface PerformanceInventoryLink {
  id: string;
  performanceId: number;
  itemId: number;
  sceneId: number | null;
  quantity: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Вложенные данные об инвентаре
  itemName: string | null;
  itemInventoryNumber: string | null;
  itemStatus: string | null;
  itemCategoryName: string | null;
  itemPhotoPath: string | null;
  // Вложенные данные о сцене
  sceneName: string | null;
}

/** Создание связи инвентаря */
export interface InventoryLinkCreate {
  itemId: number;
  sceneId?: number;
  quantity?: number;
  notes?: string;
}

/** Обновление связи инвентаря */
export interface InventoryLinkUpdate {
  sceneId?: number;
  quantity?: number;
  notes?: string;
}

// =============================================================================
// Checklist Templates
// =============================================================================

/** Элемент чеклиста в шаблоне */
export interface ChecklistItemDefinition {
  label: string;
  description: string | null;
  required: boolean;
}

/** Шаблон чеклиста */
export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  type: ChecklistType;
  items: ChecklistItemDefinition[];
  isActive: boolean;
  theaterId: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Создание шаблона чеклиста */
export interface ChecklistTemplateCreate {
  name: string;
  description?: string;
  type: ChecklistType;
  items: ChecklistItemDefinition[];
}

// =============================================================================
// Checklist Instances
// =============================================================================

/** Данные о выполнении элемента */
export interface ChecklistItemCompletion {
  index: number;
  isChecked: boolean;
  comment: string | null;
  photoUrl: string | null;
  checkedById: number | null;
  checkedAt: string | null;
}

/** Экземпляр чеклиста */
export interface ChecklistInstance {
  id: string;
  performanceId: number;
  templateId: string | null;
  name: string;
  status: ChecklistStatus;
  completionData: Record<string, ChecklistItemCompletion>;
  createdAt: string;
  updatedAt: string;
  // Вычисляемые поля
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
  // Вложенные данные шаблона
  templateName: string | null;
  templateType: ChecklistType | null;
}

/** Создание экземпляра чеклиста */
export interface ChecklistInstanceCreate {
  templateId?: string;
  name?: string;
}

/** Обновление элемента чеклиста */
export interface ChecklistItemUpdate {
  isChecked: boolean;
  comment?: string;
  photoUrl?: string;
}

// =============================================================================
// Cast & Crew
// =============================================================================

/** Участник спектакля */
export interface PerformanceCastMember {
  id: string;
  performanceId: number;
  userId: number;
  roleType: CastRoleType;
  characterName: string | null;
  functionalRole: string | null;
  isUnderstudy: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Вложенные данные пользователя
  userFullName: string | null;
  userEmail: string | null;
  userDepartment: string | null;
}

/** Группированный ответ каста */
export interface CastGroupedResponse {
  performanceId: number;
  cast: PerformanceCastMember[];
  crew: PerformanceCastMember[];
  totalCast: number;
  totalCrew: number;
}

/** Добавление участника */
export interface CastMemberCreate {
  userId: number;
  roleType: CastRoleType;
  characterName?: string;
  functionalRole?: string;
  isUnderstudy?: boolean;
  notes?: string;
}

/** Обновление участника */
export interface CastMemberUpdate {
  characterName?: string;
  functionalRole?: string;
  isUnderstudy?: boolean;
  notes?: string;
}

// =============================================================================
// Performance Structure
// =============================================================================

/** Полная структура спектакля для конструктора */
export interface PerformanceStructure {
  performance: {
    id: number;
    title: string;
    status: string;
    configurationVersion: number;
    isTemplate: boolean;
  };
  sections: Array<{
    id: number;
    sectionType: string;
    title: string;
    sortOrder: number;
  }>;
  inventory: PerformanceInventoryLink[];
  cast: CastGroupedResponse;
  checklists: ChecklistInstance[];
}

/** Снапшот конфигурации */
export interface PerformanceSnapshot {
  id: string;
  performanceId: number;
  version: number;
  snapshotData: Record<string, unknown>;
  description: string | null;
  createdAt: string;
  createdById: number | null;
}

// =============================================================================
// UI Helpers
// =============================================================================

/** Метки типов ролей */
export const CAST_ROLE_TYPE_LABELS: Record<CastRoleType, string> = {
  cast: 'Актёры',
  crew: 'Персонал',
};

/** Метки типов чеклистов */
export const CHECKLIST_TYPE_LABELS: Record<ChecklistType, string> = {
  pre_show: 'Перед спектаклем',
  day_of: 'В день спектакля',
  post_show: 'После спектакля',
  montage: 'Монтаж',
  rehearsal: 'Репетиция',
};

/** Метки статусов чеклистов */
export const CHECKLIST_STATUS_LABELS: Record<ChecklistStatus, string> = {
  pending: 'Ожидает',
  in_progress: 'В процессе',
  completed: 'Завершён',
};

/** Цвета статусов чеклистов */
export const CHECKLIST_STATUS_COLORS: Record<ChecklistStatus, string> = {
  pending: 'text-[#94A3B8] bg-[#94A3B8]/10',
  in_progress: 'text-amber-400 bg-amber-500/10',
  completed: 'text-emerald-400 bg-emerald-500/10',
};
