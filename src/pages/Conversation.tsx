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

    if (!message.trim() || !handoffId) return;

    try {
      setSending(true);
      setError('');

      await api.post(`/admin/handoffs/${handoffId}/respond`, {
        message: message.trim(),
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
                <Button variant="primary" onClick={handleResolve}>
                  ✅ Resolver
                </Button>
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
      </div>
    </MainLayout>
  );
}
