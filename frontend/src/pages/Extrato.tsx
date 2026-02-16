import { useState, useEffect } from 'react';
import { api, formatCurrency, formatDate, getMonthOptions } from '../utils/api';
import Loading from '../components/Loading';

interface Atendimento {
  id: string;
  paciente_nome: string;
  procedimento: string;
  valor_cobrado: number;
  valor_recebido: number;
  data_atendimento: string;
  forma_pagamento: string;
  status_pagamento: string;
}

export default function Extrato() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState('');
  const [percentual, setPercentual] = useState(25);

  useEffect(() => {
    api.get<Record<string, any>>('/config').then(data => {
      setPercentual(parseFloat(data.percentual_parceria) || 25);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = mes ? `?mes=${mes}` : '';
    api.get<Atendimento[]>(`/atendimentos${params}`).then(data => {
      setAtendimentos(data);
    }).finally(() => setLoading(false));
  }, [mes]);

  const totalCobrado = atendimentos.reduce((s, a) => s + a.valor_cobrado, 0);
  const totalRecebido = atendimentos.reduce((s, a) => s + a.valor_recebido, 0);
  const totalDevido = totalRecebido * (percentual / 100);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Extrato Detalhado</h1>
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={mes} onChange={e => setMes(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">Todos os meses</option>
          {getMonthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-border p-4 text-center">
          <p className="text-xs text-text-light">Cobrado</p>
          <p className="text-lg font-bold">{formatCurrency(totalCobrado)}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4 text-center">
          <p className="text-xs text-text-light">Recebido</p>
          <p className="text-lg font-bold text-secondary">{formatCurrency(totalRecebido)}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4 text-center">
          <p className="text-xs text-text-light">{percentual}% (Sua parte)</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(totalDevido)}</p>
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Data</th>
                  <th className="text-left px-4 py-3 font-medium">Paciente</th>
                  <th className="text-left px-4 py-3 font-medium">Procedimento</th>
                  <th className="text-right px-4 py-3 font-medium">Cobrado</th>
                  <th className="text-right px-4 py-3 font-medium">Recebido</th>
                  <th className="text-right px-4 py-3 font-medium">{percentual}%</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {atendimentos.map(a => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">{formatDate(a.data_atendimento)}</td>
                    <td className="px-4 py-3 font-medium">{a.paciente_nome}</td>
                    <td className="px-4 py-3">{a.procedimento}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(a.valor_cobrado)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(a.valor_recebido)}</td>
                    <td className="px-4 py-3 text-right font-medium text-primary">{formatCurrency(a.valor_recebido * percentual / 100)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        a.status_pagamento === 'recebido' ? 'bg-green-100 text-green-700' :
                        a.status_pagamento === 'pendente' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{a.status_pagamento}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {atendimentos.length === 0 && <p className="text-center text-text-light py-8 text-sm">Nenhum atendimento encontrado</p>}
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {atendimentos.map(a => (
              <div key={a.id} className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{a.paciente_nome}</p>
                    <p className="text-xs text-text-light">{a.procedimento} - {formatDate(a.data_atendimento)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    a.status_pagamento === 'recebido' ? 'bg-green-100 text-green-700' :
                    a.status_pagamento === 'pendente' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{a.status_pagamento}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                  <div><span className="text-text-light">Cobrado:</span> <span className="font-medium">{formatCurrency(a.valor_cobrado)}</span></div>
                  <div><span className="text-text-light">Recebido:</span> <span className="font-medium">{formatCurrency(a.valor_recebido)}</span></div>
                  <div><span className="text-text-light">{percentual}%:</span> <span className="font-medium text-primary">{formatCurrency(a.valor_recebido * percentual / 100)}</span></div>
                </div>
              </div>
            ))}
            {atendimentos.length === 0 && <p className="text-center text-text-light py-8 text-sm">Nenhum atendimento</p>}
          </div>
        </>
      )}
    </div>
  );
}
