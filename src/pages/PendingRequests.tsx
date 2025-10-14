import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { api } from '../services/api';

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
  const [requests, setRequests] = useState<HandoffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, AIAnalysis>>({});
  const [loadingAnalysis, setLoadingAnalysis] = useState<Record<string, boolean>>({});
  const [savingAsNote, setSavingAsNote] = useState<Record<string, boolean>>({});

  // Cargar análisis guardados desde localStorage al montar el componente
  useEffect(() => {
    const savedAnalysis = localStorage.getItem('aiAnalysisCache');
    if (savedAnalysis) {
      try {
        const parsed = JSON.parse(savedAnalysis);
        setAiAnalysis(parsed);
        console.log('[PendingRequests] Análisis cargados desde cache:', Object.keys(parsed).length);
      } catch (err) {
        console.error('[PendingRequests] Error parsing cached analysis:', err);
      }
    }
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(''); // Limpiar errores previos

      console.log('[PendingRequests] Cargando handoffs desde:', api.defaults.baseURL);
      const response = await api.get('/admin/handoffs');
      console.log('[PendingRequests] Respuesta recibida:', response.data);
      console.log('[PendingRequests] Tipo de response.data.data:', typeof response.data.data);
      console.log('[PendingRequests] ¿Es array?:', Array.isArray(response.data.data));
      console.log('[PendingRequests] Estructura completa:', JSON.stringify(response.data.data, null, 2));

      // Backend returns {success, data: [handoffs]}
      if (response.data.success) {
        // El backend puede estar retornando {pending: [], inProgress: []} en lugar de un array directo
        let handoffs = [];

        if (Array.isArray(response.data.data)) {
          handoffs = response.data.data;
        } else if (response.data.data && typeof response.data.data === 'object') {
          // Si es un objeto con pending/inProgress
          if (Array.isArray(response.data.data.pending)) {
            handoffs = response.data.data.pending;
          }
          if (Array.isArray(response.data.data.inProgress)) {
            handoffs = [...handoffs, ...response.data.data.inProgress];
          }
        }

        setRequests(handoffs);
        console.log('[PendingRequests] Handoffs cargados:', handoffs.length);
      } else {
        setError('El servidor retornó una respuesta inválida');
        setRequests([]); // Asegurarse de que sea array vacío
      }
    } catch (err: any) {
      console.error('[PendingRequests] Error loading requests:', err);
      console.error('[PendingRequests] Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });

      if (err.response?.status === 401) {
        setError('Sesión expirada. Por favor inicia sesión nuevamente.');
        // Redirigir a login después de 2 segundos
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(err.response?.data?.message || err.message || 'Error al cargar solicitudes');
      }

      // Siempre asegurarse de que requests sea un array
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

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
      case 'CRISIS': return '🆘 Crisis';
      case 'COMPLEX_CASE': return '🧩 Caso Complejo';
      case 'EXPLICIT_REQUEST': return '🙋 Solicitó Ayuda';
      case 'BOT_LIMITATION': return '🤖 Limitación del Bot';
      case 'TECHNICAL_ISSUE': return '⚙️ Problema Técnico';
      default: return reason;
    }
  };

  const handleTakeRequest = (handoffId: string, sessionId: string) => {
    // Navigate to conversation page
    navigate(`/conversation/${sessionId}?handoffId=${handoffId}`);
  };

  const handleToggleAnalysis = async (sessionId: string) => {
    // Si ya está expandido, colapsar
    if (expandedAnalysis === sessionId) {
      setExpandedAnalysis(null);
      return;
    }

    // Si ya tenemos el análisis, solo expandir
    if (aiAnalysis[sessionId]) {
      setExpandedAnalysis(sessionId);
      return;
    }

    // Cargar análisis de IA
    try {
      setLoadingAnalysis({ ...loadingAnalysis, [sessionId]: true });
      const response = await api.get(`/admin/sessions/${sessionId}/analyze`);

      if (response.data.success) {
        // Actualizar estado con el nuevo análisis
        const newAnalysis = { ...aiAnalysis, [sessionId]: response.data.data };
        setAiAnalysis(newAnalysis);
        setExpandedAnalysis(sessionId);

        // Guardar en localStorage para persistencia
        localStorage.setItem('aiAnalysisCache', JSON.stringify(newAnalysis));
        console.log('[PendingRequests] Análisis guardado en cache:', sessionId);
      }
    } catch (err: any) {
      console.error('Error loading AI analysis:', err);
      setError(err.response?.data?.message || 'Error al cargar análisis de IA');
    } finally {
      setLoadingAnalysis({ ...loadingAnalysis, [sessionId]: false });
    }
  };

  const handleSaveAsNote = async (sessionId: string) => {
    try {
      setSavingAsNote({ ...savingAsNote, [sessionId]: true });

      // Llamar al endpoint con saveAsNote=true
      const response = await api.get(`/admin/sessions/${sessionId}/analyze?saveAsNote=true`);

      if (response.data.success) {
        // Mostrar mensaje de éxito
        alert('✅ Análisis guardado como nota clínica exitosamente');
        console.log('[PendingRequests] Análisis guardado como nota:', sessionId);
      }
    } catch (err: any) {
      console.error('Error saving as note:', err);
      setError(err.response?.data?.message || 'Error al guardar como nota clínica');
    } finally {
      setSavingAsNote({ ...savingAsNote, [sessionId]: false });
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
      <MainLayout>
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900 mx-auto"></div>
            <p className="mt-4 text-secondary-600">Cargando solicitudes...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary-900">Solicitudes Pendientes</h1>
            <p className="text-secondary-600 mt-2">
              Pacientes esperando atención de un terapeuta
            </p>
          </div>
          <Button onClick={loadRequests} variant="ghost">
            🔄 Actualizar
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-card">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && requests.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-secondary-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                ¡No hay solicitudes pendientes!
              </h3>
              <p className="text-secondary-600">
                Todos los pacientes están siendo atendidos o no hay nuevas solicitudes.
              </p>
            </div>
          </Card>
        )}

        {/* Requests List */}
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-4">
                {/* Request Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-primary-900">
                      {request.userName}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(request.priority)}`}>
                      {getPriorityLabel(request.priority)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-secondary-600 font-semibold">Teléfono</p>
                      <p className="text-sm text-primary-900">{request.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-600 font-semibold">Motivo</p>
                      <p className="text-sm text-primary-900">{getReasonLabel(request.reason)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-600 font-semibold">Urgencia</p>
                      <p className="text-sm text-primary-900 capitalize">{request.urgencyLevel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-600 font-semibold">Solicitado</p>
                      <p className="text-sm text-primary-900">
                        {new Date(request.createdAt).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>

                  {request.message && (
                    <div className="bg-secondary-50 p-3 rounded-card mb-3">
                      <p className="text-xs text-secondary-600 font-semibold mb-1">Mensaje del Paciente</p>
                      <p className="text-sm text-primary-900 italic">"{request.message}"</p>
                    </div>
                  )}

                  {/* AI Analysis Toggle Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleAnalysis(request.sessionId)}
                    disabled={loadingAnalysis[request.sessionId]}
                  >
                    {loadingAnalysis[request.sessionId] ? (
                      '⏳ Analizando...'
                    ) : expandedAnalysis === request.sessionId ? (
                      '🔼 Ocultar Análisis IA'
                    ) : (
                      '🤖 Ver Análisis IA'
                    )}
                  </Button>

                  {/* AI Analysis Panel */}
                  {expandedAnalysis === request.sessionId && aiAnalysis[request.sessionId] && (
                    <div className="mt-4 border-t border-secondary-200 pt-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-card border border-blue-200">
                        <h4 className="text-sm font-bold text-primary-900 mb-3 flex items-center gap-2">
                          🤖 Análisis de IA
                        </h4>

                        {/* Summary */}
                        <div className="mb-3">
                          <p className="text-xs text-secondary-600 font-semibold mb-1">Resumen</p>
                          <p className="text-sm text-primary-900">{aiAnalysis[request.sessionId].summary}</p>
                        </div>

                        {/* Main Info Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-secondary-600 font-semibold mb-1">Necesidad Principal</p>
                            <p className="text-sm text-primary-900 font-medium">{aiAnalysis[request.sessionId].mainNeed}</p>
                          </div>
                          <div>
                            <p className="text-xs text-secondary-600 font-semibold mb-1">Estado Emocional</p>
                            <p className="text-sm text-primary-900 font-medium">{aiAnalysis[request.sessionId].emotionalState}</p>
                          </div>
                          <div>
                            <p className="text-xs text-secondary-600 font-semibold mb-1">Nivel de Urgencia IA</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getUrgencyColor(aiAnalysis[request.sessionId].urgencyLevel)}`}>
                              {aiAnalysis[request.sessionId].urgencyLevel}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-secondary-600 font-semibold mb-1">Prioridad Sugerida</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getPriorityColor(aiAnalysis[request.sessionId].suggestedPriority)}`}>
                              {aiAnalysis[request.sessionId].suggestedPriority}
                            </span>
                          </div>
                        </div>

                        {/* Key Topics */}
                        {aiAnalysis[request.sessionId].keyTopics.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-secondary-600 font-semibold mb-1">Temas Clave</p>
                            <div className="flex flex-wrap gap-2">
                              {aiAnalysis[request.sessionId].keyTopics.map((topic, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Risk Factors */}
                        {aiAnalysis[request.sessionId].riskFactors.length > 0 && (
                          <div className="mb-3 bg-red-50 p-3 rounded-card border border-red-200">
                            <p className="text-xs text-red-700 font-bold mb-1">⚠️ Factores de Riesgo</p>
                            <ul className="list-disc list-inside space-y-1">
                              {aiAnalysis[request.sessionId].riskFactors.map((risk, idx) => (
                                <li key={idx} className="text-sm text-red-800">{risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommendations */}
                        {aiAnalysis[request.sessionId].recommendations.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-secondary-600 font-semibold mb-1">💡 Recomendaciones para el Terapeuta</p>
                            <ul className="list-disc list-inside space-y-1">
                              {aiAnalysis[request.sessionId].recommendations.map((rec, idx) => (
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
                            onClick={() => handleSaveAsNote(request.sessionId)}
                            disabled={savingAsNote[request.sessionId]}
                          >
                            {savingAsNote[request.sessionId] ? (
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

                {/* Action Button */}
                <div className="flex-shrink-0">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => handleTakeRequest(request.id, request.sessionId)}
                  >
                    ✋ Atender
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
