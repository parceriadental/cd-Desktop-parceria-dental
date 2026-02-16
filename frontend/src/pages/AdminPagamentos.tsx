import { useState, useEffect } from 'react';
import { api, formatCurrency, formatMonth, getCurrentMonth, getMonthOptions } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Loading from '../components/Loading';

interface Pagamento {
  id: string; mes_referencia: string; valor_pago: number; data_pagamento: string; registrado_por_nome: string;
}

export default function AdminPagamentos() {
  const { addToast } = useToast();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Pagamento | null>(null);
  const [form, setForm] = useState({ mes_referencia: getCurrentMonth(), valor_pago: '', data_pagamento: new Date().toISOString().split('T')[0] });

  const fetchData = () => {
    setLoading(true);
    api.get<Pagamento[]>('/pagamentos').then(data => setPagamentos(data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    try {
      await api.post('/pagamentos', { ...form, valor_pago: parseFloat(form.valor_pago) || 0 });
      addToast('Pagamento registrado!');
      setShowNew(false);
      setForm({ mes_referencia: getCurrentMonth(), valor_pago: '', data_pagamento: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch { addToast('Erro ao registrar', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/pagamentos/${deleteItem.id}`);
      addToast('Pagamento excluido!');
      setDeleteItem(null);
      fetchData();
    } catch { addToast('Erro ao excluir', 'error'); }
  };

  const total = pagamentos.reduce((s, p) => s + p.valor_pago, 0);
  const inputClass = "w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Gestao de Pagamentos</h1>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-light">Novo Pagamento</button>
      </div>
      <div className="bg-white rounded-xl border border-border p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-light">Total pago ao Dr. Joao</span>
          <span className="text-xl font-bold text-secondary">{formatCurrency(total)}</span>
        </div>
      </div>
      {loading ? <Loading /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-left px-4 py-3 font-medium">Referente a</th>
                <th className="text-right px-4 py-3 font-medium">Valor</th>
                <th className="text-left px-4 py-3 font-medium">Registrado por</th>
                <th className="text-center px-4 py-3 font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{new Date(p.data_pagamento + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">{formatMonth(p.mes_referencia)}</td>
                  <td className="px-4 py-3 text-right font-medium text-secondary">{formatCurrency(p.valor_pago)}</td>
                  <td className="px-4 py-3 text-text-light">{p.registrado_por_nome}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setDeleteItem(p)} className="text-danger text-xs">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagamentos.length === 0 && <p className="text-center text-text-light py-8 text-sm">Nenhum pagamento</p>}
        </div>
      )}

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Registrar Pagamento" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mes de Referencia</label>
            <select value={form.mes_referencia} onChange={e => setForm({...form, mes_referencia: e.target.value})} className={inputClass}>
              {getMonthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor (R$)</label>
            <input type="number" step="0.01" value={form.valor_pago} onChange={e => setForm({...form, valor_pago: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data do Pagamento</label>
            <input type="date" value={form.data_pagamento} onChange={e => setForm({...form, data_pagamento: e.target.value})} className={inputClass} />
          </div>
          <button onClick={handleCreate} className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-light">Registrar</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteItem} title="Excluir Pagamento" message="Excluir este pagamento?" onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} confirmText="Excluir" danger />
    </div>
  );
}
