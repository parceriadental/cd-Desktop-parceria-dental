import { useState, useEffect } from 'react';
import { api, formatCurrency, getCurrentMonth, getMonthOptions } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import Loading from '../components/Loading';

export default function Fechamento() {
  const { addToast } = useToast();
  const [mes, setMes] = useState(getCurrentMonth());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api.get(`/atendimentos/fechamento/${mes}`).then(data => {
      setData(data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [mes]);

  const handlePagar = async () => {
    if (!data) return;
    setPaying(true);
    try {
      await api.post('/pagamentos', {
        mes_referencia: mes,
        valor_pago: data.saldo_pendente,
        data_pagamento: new Date().toISOString().split('T')[0],
      });
      addToast('Pagamento registrado com sucesso!');
      fetchData();
    } catch {
      addToast('Erro ao registrar pagamento', 'error');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-6">Fechamento Mensal</h1>
      <div className="mb-4">
        <select value={mes} onChange={e => setMes(e.target.value)} className="px-3 py-2.5 border border-border rounded-lg text-sm">
          {getMonthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {loading ? <Loading /> : data && (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm text-text-light">Total Faturado</span>
              <span className="font-semibold">{formatCurrency(data.total_faturado)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm text-text-light">Total Recebido</span>
              <span className="font-semibold text-secondary">{formatCurrency(data.total_recebido)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm text-text-light">{data.percentual}% Devido ao Dr. Joao</span>
              <span className="font-semibold text-danger">{formatCurrency(data.total_devido)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm text-text-light">Ja Pago</span>
              <span className="font-semibold text-secondary">{formatCurrency(data.total_pago)}</span>
            </div>
            <div className="flex items-center justify-between py-3 bg-gray-50 rounded-lg px-4">
              <span className="text-sm font-medium">Saldo Pendente</span>
              <span className={`text-lg font-bold ${data.saldo_pendente > 0 ? 'text-danger' : 'text-secondary'}`}>
                {formatCurrency(data.saldo_pendente)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-text-light mb-4">
            <span>{data.total_atendimentos} atendimentos no periodo</span>
          </div>
          {data.pagamentos.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Pagamentos realizados</h3>
              {data.pagamentos.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                  <span className="text-text-light">{new Date(p.data_pagamento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  <span className="font-medium text-secondary">{formatCurrency(p.valor_pago)}</span>
                </div>
              ))}
            </div>
          )}
          {data.saldo_pendente > 0 && (
            <button
              onClick={handlePagar}
              disabled={paying}
              className="w-full bg-secondary text-white py-3 rounded-lg text-sm font-medium hover:bg-secondary-dark transition-colors disabled:opacity-50"
            >
              {paying ? 'Registrando...' : `Marcar como Pago (${formatCurrency(data.saldo_pendente)})`}
            </button>
          )}
          {data.saldo_pendente <= 0 && (
            <div className="text-center py-3 bg-green-50 rounded-lg">
              <span className="text-sm text-green-700 font-medium">✅ Tudo pago neste mes!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
