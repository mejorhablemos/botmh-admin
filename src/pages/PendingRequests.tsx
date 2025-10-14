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

export default function PendingRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<HandoffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/handoffs');

      // Backend returns {success, data: [handoffs]}
      if (response.data.success) {
        setRequests(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error loading requests:', err);
      setError(err.response?.data?.message || 'Error al cargar solicitudes');
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
                    <div className="bg-secondary-50 p-3 rounded-card">
                      <p className="text-xs text-secondary-600 font-semibold mb-1">Mensaje del Paciente</p>
                      <p className="text-sm text-primary-900 italic">"{request.message}"</p>
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
