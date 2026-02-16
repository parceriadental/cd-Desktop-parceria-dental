import { useState, useEffect } from 'react';
import { api, formatCurrency, formatMonth } from '../utils/api';
import Loading from '../components/Loading';

interface Pagamento {
  id: string;
  mes_referencia: string;
  valor_pago: number;
  data_pagamento: string;
  registrado_por_nome: string;
}

export default function Recebimentos() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Pagamento[]>('/pagamentos').then(data => {
      setPagamentos(data);
    }).finally(() => setLoading(false));
  }, []);

  const total = pagamentos.reduce((s, p) => s + p.valor_pago, 0);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Historico de Recebimentos</h1>
      <div className="bg-white rounded-xl border border-border p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-light">Total recebido</span>
          <span className="text-xl font-bold text-secondary">{formatCurrency(total)}</span>
        </div>
      </div>
      {loading ? <Loading /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Data Pagamento</th>
                <th className="text-left px-4 py-3 font-medium">Referente a</th>
                <th className="text-right px-4 py-3 font-medium">Valor</th>
                <th className="text-left px-4 py-3 font-medium">Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{new Date(p.data_pagamento + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">{formatMonth(p.mes_referencia)}</td>
                  <td className="px-4 py-3 text-right font-medium text-secondary">{formatCurrency(p.valor_pago)}</td>
                  <td className="px-4 py-3 text-text-light">{p.registrado_por_nome}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagamentos.length === 0 && <p className="text-center text-text-light py-8 text-sm">Nenhum recebimento registrado</p>}
        </div>
      )}
    </div>
  );
}
