import { useState } from 'react';
import { api, formatCurrency, formatDate, getCurrentMonth, getMonthOptions } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import Loading from '../components/Loading';

export default function Relatorios() {
  const { addToast } = useToast();
  const [tab, setTab] = useState<'mensal' | 'procedimento' | 'inadimplencia'>('mensal');
  const [mes, setMes] = useState(getCurrentMonth());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = (tipo: string, mesParam?: string) => {
    setLoading(true);
    const params = tipo === 'mensal' ? `?tipo=${tipo}&mes=${mesParam || mes}` : `?tipo=${tipo}`;
    api.get<any>(`/config/relatorios${params}`).then(data => setData(data)).catch(() => addToast('Erro ao carregar', 'error')).finally(() => setLoading(false));
  };

  const handleTabChange = (t: typeof tab) => {
    setTab(t);
    setData(null);
    fetchReport(t);
  };

  const exportPDF = () => {
    // Simple print-based PDF export
    window.print();
    addToast('Use Ctrl+P / Cmd+P para salvar como PDF');
  };

  const tabClass = (t: string) => `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-primary text-white' : 'bg-white border border-border hover:bg-gray-50'}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Relatorios</h1>
        <button onClick={exportPDF} className="px-4 py-2 bg-secondary text-white rounded-lg text-sm hover:bg-secondary-dark">Imprimir / PDF</button>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => handleTabChange('mensal')} className={tabClass('mensal')}>Mensal</button>
        <button onClick={() => handleTabChange('procedimento')} className={tabClass('procedimento')}>Por Procedimento</button>
        <button onClick={() => handleTabChange('inadimplencia')} className={tabClass('inadimplencia')}>Inadimplencia</button>
      </div>

      {tab === 'mensal' && (
        <div className="flex gap-3 mb-4">
          <select value={mes} onChange={e => { setMes(e.target.value); fetchReport('mensal', e.target.value); }} className="px-3 py-2 border border-border rounded-lg text-sm">
            {getMonthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}

      {loading ? <Loading /> : data && (
        <div className="print:p-0">
          {tab === 'mensal' && data.resumo && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                <div className="bg-white rounded-lg border border-border p-4 text-center">
                  <p className="text-xs text-text-light">Faturado</p>
                  <p className="text-lg font-bold">{formatCurrency(data.resumo.totalFaturado)}</p>
                </div>
                <div className="bg-white rounded-lg border border-border p-4 text-center">
                  <p className="text-xs text-text-light">Recebido</p>
                  <p className="text-lg font-bold text-secondary">{formatCurrency(data.resumo.totalRecebido)}</p>
                </div>
                <div className="bg-white rounded-lg border border-border p-4 text-center">
                  <p className="text-xs text-text-light">Devido ({data.percentual}%)</p>
                  <p className="text-lg font-bold text-danger">{formatCurrency(data.resumo.totalDevido)}</p>
                </div>
                <div className="bg-white rounded-lg border border-border p-4 text-center">
                  <p className="text-xs text-text-light">Pago</p>
                  <p className="text-lg font-bold text-secondary">{formatCurrency(data.resumo.totalPago)}</p>
                </div>
                <div className="bg-white rounded-lg border border-border p-4 text-center">
                  <p className="text-xs text-text-light">Pendente</p>
                  <p className="text-lg font-bold text-warning">{formatCurrency(data.resumo.saldoPendente)}</p>
                </div>
                <div className="bg-white rounded-lg border border-border p-4 text-center">
                  <p className="text-xs text-text-light">Atendimentos</p>
                  <p className="text-lg font-bold">{data.resumo.totalAtendimentos}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Data</th>
                      <th className="text-left px-4 py-3 font-medium">Paciente</th>
                      <th className="text-left px-4 py-3 font-medium">Procedimento</th>
                      <th className="text-right px-4 py-3 font-medium">Cobrado</th>
                      <th className="text-right px-4 py-3 font-medium">Recebido</th>
                      <th className="text-center px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.atendimentos?.map((a: any) => (
                      <tr key={a.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">{formatDate(a.data_atendimento)}</td>
                        <td className="px-4 py-3">{a.paciente_nome}</td>
                        <td className="px-4 py-3">{a.procedimento}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(a.valor_cobrado)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(a.valor_recebido)}</td>
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
              </div>
            </div>
          )}

          {tab === 'procedimento' && Array.isArray(data) && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Procedimento</th>
                    <th className="text-center px-4 py-3 font-medium">Quantidade</th>
                    <th className="text-right px-4 py-3 font-medium">Total Cobrado</th>
                    <th className="text-right px-4 py-3 font-medium">Total Recebido</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r: any) => (
                    <tr key={r.procedimento} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{r.procedimento}</td>
                      <td className="px-4 py-3 text-center">{r.quantidade}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(r.total_cobrado)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(r.total_recebido)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'inadimplencia' && Array.isArray(data) && (
            <div>
              <p className="text-sm text-text-light mb-3">{data.length} paciente(s) com pagamento pendente</p>
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Paciente</th>
                      <th className="text-left px-4 py-3 font-medium">Telefone</th>
                      <th className="text-left px-4 py-3 font-medium">Procedimento</th>
                      <th className="text-left px-4 py-3 font-medium">Data</th>
                      <th className="text-right px-4 py-3 font-medium">Cobrado</th>
                      <th className="text-right px-4 py-3 font-medium">Recebido</th>
                      <th className="text-right px-4 py-3 font-medium">Faltante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((a: any) => (
                      <tr key={a.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium">{a.paciente_nome}</td>
                        <td className="px-4 py-3 text-text-light">{a.paciente_telefone || '-'}</td>
                        <td className="px-4 py-3">{a.procedimento}</td>
                        <td className="px-4 py-3">{formatDate(a.data_atendimento)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(a.valor_cobrado)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(a.valor_recebido)}</td>
                        <td className="px-4 py-3 text-right font-medium text-danger">{formatCurrency(a.valor_cobrado - a.valor_recebido)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !data && <p className="text-center text-text-light py-8">Selecione um tipo de relatorio para visualizar</p>}
    </div>
  );
}
