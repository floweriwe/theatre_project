/**
 * API сервис Performance Hub.
 */

import api from './api';
import type {
  PerformanceStructure,
  PerformanceSnapshot,
  PerformanceInventoryLink,
  InventoryLinkCreate,
  InventoryLinkUpdate,
  ChecklistTemplate,
  ChecklistTemplateCreate,
  ChecklistInstance,
  ChecklistInstanceCreate,
  ChecklistItemUpdate,
  CastGroupedResponse,
  PerformanceCastMember,
  CastMemberCreate,
  CastMemberUpdate,
} from '@/types/performance_hub';

// =============================================================================
// Transformers
// =============================================================================

function transformInventoryLink(data: Record<string, unknown>): PerformanceInventoryLink {
  return {
    id: data.id as string,
    performanceId: data.performance_id as number,
    itemId: data.item_id as number,
    sceneId: data.scene_id as number | null,
    quantity: data.quantity as number,
    notes: data.notes as string | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    itemName: data.item_name as string | null,
    itemInventoryNumber: data.item_inventory_number as string | null,
    itemStatus: data.item_status as string | null,
    itemCategoryName: data.item_category_name as string | null,
    itemPhotoPath: data.item_photo_path as string | null,
    sceneName: data.scene_name as string | null,
  };
}

function transformChecklistTemplate(data: Record<string, unknown>): ChecklistTemplate {
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string | null,
    type: data.type as ChecklistTemplate['type'],
    items: data.items as ChecklistTemplate['items'],
    isActive: data.is_active as boolean,
    theaterId: data.theater_id as number | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function transformChecklistInstance(data: Record<string, unknown>): ChecklistInstance {
  return {
    id: data.id as string,
    performanceId: data.performance_id as number,
    templateId: data.template_id as string | null,
    name: data.name as string,
    status: data.status as ChecklistInstance['status'],
    completionData: data.completion_data as Record<string, ChecklistInstance['completionData'][string]>,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    totalItems: data.total_items as number,
    completedItems: data.completed_items as number,
    completionPercentage: data.completion_percentage as number,
    templateName: data.template_name as string | null,
    templateType: data.template_type as ChecklistInstance['templateType'],
  };
}

function transformCastMember(data: Record<string, unknown>): PerformanceCastMember {
  return {
    id: data.id as string,
    performanceId: data.performance_id as number,
    userId: data.user_id as number,
    roleType: data.role_type as PerformanceCastMember['roleType'],
    characterName: data.character_name as string | null,
    functionalRole: data.functional_role as string | null,
    isUnderstudy: data.is_understudy as boolean,
    notes: data.notes as string | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    userFullName: data.user_full_name as string | null,
    userEmail: data.user_email as string | null,
    userDepartment: data.user_department as string | null,
  };
}

function transformCastGrouped(data: Record<string, unknown>): CastGroupedResponse {
  return {
    performanceId: data.performance_id as number,
    cast: (data.cast as Record<string, unknown>[]).map(transformCastMember),
    crew: (data.crew as Record<string, unknown>[]).map(transformCastMember),
    totalCast: data.total_cast as number,
    totalCrew: data.total_crew as number,
  };
}

function transformStructure(data: Record<string, unknown>): PerformanceStructure {
  const perf = data.performance as Record<string, unknown>;
  return {
    performance: {
      id: perf.id as number,
      title: perf.title as string,
      status: perf.status as string,
      configurationVersion: perf.configuration_version as number,
      isTemplate: perf.is_template as boolean,
    },
    sections: (data.sections as Record<string, unknown>[]).map((s) => ({
      id: s.id as number,
      sectionType: s.section_type as string,
      title: s.title as string,
      sortOrder: s.sort_order as number,
    })),
    inventory: (data.inventory as Record<string, unknown>[]).map(transformInventoryLink),
    cast: transformCastGrouped(data.cast as Record<string, unknown>),
    checklists: (data.checklists as Record<string, unknown>[]).map(transformChecklistInstance),
  };
}

function transformSnapshot(data: Record<string, unknown>): PerformanceSnapshot {
  return {
    id: data.id as string,
    performanceId: data.performance_id as number,
    version: data.version as number,
    snapshotData: data.snapshot_data as Record<string, unknown>,
    description: data.description as string | null,
    createdAt: data.created_at as string,
    createdById: data.created_by_id as number | null,
  };
}

// =============================================================================
// API Service
// =============================================================================

export const performanceHubService = {
  // ===========================================================================
  // Performance Structure
  // ===========================================================================

  /**
   * Получить полную структуру спектакля для конструктора.
   */
  async getStructure(performanceId: number): Promise<PerformanceStructure> {
    const response = await api.get(`/performances/${performanceId}/structure`);
    return transformStructure(response.data);
  },

  /**
   * Создать снапшот конфигурации.
   */
  async createSnapshot(
    performanceId: number,
    description?: string
  ): Promise<PerformanceSnapshot> {
    const response = await api.post(`/performances/${performanceId}/snapshot`, {
      description,
    });
    return transformSnapshot(response.data);
  },

  // ===========================================================================
  // Inventory Links
  // ===========================================================================

  /**
   * Добавить инвентарь к спектаклю.
   */
  async addInventoryLink(
    performanceId: number,
    data: InventoryLinkCreate
  ): Promise<PerformanceInventoryLink> {
    const snakeData = {
      item_id: data.itemId,
      scene_id: data.sceneId,
      quantity: data.quantity ?? 1,
      notes: data.notes,
    };
    const response = await api.post(`/performances/${performanceId}/inventory`, snakeData);
    return transformInventoryLink(response.data);
  },

  /**
   * Обновить связь инвентаря.
   */
  async updateInventoryLink(
    performanceId: number,
    linkId: string,
    data: InventoryLinkUpdate
  ): Promise<PerformanceInventoryLink> {
    const snakeData: Record<string, unknown> = {};
    if (data.sceneId !== undefined) snakeData.scene_id = data.sceneId;
    if (data.quantity !== undefined) snakeData.quantity = data.quantity;
    if (data.notes !== undefined) snakeData.notes = data.notes;

    const response = await api.patch(
      `/performances/${performanceId}/inventory/${linkId}`,
      snakeData
    );
    return transformInventoryLink(response.data);
  },

  /**
   * Удалить связь инвентаря.
   */
  async removeInventoryLink(performanceId: number, linkId: string): Promise<void> {
    await api.delete(`/performances/${performanceId}/inventory/${linkId}`);
  },

  // ===========================================================================
  // Checklist Templates
  // ===========================================================================

  /**
   * Получить шаблоны чеклистов.
   */
  async getChecklistTemplates(): Promise<ChecklistTemplate[]> {
    const response = await api.get('/checklists/templates');
    return response.data.map(transformChecklistTemplate);
  },

  /**
   * Создать шаблон чеклиста.
   */
  async createChecklistTemplate(
    data: ChecklistTemplateCreate
  ): Promise<ChecklistTemplate> {
    const response = await api.post('/checklists/templates', data);
    return transformChecklistTemplate(response.data);
  },

  // ===========================================================================
  // Checklist Instances
  // ===========================================================================

  /**
   * Создать экземпляр чеклиста для спектакля.
   */
  async createChecklistInstance(
    performanceId: number,
    data: ChecklistInstanceCreate
  ): Promise<ChecklistInstance> {
    const snakeData = {
      template_id: data.templateId,
      name: data.name,
    };
    const response = await api.post(
      `/performances/${performanceId}/checklists`,
      snakeData
    );
    return transformChecklistInstance(response.data);
  },

  /**
   * Обновить элемент чеклиста.
   */
  async updateChecklistItem(
    instanceId: string,
    itemIndex: number,
    data: ChecklistItemUpdate
  ): Promise<ChecklistInstance> {
    const snakeData = {
      is_checked: data.isChecked,
      comment: data.comment,
      photo_url: data.photoUrl,
    };
    const response = await api.patch(
      `/checklists/${instanceId}/item/${itemIndex}`,
      snakeData
    );
    return transformChecklistInstance(response.data);
  },

  // ===========================================================================
  // Cast & Crew
  // ===========================================================================

  /**
   * Получить каст и персонал.
   */
  async getCastCrew(performanceId: number): Promise<CastGroupedResponse> {
    const response = await api.get(`/performances/${performanceId}/cast`);
    return transformCastGrouped(response.data);
  },

  /**
   * Добавить участника.
   */
  async addCastMember(
    performanceId: number,
    data: CastMemberCreate
  ): Promise<PerformanceCastMember> {
    const snakeData = {
      user_id: data.userId,
      role_type: data.roleType,
      character_name: data.characterName,
      functional_role: data.functionalRole,
      is_understudy: data.isUnderstudy ?? false,
      notes: data.notes,
    };
    const response = await api.post(`/performances/${performanceId}/cast`, snakeData);
    return transformCastMember(response.data);
  },

  /**
   * Обновить участника.
   */
  async updateCastMember(
    performanceId: number,
    memberId: string,
    data: CastMemberUpdate
  ): Promise<PerformanceCastMember> {
    const snakeData: Record<string, unknown> = {};
    if (data.characterName !== undefined) snakeData.character_name = data.characterName;
    if (data.functionalRole !== undefined) snakeData.functional_role = data.functionalRole;
    if (data.isUnderstudy !== undefined) snakeData.is_understudy = data.isUnderstudy;
    if (data.notes !== undefined) snakeData.notes = data.notes;

    const response = await api.patch(
      `/performances/${performanceId}/cast/${memberId}`,
      snakeData
    );
    return transformCastMember(response.data);
  },

  /**
   * Удалить участника.
   */
  async removeCastMember(performanceId: number, memberId: string): Promise<void> {
    await api.delete(`/performances/${performanceId}/cast/${memberId}`);
  },
};

export default performanceHubService;
