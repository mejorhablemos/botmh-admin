import { api } from './api';
import type {
  Handoff,
  HandoffListFilters,
  HandoffResponse,
  HandoffResolution,
  HandoffStats,
} from '../types/handoff';

/**
 * Handoff service
 * Handles all handoff-related API calls
 */
export const handoffService = {
  /**
   * Get list of handoffs with optional filters
   */
  async getHandoffs(filters?: HandoffListFilters): Promise<Handoff[]> {
    const response = await api.get<Handoff[]>('/admin/handoffs', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get a single handoff by ID
   */
  async getHandoffById(id: string): Promise<Handoff> {
    const response = await api.get<Handoff>(`/admin/handoffs/${id}`);
    return response.data;
  },

  /**
   * Respond to a handoff (send message to patient)
   */
  async respondToHandoff(id: string, data: HandoffResponse): Promise<Handoff> {
    const response = await api.post<Handoff>(`/admin/handoffs/${id}/respond`, data);
    return response.data;
  },

  /**
   * Resolve a handoff (mark as completed)
   */
  async resolveHandoff(id: string, data: HandoffResolution): Promise<Handoff> {
    const response = await api.post<Handoff>(`/admin/handoffs/${id}/resolve`, data);
    return response.data;
  },

  /**
   * Get handoff statistics
   */
  async getHandoffStats(): Promise<HandoffStats> {
    const response = await api.get<HandoffStats>('/admin/handoffs/stats');
    return response.data;
  },
};
