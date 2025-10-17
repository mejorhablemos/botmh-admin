/**
 * DASHBOARD PAGE
 *
 * Dashboard profesional con estadísticas en tiempo real del sistema.
 * Muestra métricas de sesiones, handoffs, departamentos y actividad.
 */

import { useEffect, useState } from 'react';
import { authService } from '../services/auth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

// ============================================================================
// TYPES
// ============================================================================

interface SessionStats {
  total: number;
  byState: {
    ACTIVE_BOT: number;
    WAITING_HANDOFF: number;
    ACTIVE_AGENT: number;
    CLOSED_RESOLVED: number;
    CLOSED_ABANDONED: number;
  };
  activeConversations: number;
  averageBotResponseTimeMinutes: number;
}

interface HandoffStats {
  total: number;
  byStatus: {
    PENDING: number;
    ASSIGNED: number;
    IN_PROGRESS: number;
    RESOLVED: number;
    CANCELLED: number;
  };
  averageWaitTimeMinutes: number;
  averageResolutionTimeMinutes: number;
  crisisRate: number;
}

interface DepartmentDistribution {
  departmentId: string;
  departmentName: string;
  count: number;
  percentage: number;
}

interface DailyActivity {
  date: string;
  sessions: number;
  handoffs: number;
}

interface DashboardStats {
  sessions: SessionStats;
  handoffs: HandoffStats;
  departmentDistribution: DepartmentDistribution[];
  dailyActivity: DailyActivity[];
  lastUpdated: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#10b981', // Green
  '#f59e0b', // Orange
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
];

// ============================================================================
// DASHBOARD COMPONENT
// ============================================================================

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch dashboard stats from API
   */
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:3000/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setStats(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Auto-refresh every 30 seconds
   */
  useEffect(() => {
    fetchStats();

    const interval = setInterval(() => {
      fetchStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  /**
   * Manual refresh
   */
  const handleRefresh = () => {
    fetchStats();
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const formatTime = (minutes: number): string => {
    if (minutes < 1) return '< 1m';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  };

  // ============================================================================
  // RENDER LOADING/ERROR STATES
  // ============================================================================

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // ============================================================================
  // PREPARE CHART DATA
  // ============================================================================

  // Session by state chart
  const sessionStateData = [
    { name: 'Bot Activo', value: stats.sessions.byState.ACTIVE_BOT, color: '#3b82f6' },
    { name: 'Esperando', value: stats.sessions.byState.WAITING_HANDOFF, color: '#f59e0b' },
    { name: 'Con Agente', value: stats.sessions.byState.ACTIVE_AGENT, color: '#10b981' },
    { name: 'Resueltas', value: stats.sessions.byState.CLOSED_RESOLVED, color: '#8b5cf6' },
    { name: 'Abandonadas', value: stats.sessions.byState.CLOSED_ABANDONED, color: '#ef4444' },
  ];

  // Handoff by status chart
  const handoffStatusData = [
    { name: 'Pendientes', value: stats.handoffs.byStatus.PENDING },
    { name: 'Asignados', value: stats.handoffs.byStatus.ASSIGNED },
    { name: 'En Progreso', value: stats.handoffs.byStatus.IN_PROGRESS },
    { name: 'Resueltos', value: stats.handoffs.byStatus.RESOLVED },
    { name: 'Cancelados', value: stats.handoffs.byStatus.CANCELLED },
  ];

  // Department distribution (top 5)
  const topDepartments = stats.departmentDistribution.slice(0, 5);

  // Daily activity
  const activityData = stats.dailyActivity.map(d => ({
    date: formatDate(d.date),
    Sesiones: d.sessions,
    Handoffs: d.handoffs,
  }));

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Última actualización: {new Date(stats.lastUpdated).toLocaleTimeString('es-AR')}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Sessions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Sesiones</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.sessions.total}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.sessions.activeConversations} activas
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Handoffs */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Handoffs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.handoffs.total}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.handoffs.byStatus.PENDING} pendientes
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Avg Bot Response Time */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Tiempo Respuesta Bot</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatTime(stats.sessions.averageBotResponseTimeMinutes)}
              </p>
              <p className="text-sm text-green-600 mt-1">Excelente</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Crisis Rate */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Tasa de Crisis</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.handoffs.crisisRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 mt-1">Handoffs urgentes</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Session States Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Sesiones</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sessionStateData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sessionStateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Handoff Status Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estados de Handoffs</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={handoffStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Distribution & Daily Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Department Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Departamentos</h2>
          {topDepartments.length > 0 ? (
            <div className="space-y-4">
              {topDepartments.map((dept, index) => (
                <div key={dept.departmentId} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{dept.departmentName}</span>
                      <span className="text-sm text-gray-600">{dept.count} ({dept.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${dept.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos de departamentos</p>
          )}
        </div>

        {/* Daily Activity Line Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad (últimos 7 días)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Sesiones" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="Handoffs" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avg Wait Time */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Tiempo de Espera Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(stats.handoffs.averageWaitTimeMinutes)}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Tiempo hasta asignación de agente</p>
        </div>

        {/* Avg Resolution Time */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Tiempo de Resolución</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(stats.handoffs.averageResolutionTimeMinutes)}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Tiempo hasta resolver handoff</p>
        </div>

        {/* Active Conversations */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Conversaciones Activas</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.sessions.activeConversations}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Bot + Agentes en tiempo real</p>
        </div>
      </div>
    </div>
  );
}
