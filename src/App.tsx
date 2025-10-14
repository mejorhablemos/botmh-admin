import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PendingRequests from './pages/PendingRequests';
import Conversation from './pages/Conversation';

// Create QueryClient for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes (will add protection later) */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/requests" element={<PendingRequests />} />
            <Route path="/conversation/:sessionId" element={<Conversation />} />
            <Route path="/conversations" element={<PendingRequests />} />
            <Route path="/history" element={<Dashboard />} />
            <Route path="/users" element={<Dashboard />} />
            <Route path="/reports" element={<Dashboard />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
