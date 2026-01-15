/**
 * API Ã‘ÂÃÂµÃ‘â‚¬ÃÂ²ÃÂ¸Ã‘Â ÃÂ¼ÃÂ¾ÃÂ´Ã‘Æ’ÃÂ»Ã‘Â Ã‘ÂÃÂ¿ÃÂµÃÂºÃ‘â€šÃÂ°ÃÂºÃÂ»ÃÂµÃÂ¹.
 */

import api from './api';
import type {
  Performance,
  PerformanceListItem,
  PerformanceSection,
  PerformanceStats,
  PaginatedPerformances,
  PerformanceFilters,
  PerformanceCreateRequest,
  PerformanceUpdateRequest,
  SectionCreateRequest,
  SectionUpdateRequest,
} from '@/types';

// =============================================================================
// Transformers
// =============================================================================

function transformSection(data: Record<string, unknown>): PerformanceSection {
  return {
    id: data.id as number,
    performanceId: data.performance_id as number,
    sectionType: data.section_type as PerformanceSection['sectionType'],
    title: data.title as string,
    content: data.content as string | null,
    responsibleId: data.responsible_id as number | null,
    data: data.data as Record<string, unknown> | null,
    sortOrder: data.sort_order as number,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function transformPerformance(data: Record<string, unknown>): Performance {
  return {
    id: data.id as number,
    title: data.title as string,
    subtitle: data.subtitle as string | null,
    description: data.description as string | null,
    author: data.author as string | null,
    director: data.director as string | null,
    composer: data.composer as string | null,
    choreographer: data.choreographer as string | null,
    genre: data.genre as string | null,
    ageRating: data.age_rating as string | null,
    durationMinutes: data.duration_minutes as number | null,
    intermissions: data.intermissions as number,
    premiereDate: data.premiere_date as string | null,
    status: data.status as Performance['status'],
    posterPath: data.poster_path as string | null,
    metadata: data.metadata as Record<string, unknown> | null,
    isActive: data.is_active as boolean,
    theaterId: data.theater_id as number | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    sections: data.sections 
      ? (data.sections as Record<string, unknown>[]).map(transformSection)
      : [],
  };
}

function transformPerformanceList(data: Record<string, unknown>): PerformanceListItem {
  return {
    id: data.id as number,
    title: data.title as string,
    subtitle: data.subtitle as string | null,
    author: data.author as string | null,
    director: data.director as string | null,
    genre: data.genre as string | null,
    ageRating: data.age_rating as string | null,
    durationMinutes: data.duration_minutes as number | null,
    status: data.status as PerformanceListItem['status'],
    premiereDate: data.premiere_date as string | null,
    posterPath: data.poster_path as string | null,
    isActive: data.is_active as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function transformStats(data: Record<string, unknown>): PerformanceStats {
  return {
    totalPerformances: data.total_performances as number,
    preparation: data.preparation as number,
    inRepertoire: data.in_repertoire as number,
    paused: data.paused as number,
    archived: data.archived as number,
    genres: (data.genres as Array<{ genre: string; count: number }>) || [],
  };
}

// =============================================================================
// API Service
// =============================================================================

export const performanceService = {
  // ===========================================================================
  // Performances
  // ===========================================================================
  
  /**
   * ÃÅ¸ÃÂ¾ÃÂ»Ã‘Æ’Ã‘â€¡ÃÂ¸Ã‘â€šÃ‘Å’ Ã‘ÂÃÂ¿ÃÂ¸Ã‘ÂÃÂ¾ÃÂº Ã‘ÂÃÂ¿ÃÂµÃÂºÃ‘â€šÃÂ°ÃÂºÃÂ»ÃÂµÃÂ¹.
   */
  async getPerformances(filters: PerformanceFilters = {}): Promise<PaginatedPerformances> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.genre) params.append('genre', filters.genre);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    
    const response = await api.get(`/performances?${params.toString()}`);
    const data = response.data;
    
    return {
      items: data.items.map(transformPerformanceList),
      total: data.total,
      page: data.page,
      limit: data.limit,
      pages: data.pages,
    };
  },
  
  /**
   * ÃÅ¸ÃÂ¾ÃÂ»Ã‘Æ’Ã‘â€¡ÃÂ¸Ã‘â€šÃ‘Å’ Ã‘â€šÃÂµÃÂºÃ‘Æ’Ã‘â€°ÃÂ¸ÃÂ¹ Ã‘â‚¬ÃÂµÃÂ¿ÃÂµÃ‘â‚¬Ã‘â€šÃ‘Æ’ÃÂ°Ã‘â‚¬.
   */
  async getRepertoire(): Promise<PerformanceListItem[]> {
    const response = await api.get('/performances/repertoire');
    return response.data.map(transformPerformanceList);
  },
  
  /**
   * ÃÅ¸ÃÂ¾ÃÂ»Ã‘Æ’Ã‘â€¡ÃÂ¸Ã‘â€šÃ‘Å’ Ã‘ÂÃÂ¿ÃÂµÃÂºÃ‘â€šÃÂ°ÃÂºÃÂ»Ã‘Å’ ÃÂ¿ÃÂ¾ ID.
   */
  async getPerformance(id: number): Promise<Performance> {
    const response = await api.get(`/performances/${id}`);
    return transformPerformance(response.data);
  },
  
  /**
   * ÃÂ¡ÃÂ¾ÃÂ·ÃÂ´ÃÂ°Ã‘â€šÃ‘Å’ Ã‘ÂÃÂ¿ÃÂµÃÂºÃ‘â€šÃÂ°ÃÂºÃÂ»Ã‘Å’.
   */
  async createPerformance(data: PerformanceCreateRequest): Promise<Performance> {
    const snakeData = {
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      author: data.author,
      director: data.director,
      composer: data.composer,
      choreographer: data.choreographer,
      genre: data.genre,
      age_rating: data.ageRating,
      duration_minutes: data.durationMinutes,
      intermissions: data.intermissions,
      premiere_date: data.premiereDate,
    };
    const response = await api.post('/performances', snakeData);
    return transformPerformance(response.data);
  },
  
  /**
   * ÃÅ¾ÃÂ±ÃÂ½ÃÂ¾ÃÂ²ÃÂ¸Ã‘â€šÃ‘Å’ Ã‘ÂÃÂ¿ÃÂµÃÂºÃ‘â€šÃÂ°ÃÂºÃÂ»Ã‘Å’.
   */
  async updatePerformance(id: number, data: PerformanceUpdateRequest): Promise<Performance> {
    const snakeData: Record<string, unknown> = {};
    if (data.title !== undefined) snakeData.title = data.title;
    if (data.subtitle !== undefined) snakeData.subtitle = data.subtitle;
    if (data.description !== undefined) snakeData.description = data.description;
    if (data.author !== undefined) snakeData.author = data.author;
    if (data.director !== undefined) snakeData.director = data.director;
    if (data.composer !== undefined) snakeData.composer = data.composer;
    if (data.choreographer !== undefined) snakeData.choreographer = data.choreographer;
    if (data.genre !== undefined) snakeData.genre = data.genre;
    if (data.ageRating !== undefined) snakeData.age_rating = data.ageRating;
    if (data.durationMinutes !== undefined) snakeData.duration_minutes = data.durationMinutes;
    if (data.intermissions !== undefined) snakeData.intermissions = data.intermissions;
    if (data.premiereDate !== undefined) snakeData.premiere_date = data.premiereDate;
    if (data.status !== undefined) snakeData.status = data.status;
    
    const response = await api.patch(`/performances/${id}`, snakeData);
    return transformPerformance(response.data);
  },
  
  /**
   * ÃÂ£ÃÂ´ÃÂ°ÃÂ»ÃÂ¸Ã‘â€šÃ‘Å’ Ã‘ÂÃÂ¿ÃÂµÃÂºÃ‘â€šÃÂ°ÃÂºÃÂ»Ã‘Å’.
   */
  async deletePerformance(id: number): Promise<void> {
    await api.delete(`/performances/${id}`);
  },
  
  // ===========================================================================
  // Status Actions
  // ===========================================================================
  
  /**
   * ÃÅ¸ÃÂµÃ‘â‚¬ÃÂµÃÂ²ÃÂµÃ‘ÂÃ‘â€šÃÂ¸ ÃÂ² Ã‘â‚¬ÃÂµÃÂ¿ÃÂµÃ‘â‚¬Ã‘â€šÃ‘Æ’ÃÂ°Ã‘â‚¬.
   */
  async toRepertoire(id: number): Promise<Performance> {
    const response = await api.post(`/performances/${id}/to-repertoire`);
    return transformPerformance(response.data);
  },
  
  /**
   * ÃÅ¸ÃÂ¾Ã‘ÂÃ‘â€šÃÂ°ÃÂ²ÃÂ¸Ã‘â€šÃ‘Å’ ÃÂ½ÃÂ° ÃÂ¿ÃÂ°Ã‘Æ’ÃÂ·Ã‘Æ’.
   */
  async pause(id: number): Promise<Performance> {
    const response = await api.post(`/performances/${id}/pause`);
    return transformPerformance(response.data);
  },
  
  /**
   * ÃÂÃ‘â‚¬Ã‘â€¦ÃÂ¸ÃÂ²ÃÂ¸Ã‘â‚¬ÃÂ¾ÃÂ²ÃÂ°Ã‘â€šÃ‘Å’.
   */
  async archive(id: number): Promise<Performance> {
    const response = await api.post(`/performances/${id}/archive`);
    return transformPerformance(response.data);
  },
  
  /**
   * Ãâ€™ÃÂ¾Ã‘ÂÃ‘ÂÃ‘â€šÃÂ°ÃÂ½ÃÂ¾ÃÂ²ÃÂ¸Ã‘â€šÃ‘Å’ ÃÂ¸ÃÂ· ÃÂ°Ã‘â‚¬Ã‘â€¦ÃÂ¸ÃÂ²ÃÂ°.
   */
  async restore(id: number): Promise<Performance> {
    const response = await api.post(`/performances/${id}/restore`);
    return transformPerformance(response.data);
  },
  
  // ===========================================================================
  // Poster
  // ===========================================================================
  
  /**
   * Ãâ€”ÃÂ°ÃÂ³Ã‘â‚¬Ã‘Æ’ÃÂ·ÃÂ¸Ã‘â€šÃ‘Å’ ÃÂ¿ÃÂ¾Ã‘ÂÃ‘â€šÃÂµÃ‘â‚¬.
   */
  async uploadPoster(id: number, file: File): Promise<Performance> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/performances/${id}/poster`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return transformPerformance(response.data);
  },
  
  // ===========================================================================
  // Sections
  // ===========================================================================
  
  /**
   * ÃÅ¸ÃÂ¾ÃÂ»Ã‘Æ’Ã‘â€¡ÃÂ¸Ã‘â€šÃ‘Å’ Ã‘â‚¬ÃÂ°ÃÂ·ÃÂ´ÃÂµÃÂ»Ã‘â€¹ ÃÂ¿ÃÂ°Ã‘ÂÃÂ¿ÃÂ¾Ã‘â‚¬Ã‘â€šÃÂ°.
   */
  async getSections(performanceId: number): Promise<PerformanceSection[]> {
    const response = await api.get(`/performances/${performanceId}/sections`);
    return response.data.map(transformSection);
  },
  
  /**
   * ÃÂ¡ÃÂ¾ÃÂ·ÃÂ´ÃÂ°Ã‘â€šÃ‘Å’ Ã‘â‚¬ÃÂ°ÃÂ·ÃÂ´ÃÂµÃÂ».
   */
  async createSection(performanceId: number, data: SectionCreateRequest): Promise<PerformanceSection> {
    const snakeData = {
      section_type: data.sectionType,
      title: data.title,
      content: data.content,
      responsible_id: data.responsibleId,
      sort_order: data.sortOrder,
    };
    const response = await api.post(`/performances/${performanceId}/sections`, snakeData);
    return transformSection(response.data);
  },
  
  /**
   * ÃÅ¾ÃÂ±ÃÂ½ÃÂ¾ÃÂ²ÃÂ¸Ã‘â€šÃ‘Å’ Ã‘â‚¬ÃÂ°ÃÂ·ÃÂ´ÃÂµÃÂ».
   */
  async updateSection(sectionId: number, data: SectionUpdateRequest): Promise<PerformanceSection> {
    const snakeData: Record<string, unknown> = {};
    if (data.title !== undefined) snakeData.title = data.title;
    if (data.content !== undefined) snakeData.content = data.content;
    if (data.responsibleId !== undefined) snakeData.responsible_id = data.responsibleId;
    if (data.sortOrder !== undefined) snakeData.sort_order = data.sortOrder;
    
    const response = await api.patch(`/performances/sections/${sectionId}`, snakeData);
    return transformSection(response.data);
  },
  
  /**
   * ÃÂ£ÃÂ´ÃÂ°ÃÂ»ÃÂ¸Ã‘â€šÃ‘Å’ Ã‘â‚¬ÃÂ°ÃÂ·ÃÂ´ÃÂµÃÂ».
   */
  async deleteSection(sectionId: number): Promise<void> {
    await api.delete(`/performances/sections/${sectionId}`);
  },
  
  // ===========================================================================
  // Stats
  // ===========================================================================
  
  /**
   * ÃÅ¸ÃÂ¾ÃÂ»Ã‘Æ’Ã‘â€¡ÃÂ¸Ã‘â€šÃ‘Å’ Ã‘ÂÃ‘â€šÃÂ°Ã‘â€šÃÂ¸Ã‘ÂÃ‘â€šÃÂ¸ÃÂºÃ‘Æ’ Ã‘ÂÃÂ¿ÃÂµÃÂºÃ‘â€šÃÂ°ÃÂºÃÂ»ÃÂµÃÂ¹.
   */
  async getStats(): Promise<PerformanceStats> {
    const response = await api.get('/performances/stats/');
    return transformStats(response.data);
  },
};

export default performanceService;
