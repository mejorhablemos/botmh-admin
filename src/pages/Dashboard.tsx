import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                MejorHablemos - Admin Panel
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Bienvenido, {user?.fullName || user?.username}
              </p>
            </div>
            <Button variant="secondary" onClick={logout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Handoffs Pendientes
            </h3>
            <p className="text-3xl font-bold text-blue-600">-</p>
            <p className="text-sm text-gray-500 mt-2">
              Esperando asignación
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              En Progreso
            </h3>
            <p className="text-3xl font-bold text-yellow-600">-</p>
            <p className="text-sm text-gray-500 mt-2">
              Siendo atendidos
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Resueltos Hoy
            </h3>
            <p className="text-3xl font-bold text-green-600">-</p>
            <p className="text-sm text-gray-500 mt-2">
              Casos completados
            </p>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Actividad Reciente
          </h2>
          <div className="text-gray-600 text-center py-8">
            <p>Dashboard en construcción...</p>
            <p className="text-sm mt-2">
              Próximamente: Lista de handoffs, sesiones activas, y más.
            </p>
          </div>
        </Card>

        {/* User Info */}
        <Card className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Información del Usuario
          </h2>
          <div className="space-y-2">
            <p><span className="font-medium">Nombre:</span> {user?.fullName}</p>
            <p><span className="font-medium">Usuario:</span> {user?.username}</p>
            <p><span className="font-medium">Email:</span> {user?.email}</p>
            <p><span className="font-medium">Rol:</span> {user?.role}</p>
            <p>
              <span className="font-medium">Estado:</span>{' '}
              <span className={user?.isActive ? 'text-green-600' : 'text-red-600'}>
                {user?.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
