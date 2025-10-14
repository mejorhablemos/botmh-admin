import { api } from './api';
import type {
  Session,
  ClinicalNote,
  CreateClinicalNoteRequest,
  SessionStats,
} from '../types/session';

/**
 * Session service
 * Handles all session-related API calls
 */
export const sessionService = {
  /**
   * Get list of all sessions
   */
  async getSessions(): Promise<Session[]> {
    const response = await api.get<Session[]>('/admin/sessions');
    return response.data;
  },

  /**
   * Get a single session by ID
   */
  async getSessionById(id: string): Promise<Session> {
    const response = await api.get<Session>(`/admin/sessions/${id}`);
    return response.data;
  },

  /**
   * Get clinical notes for a session
   */
  async getClinicalNotes(sessionId: string): Promise<ClinicalNote[]> {
    const response = await api.get<ClinicalNote[]>(`/admin/sessions/${sessionId}/notes`);
    return response.data;
  },

  /**
   * Add a clinical note to a session
   */
  async addClinicalNote(
    sessionId: string,
    data: CreateClinicalNoteRequest
  ): Promise<ClinicalNote> {
    const response = await api.post<ClinicalNote>(
      `/admin/sessions/${sessionId}/notes`,
      data
    );
    return response.data;
  },

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<SessionStats> {
    const response = await api.get<SessionStats>('/admin/sessions/stats');
    return response.data;
  },
};
