import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { api, formatCurrency, formatDate, formatMonth } from '../utils/api';
import StatCard from '../components/StatCard';
import Loading from '../components/Loading';

interface DashboardData {
  mesAtual: {
    total_faturado: number;
    total_recebido: number;
    total_devido: number;
    total_pacientes: number;
  };
  percentual: number;
  grafico: { mes: string; faturado: number; recebido: number }[];
  totalPagoJoao: number;
  totalRecebidoHistorico: number;
  indicacoesPendentes: number;
  ultimosAtendimentos: any[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>('/atendimentos/dashboard').then((data) => {
      setData(data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!data || !user) return null;

  const chartData = data.grafico.map((g) => ({
    name: formatMonth(g.mes),
    Faturado: g.faturado,
    Recebido: g.recebido,
  }));

  // DENTISTA dashboard
  if (user.perfil === 'dentista') {
    return (
      <div>
        <h1 className="text-xl font-bold mb-6">Ola, {user.nome}! 👋</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Faturado (mes)" value={formatCurrency(data.mesAtual.total_faturado)} icon={<span className="text-lg">💰</span>} color="blue" />
          <StatCard title="Recebido (mes)" value={formatCurrency(data.mesAtual.total_recebido)} icon={<span className="text-lg">✅</span>} color="green" />
          <StatCard title="Devido ao Dr. Joao" value={formatCurrency(data.mesAtual.total_devido)} icon={<span className="text-lg">📋</span>} color="red" subtitle={`${data.percentual}% do recebido`} />
          <StatCard title="Pacientes (mes)" value={String(data.mesAtual.total_pacientes)} icon={<span className="text-lg">👥</span>} color="purple" />
        </div>
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h2 className="text-sm font-semibold mb-4">Faturamento - Ultimos 6 meses</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="Faturado" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recebido" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Ultimos Atendimentos</h2>
            <Link to="/historico" className="text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-3">
            {data.ultimosAtendimentos.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{a.paciente_nome}</p>
                  <p className="text-xs text-text-light">{a.procedimento} - {formatDate(a.data_atendimento)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(a.valor_cobrado)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    a.status_pagamento === 'recebido' ? 'bg-green-100 text-green-700' :
                    a.status_pagamento === 'pendente' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{a.status_pagamento}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // PROPRIETARIO dashboard
  if (user.perfil === 'proprietario') {
    const totalDevidoGeral = data.totalRecebidoHistorico * (data.percentual / 100);
    const saldoPendente = totalDevidoGeral - data.totalPagoJoao;
    return (
      <div>
        <h1 className="text-xl font-bold mb-6">Ola, {user.nome}! 👋</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="A Receber (mes)" value={formatCurrency(data.mesAtual.total_devido)} icon={<span className="text-lg">💰</span>} color="blue" subtitle={`${data.percentual}% do recebido`} />
          <StatCard title="Ja Recebido (total)" value={formatCurrency(data.totalPagoJoao)} icon={<span className="text-lg">✅</span>} color="green" />
          <StatCard title="Pacientes (mes)" value={String(data.mesAtual.total_pacientes)} icon={<span className="text-lg">👥</span>} color="purple" />
          <StatCard title="Indicacoes Implante" value={String(data.indicacoesPendentes)} icon={<span className="text-lg">🦷</span>} color="yellow" />
        </div>
        {saldoPendente > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-yellow-800">Saldo pendente total: {formatCurrency(saldoPendente)}</p>
          </div>
        )}
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h2 className="text-sm font-semibold mb-4">Receita ({data.percentual}%) - Ultimos 6 meses</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.map(d => ({ ...d, Receita: (d.Recebido * data.percentual / 100) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="Receita" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {data.ultimosAtendimentos.filter((a: any) => a.indicado_implante).length > 0 && (
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">🔔 Indicacoes de Implante Recentes</h2>
              <Link to="/indicacoes" className="text-xs text-primary hover:underline">Ver todas</Link>
            </div>
            <div className="space-y-2">
              {data.ultimosAtendimentos.filter((a: any) => a.indicado_implante).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{a.paciente_nome}</p>
                    <p className="text-xs text-text-light">{a.paciente_telefone}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    a.status_implante === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                    a.status_implante === 'agendado' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>{a.status_implante}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ADMIN dashboard
  const totalDevidoGeral = data.totalRecebidoHistorico * (data.percentual / 100);
  const saldoPendente = totalDevidoGeral - data.totalPagoJoao;
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Painel Administrativo</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard title="Faturado (mes)" value={formatCurrency(data.mesAtual.total_faturado)} icon={<span className="text-lg">💰</span>} color="blue" />
        <StatCard title="Recebido (mes)" value={formatCurrency(data.mesAtual.total_recebido)} icon={<span className="text-lg">✅</span>} color="green" />
        <StatCard title="Devido ao Dr. Joao (mes)" value={formatCurrency(data.mesAtual.total_devido)} icon={<span className="text-lg">📋</span>} color="red" />
        <StatCard title="Total Pago ao Dr. Joao" value={formatCurrency(data.totalPagoJoao)} icon={<span className="text-lg">💵</span>} color="green" />
        <StatCard title="Saldo Pendente" value={formatCurrency(saldoPendente)} icon={<span className="text-lg">⏳</span>} color={saldoPendente > 0 ? 'yellow' : 'green'} />
        <StatCard title="Pacientes (mes)" value={String(data.mesAtual.total_pacientes)} icon={<span className="text-lg">👥</span>} color="purple" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">Faturamento vs Recebido - 6 meses</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="Faturado" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recebido" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">Receita Dr. Joao ({data.percentual}%) - 6 meses</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.map(d => ({ ...d, Receita: (d.Recebido * data.percentual / 100) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="Receita" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
