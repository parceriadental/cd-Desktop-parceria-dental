import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navByRole: Record<string, NavItem[]> = {
  dentista: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Novo Atendimento', path: '/atendimentos/novo', icon: '➕' },
    { label: 'Historico', path: '/atendimentos', icon: '📋' },
    { label: 'Fechamento Mensal', path: '/fechamento', icon: '💰' },
  ],
  proprietario: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Extrato Detalhado', path: '/extrato', icon: '📄' },
    { label: 'Indicacoes Implante', path: '/implantes', icon: '🦷' },
    { label: 'Recebimentos', path: '/recebimentos', icon: '💵' },
  ],
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Atendimentos', path: '/atendimentos', icon: '📋' },
    { label: 'Pagamentos', path: '/pagamentos', icon: '💰' },
    { label: 'Relatorios', path: '/relatorios', icon: '📈' },
    { label: 'Configuracoes', path: '/configuracoes', icon: '⚙️' },
  ],
};

const roleLabels: Record<string, string> = {
  dentista: 'Dentista',
  proprietario: 'Proprietario',
  admin: 'Administrador',
};

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const navItems = navByRole[user.perfil] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1E3A5F] text-white transform transition-transform duration-200 ease-in-out flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#10B981] rounded-lg flex items-center justify-center font-bold text-sm">
              PD
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Parceria</h1>
              <p className="text-xs text-white/50">Dental</p>
            </div>
          </div>
          <button
            className="lg:hidden text-white/50 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
                  ${isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
              {user.nome.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.nome}</p>
              <p className="text-xs text-white/50">{roleLabels[user.perfil]}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors w-full px-3 py-2 rounded-lg hover:bg-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {navItems.find(item =>
                location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
              )?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="hidden sm:inline">Ola,</span>
            <span className="font-medium text-gray-700">{user.nome}</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
