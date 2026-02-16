import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NovoAtendimento from './pages/NovoAtendimento';
import Historico from './pages/Historico';
import Fechamento from './pages/Fechamento';
import Extrato from './pages/Extrato';
import Indicacoes from './pages/Indicacoes';
import Recebimentos from './pages/Recebimentos';
import AdminAtendimentos from './pages/AdminAtendimentos';
import AdminPagamentos from './pages/AdminPagamentos';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import type { ReactNode } from 'react';

function PrivateRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A5F]" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.perfil)) return <Navigate to="/dashboard" replace />;

  return <Layout>{children}</Layout>;
}

function AtendimentosRouter() {
  const { user } = useAuth();
  if (user?.perfil === 'admin') return <AdminAtendimentos />;
  return <Historico />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

      <Route path="/atendimentos/novo" element={<PrivateRoute roles={['dentista', 'admin']}><NovoAtendimento /></PrivateRoute>} />
      <Route path="/fechamento" element={<PrivateRoute roles={['dentista', 'admin']}><Fechamento /></PrivateRoute>} />
      <Route path="/atendimentos" element={<PrivateRoute roles={['dentista', 'admin']}><AtendimentosRouter /></PrivateRoute>} />

      <Route path="/extrato" element={<PrivateRoute roles={['proprietario']}><Extrato /></PrivateRoute>} />
      <Route path="/implantes" element={<PrivateRoute roles={['proprietario', 'admin']}><Indicacoes /></PrivateRoute>} />
      <Route path="/recebimentos" element={<PrivateRoute roles={['proprietario']}><Recebimentos /></PrivateRoute>} />

      <Route path="/pagamentos" element={<PrivateRoute roles={['admin']}><AdminPagamentos /></PrivateRoute>} />
      <Route path="/relatorios" element={<PrivateRoute roles={['admin']}><Relatorios /></PrivateRoute>} />
      <Route path="/configuracoes" element={<PrivateRoute roles={['admin']}><Configuracoes /></PrivateRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
