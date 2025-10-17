import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { api } from '../services/api';
import { getAllDepartments, type Department } from '../services/departmentService';

interface HandoffRequest {
  id: string;
  userName: string;
  phoneNumber: string;
  reason: string;
  urgencyLevel: string;
  priority: string;
  message: string | null;
  status: string;
  createdAt: string;
  sessionId: string;
  metadata?: {
    departmentId?: string;
    departmentName?: string;
    routingReasoning?: string;
    routingConfidence?: string;
  };
}

interface AIAnalysis {
  summary: string;
  mainNeed: string;
  emotionalState: string;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestedPriority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  recommendations: string[];
  keyTopics: string[];
  riskFactors: string[];
}

export default function PendingRequests() {
  const navigate = useNavigate();

  // Requests state
  const [requests, setRequests] = useState<HandoffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Departments state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null); // null = "Todos"

  // Selection state
  const [selectedHandoffId, setSelectedHandoffId] = useState<string | null>(null);

  // AI Analysis state
  const [expandedAnalysis, setExpandedAnalysis] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [savingAsNote, setSavingAsNote] = useState(false);

  // Load departments and requests on mount
  useEffect(() => {
    console.log('[PendingRequests] Component mounted, loading data...');

    const init = async () => {
      try {
        // Load departments first (non-blocking)
        loadDepartments().catch((err) => {
          console.error('[PendingRequests] Department load error:', err);
        });

        // Load requests
        await loadRequests();
        console.log('[PendingRequests] Initial load complete');
      } catch (err) {
        console.error('[PendingRequests] Init error:', err);
      }
    };

    init();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('[PendingRequests] Auto-refresh triggered');
      loadRequests().catch(console.error);
    }, 30000);

    return () => {
      console.log('[PendingRequests] Component unmounting, clearing interval');
      clearInterval(interval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDepartments = async () => {
    try {
      const depts = await getAllDepartments();
      setDepartments(depts.filter(d => d.isActive)); // Solo departamentos activos
    } catch (err) {
      console.error('[PendingRequests] Error loading departments:', err);
      // No bloqueamos la carga si falla departamentos
      setDepartments([]);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/admin/handoffs');

      if (response.data.success) {
        let handoffs = [];

        if (Array.isArray(response.data.data)) {
          handoffs = response.data.data;
        } else if (response.data.data && typeof response.data.data === 'object') {
          if (Array.isArray(response.data.data.pending)) {
            handoffs = response.data.data.pending;
          }
          if (Array.isArray(response.data.data.inProgress)) {
            handoffs = [...handoffs, ...response.data.data.inProgress];
          }
        }

        setRequests(handoffs);
      } else {
        setError('El servidor retornó una respuesta inválida');
        setRequests([]);
      }
    } catch (err: any) {
      console.error('[PendingRequests] Error loading requests:', err);

      if (err.response?.status === 401) {
        setError('Sesión expirada. Por favor inicia sesión nuevamente.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(err.response?.data?.message || err.message || 'Error al cargar solicitudes');
      }

      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Get department name for a handoff
  const getDepartmentName = (handoff: HandoffRequest): string => {
    return handoff.metadata?.departmentName || 'Sin departamento';
  };

  // Get department color
  const getDepartmentColor = (handoff: HandoffRequest): string => {
    if (!handoff.metadata?.departmentId) {
      return 'bg-gray-100 text-gray-700';
    }

    // Simple hash-based color assignment
    const hash = handoff.metadata.departmentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
      'bg-teal-100 text-teal-700',
      'bg-cyan-100 text-cyan-700',
    ];

    return colors[hash % colors.length];
  };

  // Filter requests by selected department
  const filteredRequests = selectedDepartment
    ? requests.filter(r => r.metadata?.departmentId === selectedDepartment)
    : requests;

  // Get selected handoff
  const selectedHandoff = selectedHandoffId
    ? filteredRequests.find(r => r.id === selectedHandoffId)
    : null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'NORMAL': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '🔴 Urgente';
      case 'HIGH': return '🟠 Alta';
      case 'NORMAL': return '🔵 Normal';
      case 'LOW': return '⚪ Baja';
      default: return priority;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'CRISIS_DETECTED': return '🆘 Crisis Detectada';
      case 'USER_REQUESTED': return '🙋 Usuario Solicitó Ayuda';
      case 'BOT_LIMITATION': return '🤖 Limitación del Bot';
      case 'COMPLEX_INQUIRY': return '🧩 Consulta Compleja';
      case 'MULTIPLE_ATTEMPTS': return '🔄 Múltiples Intentos';
      case 'TECHNICAL_ISSUE': return '⚙️ Problema Técnico';
      case 'APPOINTMENT_REQUEST': return '📅 Solicitud de Cita';
      case 'PAYMENT_ISSUE': return '💳 Problema de Pago';
      case 'COMPLAINT': return '😠 Queja/Reclamo';
      case 'INTELLIGENT_ROUTING': return '🎯 Routing Inteligente';
      default: return reason.replace(/_/g, ' ');
    }
  };

  const formatWaitTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}min`;
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const getInitials = (name: string | undefined) => {
    if (!name || name.trim() === '') {
      return '??';
    }
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSelectHandoff = (handoffId: string) => {
    setSelectedHandoffId(handoffId);
    setExpandedAnalysis(false);
    setAiAnalysis(null);
  };

  const handleTakeRequest = (handoffId: string, sessionId: string) => {
    navigate(`/conversation/${sessionId}?handoffId=${handoffId}`);
  };

  const handleToggleAnalysis = async () => {
    if (!selectedHandoff) return;

    // Si ya está expandido, colapsar
    if (expandedAnalysis) {
      setExpandedAnalysis(false);
      return;
    }

    // Si ya tenemos el análisis en cache, solo expandir
    const cachedAnalysis = localStorage.getItem(`aiAnalysis_${selectedHandoff.sessionId}`);
    if (cachedAnalysis) {
      try {
        setAiAnalysis(JSON.parse(cachedAnalysis));
        setExpandedAnalysis(true);
        return;
      } catch (err) {
        console.error('[PendingRequests] Error parsing cached analysis');
      }
    }

    // Cargar análisis de IA
    try {
      setLoadingAnalysis(true);
      const response = await api.get(`/admin/sessions/${selectedHandoff.sessionId}/analyze`);

      if (response.data.success) {
        const analysis = response.data.data;
        setAiAnalysis(analysis);
        setExpandedAnalysis(true);

        // Guardar en localStorage
        localStorage.setItem(`aiAnalysis_${selectedHandoff.sessionId}`, JSON.stringify(analysis));
      }
    } catch (err: any) {
      console.error('Error loading AI analysis:', err);
      setError(err.response?.data?.message || 'Error al cargar análisis de IA');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleSaveAsNote = async () => {
    if (!selectedHandoff) return;

    try {
      setSavingAsNote(true);

      const response = await api.get(`/admin/sessions/${selectedHandoff.sessionId}/analyze?saveAsNote=true`);

      if (response.data.success) {
        alert('✅ Análisis guardado como nota clínica exitosamente');
      }
    } catch (err: any) {
      console.error('Error saving as note:', err);
      setError(err.response?.data?.message || 'Error al guardar como nota clínica');
    } finally {
      setSavingAsNote(false);
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-700 bg-red-100';
      case 'HIGH': return 'text-orange-700 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-700 bg-yellow-100';
      case 'LOW': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Solicitudes Pendientes</h1>
            <p className="text-sm text-secondary-600">Pacientes esperando atención de un terapeuta</p>
          </div>
          <Button onClick={loadRequests} variant="ghost" size="sm">
            🔄 Actualizar
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Main Content: Sidebar + Detail */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Handoffs List */}
        <div className="w-96 bg-white border-r border-secondary-200 flex flex-col">
          {/* Filter by Department */}
          <div className="p-4 border-b border-secondary-200">
            <label className="block text-xs font-medium text-secondary-700 mb-2">
              Filtrar por Departamento
            </label>
            <select
              value={selectedDepartment || ''}
              onChange={(e) => {
                setSelectedDepartment(e.target.value || null);
                setSelectedHandoffId(null); // Reset selection when filter changes
              }}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
            >
              <option value="">Todos los departamentos</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-secondary-500 mt-1">
              {filteredRequests.length} solicitud{filteredRequests.length !== 1 ? 'es' : ''}
            </p>
          </div>

          {/* Handoffs List */}
          <div className="flex-1 overflow-y-auto">
            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-secondary-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-secondary-600 font-medium">No hay solicitudes pendientes</p>
                <p className="text-sm text-secondary-500 mt-1">
                  {selectedDepartment ? 'Intenta con otro departamento' : 'Todos los pacientes están siendo atendidos'}
                </p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => handleSelectHandoff(request.id)}
                  className={`
                    p-4 border-b border-secondary-100 cursor-pointer hover:bg-secondary-50 transition
                    ${selectedHandoffId === request.id ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                      {getInitials(request.userName)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-primary-900 truncate">
                          {request.userName || 'Sin nombre'}
                        </h3>
                        <span className="text-xs text-secondary-500 flex-shrink-0 ml-2">
                          {formatWaitTime(request.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-secondary-600 mb-2">{request.phoneNumber || 'Sin teléfono'}</p>

                      {/* Department Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getDepartmentColor(request)}`}>
                          💼 {getDepartmentName(request)}
                        </span>
                      </div>

                      {/* Priority Badge */}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(request.priority)}`}>
                          {getPriorityLabel(request.priority)}
                        </span>
                        <span className="text-xs text-secondary-500">
                          {getReasonLabel(request.reason)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Detail View */}
        <div className="flex-1 flex flex-col bg-secondary-50">
          {!selectedHandoff ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-20 h-20 mx-auto text-secondary-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h3 className="text-xl font-semibold text-secondary-700 mb-2">
                  Selecciona una solicitud
                </h3>
                <p className="text-secondary-500">
                  Elige una solicitud de la lista para ver los detalles
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Detail Header */}
              <div className="bg-white border-b border-secondary-200 px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-primary-900 mb-1">
                      {selectedHandoff.userName || 'Sin nombre'}
                    </h2>
                    <p className="text-sm text-secondary-600 mb-2">{selectedHandoff.phoneNumber || 'Sin teléfono'}</p>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-full ${getDepartmentColor(selectedHandoff)}`}>
                        💼 {getDepartmentName(selectedHandoff)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(selectedHandoff.priority)}`}>
                        {getPriorityLabel(selectedHandoff.priority)}
                      </span>
                      <span className="text-xs text-secondary-600">
                        ⏱️ Esperando {formatWaitTime(selectedHandoff.createdAt)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => handleTakeRequest(selectedHandoff.id, selectedHandoff.sessionId)}
                  >
                    ✋ Atender Ahora
                  </Button>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Case Information */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-primary-900 mb-3">📋 Información del Caso</h3>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-secondary-600 font-semibold">Motivo</p>
                      <p className="text-sm text-primary-900">{getReasonLabel(selectedHandoff.reason)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-600 font-semibold">Urgencia</p>
                      <p className="text-sm text-primary-900 capitalize">{selectedHandoff.urgencyLevel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-600 font-semibold">Solicitado</p>
                      <p className="text-sm text-primary-900">
                        {new Date(selectedHandoff.createdAt).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-600 font-semibold">Estado</p>
                      <p className="text-sm text-primary-900 capitalize">{selectedHandoff.status}</p>
                    </div>
                  </div>

                  {selectedHandoff.message && (
                    <div className="bg-secondary-50 p-3 rounded-lg">
                      <p className="text-xs text-secondary-600 font-semibold mb-1">Mensaje del Paciente</p>
                      <p className="text-sm text-primary-900 italic">"{selectedHandoff.message}"</p>
                    </div>
                  )}

                  {/* Routing Information */}
                  {selectedHandoff.metadata?.routingReasoning && (
                    <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700 font-semibold mb-1">🎯 Razonamiento del Routing Inteligente</p>
                      <p className="text-sm text-blue-900">{selectedHandoff.metadata.routingReasoning}</p>
                      {selectedHandoff.metadata.routingConfidence && (
                        <p className="text-xs text-blue-600 mt-1">
                          Confianza: {selectedHandoff.metadata.routingConfidence}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Analysis Section */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleAnalysis}
                    disabled={loadingAnalysis}
                  >
                    {loadingAnalysis ? (
                      '⏳ Analizando...'
                    ) : expandedAnalysis ? (
                      '🔼 Ocultar Análisis IA'
                    ) : (
                      '🤖 Ver Análisis IA'
                    )}
                  </Button>

                  {/* AI Analysis Panel */}
                  {expandedAnalysis && aiAnalysis && (
                    <div className="mt-4 border-t border-secondary-200 pt-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-bold text-primary-900 mb-3 flex items-center gap-2">
                          🤖 Análisis de IA
                        </h4>

                        {/* Summary */}
                        <div className="mb-3">
                          <p className="text-xs text-secondary-600 font-semibold mb-1">Resumen</p>
                          <p className="text-sm text-primary-900">{aiAnalysis.summary}</p>
                        </div>

                        {/* Main Info Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-secondary-600 font-semibold mb-1">Necesidad Principal</p>
                            <p className="text-sm text-primary-900 font-medium">{aiAnalysis.mainNeed}</p>
                          </div>
                          <div>
                            <p className="text-xs text-secondary-600 font-semibold mb-1">Estado Emocional</p>
                            <p className="text-sm text-primary-900 font-medium">{aiAnalysis.emotionalState}</p>
                          </div>
                          <div>
                            <p className="text-xs text-secondary-600 font-semibold mb-1">Nivel de Urgencia IA</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getUrgencyColor(aiAnalysis.urgencyLevel)}`}>
                              {aiAnalysis.urgencyLevel}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-secondary-600 font-semibold mb-1">Prioridad Sugerida</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getPriorityColor(aiAnalysis.suggestedPriority)}`}>
                              {aiAnalysis.suggestedPriority}
                            </span>
                          </div>
                        </div>

                        {/* Key Topics */}
                        {aiAnalysis.keyTopics.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-secondary-600 font-semibold mb-1">Temas Clave</p>
                            <div className="flex flex-wrap gap-2">
                              {aiAnalysis.keyTopics.map((topic, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Risk Factors */}
                        {aiAnalysis.riskFactors.length > 0 && (
                          <div className="mb-3 bg-red-50 p-3 rounded-lg border border-red-200">
                            <p className="text-xs text-red-700 font-bold mb-1">⚠️ Factores de Riesgo</p>
                            <ul className="list-disc list-inside space-y-1">
                              {aiAnalysis.riskFactors.map((risk, idx) => (
                                <li key={idx} className="text-sm text-red-800">{risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommendations */}
                        {aiAnalysis.recommendations.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-secondary-600 font-semibold mb-1">💡 Recomendaciones para el Terapeuta</p>
                            <ul className="list-disc list-inside space-y-1">
                              {aiAnalysis.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-sm text-primary-900">{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Save as Note Button */}
                        <div className="border-t border-blue-200 pt-3 mt-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleSaveAsNote}
                            disabled={savingAsNote}
                          >
                            {savingAsNote ? (
                              '⏳ Guardando...'
                            ) : (
                              '📝 Guardar como Nota Clínica'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
