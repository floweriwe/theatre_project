/**
 * Service for Document Templates API
 */

import api from './api';
import type {
  DocumentTemplate,
  TemplateListItem,
  TemplateCreateData,
  TemplateUpdateData,
  TemplateVariable,
  VariableCreateData,
  VariableUpdateData,
  TemplateType,
  GenerateDocumentRequest,
  GeneratedDocumentResponse,
  TemplateAutocompleteResponse,
  VariableValue,
} from '@/types/template';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

const BASE_URL = '/templates';
const GENERATION_URL = '/document-generation';

/**
 * Template CRUD operations
 */
export const templateService = {
  /**
   * Get list of templates with pagination and filtering
   */
  async getTemplates(params?: {
    skip?: number;
    limit?: number;
    template_type?: TemplateType;
    is_active?: boolean;
  }): Promise<PaginatedResponse<TemplateListItem>> {
    const searchParams = new URLSearchParams();

    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.template_type) searchParams.append('template_type', params.template_type);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

    const query = searchParams.toString();
    const url = query ? `${BASE_URL}?${query}` : BASE_URL;

    const response = await api.get<PaginatedResponse<TemplateListItem>>(url);
    return response.data;
  },

  /**
   * Get template by ID with variables
   */
  async getTemplate(id: number): Promise<DocumentTemplate> {
    const response = await api.get<DocumentTemplate>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Create new template
   */
  async createTemplate(data: TemplateCreateData, file: File): Promise<DocumentTemplate> {
    const formData = new FormData();
    formData.append('file', file);

    const searchParams = new URLSearchParams();
    searchParams.append('name', data.name);
    searchParams.append('code', data.code);
    searchParams.append('template_type', data.template_type);
    if (data.description) searchParams.append('description', data.description);
    if (data.default_output_format) searchParams.append('default_output_format', data.default_output_format);

    const response = await api.post<DocumentTemplate>(`${BASE_URL}?${searchParams.toString()}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Update template metadata
   */
  async updateTemplate(id: number, data: TemplateUpdateData): Promise<DocumentTemplate> {
    const response = await api.put<DocumentTemplate>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Update template file
   */
  async updateTemplateFile(id: number, file: File): Promise<DocumentTemplate> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.put<DocumentTemplate>(`${BASE_URL}/${id}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Delete template
   */
  async deleteTemplate(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // =========================================================================
  // Variable operations
  // =========================================================================

  /**
   * Get template variables
   */
  async getVariables(templateId: number): Promise<TemplateVariable[]> {
    const response = await api.get<TemplateVariable[]>(`${BASE_URL}/${templateId}/variables`);
    return response.data;
  },

  /**
   * Create variable
   */
  async createVariable(templateId: number, data: VariableCreateData): Promise<TemplateVariable> {
    const response = await api.post<TemplateVariable>(`${BASE_URL}/${templateId}/variables`, data);
    return response.data;
  },

  /**
   * Update variable
   */
  async updateVariable(
    templateId: number,
    variableId: number,
    data: VariableUpdateData
  ): Promise<TemplateVariable> {
    const response = await api.put<TemplateVariable>(
      `${BASE_URL}/${templateId}/variables/${variableId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete variable
   */
  async deleteVariable(templateId: number, variableId: number): Promise<void> {
    await api.delete(`${BASE_URL}/${templateId}/variables/${variableId}`);
  },

  /**
   * Reorder variables
   */
  async reorderVariables(templateId: number, variableIds: number[]): Promise<TemplateVariable[]> {
    const response = await api.put<TemplateVariable[]>(
      `${BASE_URL}/${templateId}/variables/reorder`,
      variableIds
    );
    return response.data;
  },
};

/**
 * Document generation operations
 */
export const documentGenerationService = {
  /**
   * Get autocomplete data for template
   */
  async getAutocomplete(
    templateId: number,
    performanceId?: number
  ): Promise<TemplateAutocompleteResponse> {
    const params = new URLSearchParams();
    if (performanceId) params.append('performance_id', performanceId.toString());

    const query = params.toString();
    const url = query
      ? `${GENERATION_URL}/templates/${templateId}/autocomplete?${query}`
      : `${GENERATION_URL}/templates/${templateId}/autocomplete`;

    const response = await api.get<TemplateAutocompleteResponse>(url);
    return response.data;
  },

  /**
   * Generate preview (returns blob)
   */
  async generatePreview(
    templateId: number,
    variables: VariableValue[],
    performanceId?: number
  ): Promise<Blob> {
    const response = await api.post(`${GENERATION_URL}/preview`, {
      template_id: templateId,
      performance_id: performanceId,
      variables,
    }, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Generate document
   */
  async generateDocument(request: GenerateDocumentRequest): Promise<GeneratedDocumentResponse> {
    const response = await api.post<GeneratedDocumentResponse>(`${GENERATION_URL}/generate`, request);
    return response.data;
  },

  /**
   * Quick generate for performance
   */
  async quickGenerateForPerformance(
    templateId: number,
    performanceId: number,
    outputFormat: 'docx' | 'pdf' = 'docx'
  ): Promise<GeneratedDocumentResponse> {
    const response = await api.post<GeneratedDocumentResponse>(
      `${GENERATION_URL}/templates/${templateId}/generate-for-performance/${performanceId}?output_format=${outputFormat}`,
      {}
    );
    return response.data;
  },
};
