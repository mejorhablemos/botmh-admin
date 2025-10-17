import { useState, useEffect, useRef } from 'react';
import Button from '../components/ui/Button';
import { api } from '../services/api';

interface Conversation {
  sessionId: string;
  phoneNumber: string;
  userName: string;
  state: 'ACTIVE' | 'WITH_AGENT' | 'WAITING_FOR_AGENT' | 'RESOLVED' | 'CLOSED' | 'PAUSED';
  stateDescription: string;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  durationMinutes: number;
}

interface Message {
  id: string;
  content: string;
  direction: 'INBOUND' | 'OUTBOUND';
  sender: 'USER' | 'BOT' | 'AGENT' | 'SYSTEM';
  agentName?: string;
  timestamp: string;
  metadata: Record<string, any>;
}

interface SessionInfo {
  id: string;
  phoneNumber: string;
  userName: string;
  state: string;
  stateDescription: string;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  createdAt: string;
  updatedAt: string;
  durationMinutes: number;
  messageCount: number;
  canIntervene: boolean;
  canSendMessages: boolean;
}

interface PatientProfile {
  location: {
    countryCode: string;
    countryName: string;
    city: string | null;
    shortDisplay: string;
    fullDisplay: string;
  } | null;
  hasClinicHistory: boolean;
}

export default function MyConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000); // Refrescar cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadMessages(selectedSessionId);
      const interval = setInterval(() => loadMessages(selectedSessionId), 5000); // Refrescar mensajes cada 5 segundos
      return () => clearInterval(interval);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await api.get('/admin/my-conversations?limit=50');

      if (response.data.success) {
        setConversations(response.data.data.conversations || []);
      }
    } catch (err: any) {
      console.error('[MyConversations] Error loading conversations:', err);
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      setLoadingMessages(true);
      const response = await api.get(`/admin/sessions/${sessionId}/messages`);

      if (response.data.success) {
        setMessages(response.data.data.messages || []);
        setSessionInfo(response.data.data.sessionInfo);
        setPatientProfile(response.data.data.patientProfile || null);
      }
    } catch (err: any) {
      console.error('[MyConversations] Error loading messages:', err);
      // Error silencioso, no se muestra al usuario
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setMessages([]);
    setSessionInfo(null);
    setPatientProfile(null);
  };

  const handleIntervene = async () => {
    if (!selectedSessionId) return;

    try {
      const response = await api.post(`/admin/sessions/${selectedSessionId}/intervene`);

      if (response.data.success) {
        // Recargar mensajes para obtener el estado actualizado
        await loadMessages(selectedSessionId);
        await loadConversations();
      }
    } catch (err: any) {
      console.error('[MyConversations] Error intervening:', err);
      alert(err.response?.data?.error || 'Error al tomar control de la conversación');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedSessionId) return;

    try {
      setSendingMessage(true);
      const response = await api.post(`/admin/sessions/${selectedSessionId}/send-message`, {
        message: messageInput.trim(),
      });

      if (response.data.success) {
        setMessageInput('');
        // Recargar mensajes inmediatamente
        await loadMessages(selectedSessionId);
      }
    } catch (err: any) {
      console.error('[MyConversations] Error sending message:', err);
      alert(err.response?.data?.error || 'Error al enviar el mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'WITH_AGENT': return 'bg-blue-100 text-blue-800';
      case 'WAITING_FOR_AGENT': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-purple-100 text-purple-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastMessage = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}h`;
    }
    const days = Math.floor(diffMins / 1440);
    return `${days}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-primary-900">Mis Conversaciones</h1>
        <p className="text-sm text-secondary-600">Conversaciones activas y asignadas</p>
      </div>

      {/* Main Content: Sidebar + Chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Conversation List */}
        <div className="w-96 bg-white border-r border-secondary-200 flex flex-col">
          {/* Search/Filter */}
          <div className="p-4 border-b border-secondary-200">
            <input
              type="text"
              placeholder="Buscar conversación..."
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-secondary-600">No tienes conversaciones</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.sessionId}
                  onClick={() => handleSelectConversation(conv.sessionId)}
                  className={`
                    p-4 border-b border-secondary-100 cursor-pointer hover:bg-secondary-50 transition
                    ${selectedSessionId === conv.sessionId ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''}
                  `}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-primary-900 truncate flex-1">
                      {conv.userName}
                    </h3>
                    <span className="text-xs text-secondary-500">
                      {formatLastMessage(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-600 mb-2">{conv.phoneNumber}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStateColor(conv.state)}`}>
                      {conv.stateDescription}
                    </span>
                    <span className="text-xs text-secondary-500">
                      {conv.messageCount} mensajes
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Chat View */}
        <div className="flex-1 flex flex-col bg-secondary-50">
          {!selectedSessionId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-20 h-20 mx-auto text-secondary-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-xl font-semibold text-secondary-700 mb-2">
                  Selecciona una conversación
                </h3>
                <p className="text-secondary-500">
                  Elige una conversación de la lista para ver los mensajes
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-secondary-200 px-6 py-4">
                {sessionInfo && (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-primary-900">
                        {sessionInfo.userName}
                      </h2>
                      <p className="text-sm text-secondary-600 mb-2">{sessionInfo.phoneNumber}</p>

                      {/* Patient Profile Info */}
                      <div className="flex items-center gap-2">
                        {patientProfile?.location && (
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {patientProfile.location.shortDisplay}
                          </span>
                        )}
                        {patientProfile?.hasClinicHistory ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Con historia clínica
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Sin historia clínica
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm px-3 py-1 rounded-full ${getStateColor(sessionInfo.state)}`}>
                        {sessionInfo.stateDescription}
                      </span>
                      {sessionInfo.canIntervene && (
                        <Button onClick={handleIntervene} variant="primary" size="sm">
                          Tomar Control
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-secondary-500">
                    No hay mensajes en esta conversación
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isInbound = msg.direction === 'INBOUND';
                    const isSystem = msg.sender === 'SYSTEM';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-full text-sm border border-yellow-200">
                            {msg.content}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-lg ${isInbound ? 'bg-white' : 'bg-primary-600 text-white'} rounded-lg px-4 py-3 shadow-sm`}>
                          {msg.sender === 'AGENT' && msg.agentName && (
                            <p className="text-xs font-semibold mb-1 opacity-75">
                              {msg.agentName}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isInbound ? 'text-secondary-500' : 'text-primary-100'}`}>
                            {formatTime(msg.timestamp)}
                            {msg.sender === 'BOT' && ' • Bot'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {sessionInfo?.canSendMessages ? (
                <div className="bg-white border-t border-secondary-200 px-6 py-4">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:border-primary-500"
                      disabled={sendingMessage}
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={sendingMessage || !messageInput.trim()}
                    >
                      {sendingMessage ? 'Enviando...' : 'Enviar'}
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-4 text-center">
                  <p className="text-sm text-yellow-800">
                    {sessionInfo?.canIntervene
                      ? 'Debes tomar control de la conversación para poder enviar mensajes'
                      : 'No puedes enviar mensajes en esta conversación'
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
