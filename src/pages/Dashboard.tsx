import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import MainLayout from '../components/layout/MainLayout';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-900">Dashboard</h1>
          <p className="text-secondary-600 mt-2">
            Bienvenido, {user?.name || user?.email}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-primary-800 mb-1 uppercase tracking-wide">
                  Handoffs Pendientes
                </h3>
                <p className="text-4xl font-bold text-primary-900 mt-2">-</p>
                <p className="text-sm text-primary-600 mt-2 font-medium">
                  Esperando asignación
                </p>
              </div>
              <div className="bg-primary-900 text-white p-3 rounded-card">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-yellow-800 mb-1 uppercase tracking-wide">
                  En Progreso
                </h3>
                <p className="text-4xl font-bold text-yellow-900 mt-2">-</p>
                <p className="text-sm text-yellow-600 mt-2 font-medium">
                  Siendo atendidos
                </p>
              </div>
              <div className="bg-yellow-600 text-white p-3 rounded-card">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-green-800 mb-1 uppercase tracking-wide">
                  Resueltos Hoy
                </h3>
                <p className="text-4xl font-bold text-green-900 mt-2">-</p>
                <p className="text-sm text-green-600 mt-2 font-medium">
                  Casos completados
                </p>
              </div>
              <div className="bg-green-600 text-white p-3 rounded-card">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <h2 className="text-xl font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Actividad Reciente
          </h2>
          <div className="text-secondary-600 text-center py-12 bg-secondary-50 rounded-card">
            <svg className="w-16 h-16 mx-auto text-secondary-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="font-semibold text-primary-900">Dashboard en construcción...</p>
            <p className="text-sm mt-2">
              Próximamente: Lista de handoffs, sesiones activas, y más.
            </p>
          </div>
        </Card>

        {/* User Info */}
        <Card className="mt-8">
          <h2 className="text-xl font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Información del Usuario
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-secondary-50 p-4 rounded-card">
              <p className="text-sm text-secondary-600 font-semibold mb-1">Nombre</p>
              <p className="text-primary-900 font-medium">{user?.fullName}</p>
            </div>
            <div className="bg-secondary-50 p-4 rounded-card">
              <p className="text-sm text-secondary-600 font-semibold mb-1">Usuario</p>
              <p className="text-primary-900 font-medium">{user?.username}</p>
            </div>
            <div className="bg-secondary-50 p-4 rounded-card">
              <p className="text-sm text-secondary-600 font-semibold mb-1">Email</p>
              <p className="text-primary-900 font-medium">{user?.email}</p>
            </div>
            <div className="bg-secondary-50 p-4 rounded-card">
              <p className="text-sm text-secondary-600 font-semibold mb-1">Rol</p>
              <p className="text-primary-900 font-medium">{user?.role}</p>
            </div>
            <div className="bg-secondary-50 p-4 rounded-card">
              <p className="text-sm text-secondary-600 font-semibold mb-1">Estado</p>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${user?.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <p className={`font-semibold ${user?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {user?.isActive ? 'Activo' : 'Inactivo'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
