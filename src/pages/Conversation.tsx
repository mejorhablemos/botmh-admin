import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { parsePhoneNumber, getCountries } from 'libphonenumber-js';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { api } from '../services/api';

interface Message {
  id: string;
  content: string;
  sender: 'USER' | 'BOT' | 'AGENT' | 'SYSTEM';
  direction: 'INBOUND' | 'OUTBOUND';
  timestamp: string;
  agentName?: string;
}

interface ClinicalNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface Session {
  id: string;
  phoneNumber: string;
  userName: string;
  state: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  clinicalNotes?: ClinicalNote[];
  metadata?: {
    location?: {
      country?: string;
      region?: string;
      city?: string;
      areaCode?: string;
    };
    email?: string;
  };
}

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  activeCases: number;
  maxCases: number;
  canReceiveCases: boolean;
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

export default function Conversation() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const handoffId = searchParams.get('handoffId');

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reassignment modal
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassigning, setReassigning] = useState(false);

  // AI Analysis
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSession();
      // Cargar análisis desde localStorage si existe
      loadCachedAnalysis();
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  // Smart auto-refresh: Only refresh if user is not typing
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(async () => {
      // Skip refresh if user is typing or sending a message
      if (isTyping || sending) {
        console.log('[Conversation] Skipping auto-refresh: user is typing or sending');
        return;
      }

      try {
        const response = await api.get(`/admin/sessions/${sessionId}`);

        if (response.data.success) {
          const newSession = response.data.data;

          // Only update if there are new messages (avoid unnecessary re-renders)
          if (session && newSession.messages.length > session.messages.length) {
            console.log('[Conversation] New messages detected, updating session');
            setSession(newSession);
          }
        }
      } catch (err) {
        console.error('[Conversation] Error in auto-refresh:', err);
        // Don't show error to user, just log it
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [sessionId, isTyping, sending, session]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCachedAnalysis = () => {
    if (!sessionId) return;

    try {
      const savedAnalysis = localStorage.getItem('aiAnalysisCache');
      if (savedAnalysis) {
        const parsed = JSON.parse(savedAnalysis);
        if (parsed[sessionId]) {
          setAiAnalysis(parsed[sessionId]);
          console.log('[Conversation] Análisis cargado desde cache:', sessionId);
        }
      }
    } catch (err) {
      console.error('[Conversation] Error loading cached analysis:', err);
    }
  };

  const saveCachedAnalysis = (analysis: AIAnalysis) => {
    if (!sessionId) return;

    try {
      const savedAnalysis = localStorage.getItem('aiAnalysisCache');
      const cache = savedAnalysis ? JSON.parse(savedAnalysis) : {};
      cache[sessionId] = analysis;
      localStorage.setItem('aiAnalysisCache', JSON.stringify(cache));
      console.log('[Conversation] Análisis guardado en cache:', sessionId);
    } catch (err) {
      console.error('[Conversation] Error saving cached analysis:', err);
    }
  };

  const loadSession = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/sessions/${sessionId}`);

      if (response.data.success) {
        setSession(response.data.data);
      }
    } catch (err: any) {
      console.error('Error loading session:', err);
      setError(err.response?.data?.message || 'Error al cargar la conversación');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !handoffId || !session) return;

    try {
      setSending(true);
      setError('');

      console.log('[DEBUG] Enviando respuesta:', {
        handoffId,
        message: message.trim(),
        phoneNumber: session.phoneNumber,
        sessionId: session.id,
        sessionCompleta: session,
      });

      await api.post(`/admin/handoffs/${handoffId}/respond`, {
        message: message.trim(),
        phoneNumber: session.phoneNumber,
        sessionId: session.id,
      });

      // Reload session to get new message
      await loadSession();
      setMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!handoffId) return;

    const confirmed = window.confirm(
      '¿Estás seguro de finalizar esta conversación? El chat se cerrará y se marcará como resuelto.'
    );

    if (!confirmed) return;

    try {
      await api.post(`/admin/handoffs/${handoffId}/resolve`, {
        resolution: 'Conversación completada por el terapeuta',
      });

      window.location.href = '/requests'; // Redirect to requests page
    } catch (err: any) {
      console.error('Error resolving handoff:', err);
      setError(err.response?.data?.message || 'Error al finalizar la conversación');
    }
  };

  const loadAgents = async () => {
    try {
      setLoadingAgents(true);
      const response = await api.get('/admin/agents');

      if (response.data.success) {
        setAgents(response.data.data);
      }
    } catch (err: any) {
      console.error('Error loading agents:', err);
      setError(err.response?.data?.message || 'Error al cargar agentes');
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleShowReassignModal = () => {
    setShowReassignModal(true);
    loadAgents();
  };

  const handleCloseReassignModal = () => {
    setShowReassignModal(false);
    setSelectedAgentId('');
    setReassignReason('');
  };

  const handleReassign = async () => {
    if (!handoffId || !selectedAgentId) return;

    try {
      setReassigning(true);
      setError('');

      await api.post(`/admin/handoffs/${handoffId}/reassign`, {
        newAgentId: selectedAgentId,
        reason: reassignReason.trim() || undefined,
      });

      alert('Caso reasignado exitosamente');
      handleCloseReassignModal();
      window.location.href = '/requests'; // Redirect to requests page
    } catch (err: any) {
      console.error('Error reassigning handoff:', err);
      setError(err.response?.data?.message || 'Error al reasignar el caso');
    } finally {
      setReassigning(false);
    }
  };

  const handleToggleAIAnalysis = async () => {
    // Si ya está visible, solo alternar visibilidad
    if (aiAnalysis) {
      setShowAIAnalysis(!showAIAnalysis);
      return;
    }

    // Cargar análisis si no existe
    if (!sessionId) return;

    try {
      setLoadingAnalysis(true);
      setShowAIAnalysis(true);

      const response = await api.get(`/admin/sessions/${sessionId}/analyze`);

      if (response.data.success) {
        const analysis = response.data.data;
        setAiAnalysis(analysis);
        // Guardar en caché
        saveCachedAnalysis(analysis);
      }
    } catch (err: any) {
      console.error('Error loading AI analysis:', err);
      setError(err.response?.data?.message || 'Error al cargar análisis de IA');
      setShowAIAnalysis(false);
    } finally {
      setLoadingAnalysis(false);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'NORMAL': return 'bg-blue-100 text-blue-800';
      case 'LOW': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Cargando conversación...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8">
        <Card>
          <div className="text-center py-12">
            <p className="text-xl text-red-600">No se encontró la conversación</p>
          </div>
        </Card>
      </div>
    );
  }

  // Formatear teléfono (e.g., +54 9 11 5754 6672)
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return phone;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('549')) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`;
    }
    return phone;
  };

  // Mapeo de códigos de país a nombres en español
  const countryNames: Record<string, string> = {
    'AR': 'Argentina',
    'US': 'Estados Unidos',
    'MX': 'México',
    'ES': 'España',
    'CO': 'Colombia',
    'CL': 'Chile',
    'PE': 'Perú',
    'VE': 'Venezuela',
    'EC': 'Ecuador',
    'UY': 'Uruguay',
    'PY': 'Paraguay',
    'BO': 'Bolivia',
    'BR': 'Brasil',
    'CR': 'Costa Rica',
    'PA': 'Panamá',
    'GT': 'Guatemala',
    'HN': 'Honduras',
    'SV': 'El Salvador',
    'NI': 'Nicaragua',
    'DO': 'República Dominicana',
    'CU': 'Cuba',
    'PR': 'Puerto Rico',
  };

  // Mapeo de códigos de área argentinos a provincias/ciudades
  const argentinaAreaCodes: Record<string, string> = {
    '11': 'Buenos Aires (CABA y GBA)',
    '221': 'La Plata, Buenos Aires',
    '223': 'Mar del Plata, Buenos Aires',
    '230': 'Bahía Blanca, Buenos Aires',
    '261': 'Mendoza',
    '291': 'Neuquén',
    '299': 'San Carlos de Bariloche, Río Negro',
    '341': 'Rosario, Santa Fe',
    '342': 'Santa Fe',
    '351': 'Córdoba',
    '358': 'Río Cuarto, Córdoba',
    '370': 'Formosa',
    '379': 'Corrientes',
    '381': 'San Miguel de Tucumán',
    '383': 'Santiago del Estero',
    '385': 'La Rioja',
    '387': 'Salta',
    '388': 'San Salvador de Jujuy',
    '2966': 'Río Gallegos, Santa Cruz',
    '2901': 'Ushuaia, Tierra del Fuego',
  };

  // Obtener ubicación por número de teléfono
  const getLocationByPhoneNumber = (phone: string): { country: string; region: string | null } | null => {
    if (!phone) return null;

    try {
      const phoneNumber = parsePhoneNumber(phone);

      if (!phoneNumber || !phoneNumber.country) {
        return null;
      }

      const countryCode = phoneNumber.country;
      const countryName = countryNames[countryCode] || countryCode;

      // Para Argentina, intentar detectar la provincia/ciudad por código de área
      if (countryCode === 'AR') {
        const nationalNumber = phoneNumber.nationalNumber.toString();

        // Buscar el código de área más largo que coincida
        let areaCode = '';
        let location = '';

        for (const [code, loc] of Object.entries(argentinaAreaCodes)) {
          if (nationalNumber.startsWith(code) && code.length > areaCode.length) {
            areaCode = code;
            location = loc;
          }
        }

        if (location) {
          return { country: countryName, region: location };
        }
      }

      return { country: countryName, region: null };
    } catch (error) {
      console.error('[Conversation] Error parsing phone number:', error);
      return null;
    }
  };

  return (
    <div className="h-screen flex flex-col">
        {/* Header - Información Completa del Paciente */}
        <div className="bg-white border-b border-secondary-200 p-4">
          <div className="flex justify-between items-start">
            {/* Información del Paciente */}
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-secondary-600 font-semibold">👤 Nombre:</span>
                  <span className="font-bold text-primary-900 text-base">{session.userName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-secondary-600 font-semibold">📱 Teléfono:</span>
                  <span className="font-medium text-primary-900">{formatPhoneNumber(session.phoneNumber)}</span>
                </div>
                {(() => {
                  const phoneLocation = getLocationByPhoneNumber(session.phoneNumber);
                  if (phoneLocation) {
                    return (
                      <div className="flex items-center gap-2">
                        <span className="text-secondary-600 font-semibold">🌍 País:</span>
                        <span className="font-medium text-primary-900">
                          {phoneLocation.country}
                          {phoneLocation.region && ` - ${phoneLocation.region}`}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
                {session.metadata?.location?.city && (
                  <div className="flex items-center gap-2">
                    <span className="text-secondary-600 font-semibold">📍 Ubicación por IP:</span>
                    <span className="font-medium text-primary-900">
                      {session.metadata.location.city}, {session.metadata.location.region}, {session.metadata.location.country}
                    </span>
                  </div>
                )}
                {session.metadata?.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-secondary-600 font-semibold">📧 Email:</span>
                    <span className="font-medium text-primary-900">{session.metadata.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleToggleAIAnalysis} disabled={loadingAnalysis}>
                {loadingAnalysis ? '⏳' : showAIAnalysis ? '🔽' : '🤖'} Análisis IA
              </Button>
              <Button variant="ghost" onClick={loadSession}>
                🔄 Actualizar
              </Button>
              {handoffId && (
                <>
                  <Button variant="secondary" onClick={handleShowReassignModal}>
                    🔄 Reasignar
                  </Button>
                  <Button variant="primary" onClick={handleResolve}>
                    ✅ Finalizar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-card">
            {error}
          </div>
        )}

        {/* Clinical Notes Section */}
        {session.clinicalNotes && session.clinicalNotes.length > 0 && (
          <div className="mx-4 mt-4 bg-blue-50 border border-blue-200 rounded-card p-4">
            <h3 className="text-sm font-bold text-primary-900 mb-3 flex items-center gap-2">
              📋 Historia Clínica ({session.clinicalNotes.length} {session.clinicalNotes.length === 1 ? 'nota' : 'notas'})
            </h3>
            <div className="space-y-3">
              {session.clinicalNotes.map((note) => (
                <div key={note.id} className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary-900">
                      👨‍⚕️ {note.authorName}
                    </span>
                    <span className="text-xs text-secondary-600">
                      {new Date(note.createdAt).toLocaleString('es-AR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-primary-900 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area - Chat + AI Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 bg-secondary-50 transition-all ${showAIAnalysis ? 'w-2/3' : 'w-full'}`}>
          <div className="max-w-4xl mx-auto space-y-4">
            {session.messages.map((msg) => {
              const isUser = msg.sender === 'USER';
              const isAgent = msg.sender === 'AGENT';
              const isBot = msg.sender === 'BOT';

              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-md ${isUser ? 'order-2' : 'order-1'}`}>
                    {/* Sender Label */}
                    <div className={`text-xs text-secondary-600 mb-1 ${isUser ? 'text-right' : 'text-left'}`}>
                      {isUser && '👤 Paciente'}
                      {isBot && '🤖 Bot'}
                      {isAgent && `👨‍⚕️ ${msg.agentName || 'Terapeuta'}`}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        isUser
                          ? 'bg-primary-900 text-white rounded-br-sm'
                          : isAgent
                          ? 'bg-green-100 text-primary-900 rounded-bl-sm border border-green-200'
                          : 'bg-white text-primary-900 rounded-bl-sm border border-secondary-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-2 ${isUser ? 'text-primary-200' : 'text-secondary-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* AI Analysis Sidebar */}
        {showAIAnalysis && aiAnalysis && (
          <div className="w-1/3 bg-white border-l border-secondary-200 overflow-y-auto p-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-card border border-blue-200">
              <h3 className="text-lg font-bold text-primary-900 mb-4 flex items-center gap-2">
                🤖 Análisis de IA
              </h3>

              {/* Summary */}
              <div className="mb-3">
                <p className="text-xs text-secondary-600 font-semibold mb-1">Resumen</p>
                <p className="text-sm text-primary-900">{aiAnalysis.summary}</p>
              </div>

              {/* Main Info Grid */}
              <div className="grid grid-cols-1 gap-3 mb-3">
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
                <div className="mb-3 bg-red-50 p-3 rounded-card border border-red-200">
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
                <div>
                  <p className="text-xs text-secondary-600 font-semibold mb-1">💡 Recomendaciones</p>
                  <ul className="list-disc list-inside space-y-1">
                    {aiAnalysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-primary-900">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-secondary-200 p-4">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);

                  // Mark user as typing
                  setIsTyping(true);

                  // Clear existing timeout
                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                  }

                  // Set user as not typing after 2 seconds of inactivity
                  typingTimeoutRef.current = setTimeout(() => {
                    setIsTyping(false);
                  }, 2000);
                }}
                placeholder="Escribe tu mensaje al paciente..."
                disabled={sending}
                fullWidth
                autoFocus
              />
              <Button
                type="submit"
                variant="primary"
                isLoading={sending}
                disabled={!message.trim() || sending}
              >
                📨 Enviar
              </Button>
            </div>
          </form>
        </div>

        {/* Reassignment Modal */}
        {showReassignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-primary-900 mb-4">
                  🔄 Reasignar Caso
                </h3>

                {loadingAgents ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900 mx-auto"></div>
                    <p className="mt-4 text-secondary-600">Cargando agentes...</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-primary-900 mb-2">
                        Seleccionar Terapeuta/Agente
                      </label>
                      <select
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">-- Selecciona un agente --</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name} ({agent.role}) - {agent.activeCases}/{agent.maxCases} casos
                            {agent.status === 'offline' && ' - ⚫ Offline'}
                            {agent.status === 'busy' && ' - 🔴 Ocupado'}
                            {!agent.canReceiveCases && ' - ⚠️ No disponible'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-primary-900 mb-2">
                        Razón de la reasignación (opcional)
                      </label>
                      <textarea
                        value={reassignReason}
                        onChange={(e) => setReassignReason(e.target.value)}
                        placeholder="Ej: Especialización requerida, cambio de turno, etc."
                        rows={3}
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {agents.length === 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
                        No hay agentes disponibles en este momento.
                      </div>
                    )}

                    <div className="flex justify-end gap-3">
                      <Button
                        variant="ghost"
                        onClick={handleCloseReassignModal}
                        disabled={reassigning}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleReassign}
                        disabled={!selectedAgentId || reassigning}
                        isLoading={reassigning}
                      >
                        🔄 Reasignar Caso
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}
    </div>
  );
}
