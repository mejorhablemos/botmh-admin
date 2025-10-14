// Auth types for the admin panel

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string; // Backend returns 'name', not 'fullName'
  role: 'admin' | 'therapist' | 'supervisor'; // Lowercase to match backend
  status: string;
  permissions?: {
    handoffs?: string[];
    conversations?: string[];
    agents?: string[];
    reports?: string[];
  };
}

export interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
