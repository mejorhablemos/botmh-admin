// Handoff types for the admin panel

export type HandoffStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
export type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface Handoff {
  id: string;
  sessionId: string;
  phoneNumber: string;
  userName: string | null;
  reason: string;
  urgencyLevel: UrgencyLevel;
  priority: number;
  message: string | null;
  context: string | null;
  status: HandoffStatus;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  createdAt: string;
  assignedAt: string | null;
  completedAt: string | null;
  metadata: Record<string, any>;
}

export interface HandoffListFilters {
  status?: HandoffStatus;
  urgencyLevel?: UrgencyLevel;
  assignedAgentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface HandoffResponse {
  response: string;
  internalNotes?: string;
}

export interface HandoffResolution {
  resolution: string;
  followUpRequired: boolean;
  followUpNotes?: string;
}

export interface HandoffStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  avgResponseTime: number; // in minutes
}
