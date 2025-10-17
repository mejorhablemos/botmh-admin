import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  name: string;
  path: string;
  icon: string;
  badge?: number;
}

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Solicitudes Pendientes', path: '/requests', icon: '🔔' },
    { name: 'Mis Conversaciones', path: '/conversations', icon: '💬' },
    { name: 'Historial', path: '/history', icon: '📋' },
  ];

  // Admin-only items
  if (user?.role === 'admin') {
    navItems.push(
      { name: 'Gestión de Usuarios', path: '/users', icon: '👥' },
      { name: 'Reportes', path: '/reports', icon: '📈' },
      { name: 'Departamentos IA', path: '/departments', icon: '🤖' }
    );
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-primary-900 text-white min-h-screen flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-primary-800">
        <div className="flex items-center gap-3">
          <img
            src="/Graficas/Logo MH Verde.jpg"
            alt="MejorHablemos Logo"
            className="w-10 h-10 object-contain rounded-lg"
          />
          <div>
            <h1 className="text-lg font-bold">MejorHablemos</h1>
            <p className="text-xs text-primary-200">Panel Admin</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-primary-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-700 rounded-full flex items-center justify-center text-lg font-bold">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.name}</p>
            <p className="text-xs text-primary-200 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
              ${isActive(item.path)
                ? 'bg-primary-700 text-white font-medium'
                : 'text-primary-100 hover:bg-primary-800 hover:text-white'
              }
            `}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="flex-1">{item.name}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-primary-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-primary-100 hover:bg-primary-800 hover:text-white transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
