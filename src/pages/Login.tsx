import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/dashboard');
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Error al iniciar sesión. Verifica tus credenciales.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MejorHablemos</h1>
          <p className="text-gray-600 mt-2">Panel de Administración</p>
        </div>

        {/* Login Card */}
        <Card>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Usuario"
              type="text"
              placeholder="tu_usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              fullWidth
              autoComplete="username"
              autoFocus
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              fullWidth
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              fullWidth
            >
              Ingresar
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>¿Olvidaste tu contraseña?</p>
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Contacta al administrador
            </a>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>&copy; 2025 MejorHablemos. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
