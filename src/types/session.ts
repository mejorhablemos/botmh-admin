// Session types for the admin panel

export type SessionStatus = 'ACTIVE_BOT' | 'WAITING_HANDOFF' | 'ACTIVE_AGENT' | 'CLOSED_RESOLVED' | 'CLOSED_ABANDONED';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  phoneNumber: string;
  userName: string | null;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messageCount: number;
  conversationHistory: Message[];
  metadata: Record<string, any>;
}

export interface ClinicalNote {
  id: string;
  sessionId: string;
  authorId: string;
  authorName: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClinicalNoteRequest {
  content: string;
  isPrivate: boolean;
}

export interface SessionStats {
  total: number;
  active: number;
  waitingHandoff: number;
  withAgent: number;
  closed: number;
}
