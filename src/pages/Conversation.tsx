import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
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

interface Session {
  id: string;
  phoneNumber: string;
  userName: string;
  state: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
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

export default function Conversation() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const handoffId = searchParams.get('handoffId');

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reassignment modal
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      '¿Estás seguro de marcar esta conversación como resuelta? El chat se cerrará.'
    );

    if (!confirmed) return;

    try {
      await api.post(`/admin/handoffs/${handoffId}/resolve`, {
        resolution: 'Conversación completada por el terapeuta',
      });

      window.location.href = '/requests'; // Redirect to requests page
    } catch (err: any) {
      console.error('Error resolving handoff:', err);
      setError(err.response?.data?.message || 'Error al resolver la conversación');
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

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900 mx-auto"></div>
            <p className="mt-4 text-secondary-600">Cargando conversación...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!session) {
    return (
      <MainLayout>
        <div className="p-8">
          <Card>
            <div className="text-center py-12">
              <p className="text-xl text-red-600">No se encontró la conversación</p>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-secondary-200 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-primary-900">{session.userName}</h2>
              <p className="text-sm text-secondary-600">{session.phoneNumber}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={loadSession}>
                🔄 Actualizar
              </Button>
              {handoffId && (
                <>
                  <Button variant="secondary" onClick={handleShowReassignModal}>
                    🔄 Reasignar
                  </Button>
                  <Button variant="primary" onClick={handleResolve}>
                    ✅ Resolver
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-secondary-50">
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

        {/* Message Input */}
        <div className="bg-white border-t border-secondary-200 p-4">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
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
    </MainLayout>
  );
}
