import { useState, useEffect } from 'react';
import { api, formatCurrency, formatDate, getMonthOptions } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Loading from '../components/Loading';

const PROCEDIMENTOS = ['Limpeza', 'Restauracao', 'Canal', 'Clareamento', 'Extracao', 'Avaliacao', 'Outros'];
interface Atendimento {
  id: string;
  paciente_nome: string;
  paciente_cpf: string;
  paciente_telefone: string;
  procedimento: string;
  descricao: string;
  valor_cobrado: number;
  valor_recebido: number;
  data_atendimento: string;
  forma_pagamento: string;
  status_pagamento: string;
  indicado_implante: number;
  status_implante: string;
}

export default function Historico() {
  const { addToast } = useToast();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [procFilter, setProcFilter] = useState('');
  const [editItem, setEditItem] = useState<Atendimento | null>(null);
  const [deleteItem, setDeleteItem] = useState<Atendimento | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (mes) params.set('mes', mes);
    if (statusFilter) params.set('status_pagamento', statusFilter);
    if (procFilter) params.set('procedimento', procFilter);
    api.get<Atendimento[]>(`/atendimentos?${params.toString()}`).then(data => {
      setAtendimentos(data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [mes, statusFilter, procFilter]);

  const openEdit = (item: Atendimento) => {
    setEditItem(item);
    setEditForm({
      paciente_nome: item.paciente_nome,
      paciente_cpf: item.paciente_cpf,
      paciente_telefone: item.paciente_telefone,
      procedimento: item.procedimento,
      descricao: item.descricao,
      valor_cobrado: item.valor_cobrado,
      valor_recebido: item.valor_recebido,
      data_atendimento: item.data_atendimento,
      forma_pagamento: item.forma_pagamento,
      status_pagamento: item.status_pagamento,
      indicado_implante: !!item.indicado_implante,
    });
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    try {
      await api.put(`/atendimentos/${editItem.id}`, {
        ...editForm,
        valor_cobrado: parseFloat(editForm.valor_cobrado) || 0,
        valor_recebido: parseFloat(editForm.valor_recebido) || 0,
      });
      addToast('Atendimento atualizado!');
      setEditItem(null);
      fetchData();
    } catch {
      addToast('Erro ao atualizar', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/atendimentos/${deleteItem.id}`);
      addToast('Atendimento excluido!');
      setDeleteItem(null);
      fetchData();
    } catch {
      addToast('Erro ao excluir', 'error');
    }
  };

  const inputClass = "w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Historico de Atendimentos</h1>
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3">
        <select value={mes} onChange={e => setMes(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">Todos os meses</option>
          {getMonthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">Todos os status</option>
          <option value="recebido">Recebido</option>
          <option value="pendente">Pendente</option>
          <option value="parcelando">Parcelando</option>
        </select>
        <select value={procFilter} onChange={e => setProcFilter(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">Todos os procedimentos</option>
          {PROCEDIMENTOS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
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
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-center px-4 py-3 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {atendimentos.map(a => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">{formatDate(a.data_atendimento)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{a.paciente_nome}</div>
                      {a.indicado_implante ? <span className="text-xs text-yellow-600">🦷 Indicado implante</span> : null}
                    </td>
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
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => openEdit(a)} className="text-primary hover:text-primary-light text-xs">Editar</button>
                        <button onClick={() => setDeleteItem(a)} className="text-danger hover:text-red-600 text-xs">Excluir</button>
                      </div>
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
                <div className="flex items-center justify-between text-sm">
                  <span>Cobrado: {formatCurrency(a.valor_cobrado)}</span>
                  <span>Recebido: {formatCurrency(a.valor_recebido)}</span>
                </div>
                {a.indicado_implante ? <p className="text-xs text-yellow-600 mt-1">🦷 Indicado para implante</p> : null}
                <div className="flex gap-3 mt-3 pt-3 border-t border-border">
                  <button onClick={() => openEdit(a)} className="text-primary text-xs font-medium">Editar</button>
                  <button onClick={() => setDeleteItem(a)} className="text-danger text-xs font-medium">Excluir</button>
                </div>
              </div>
            ))}
            {atendimentos.length === 0 && <p className="text-center text-text-light py-8 text-sm">Nenhum atendimento encontrado</p>}
          </div>
        </>
      )}

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar Atendimento" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome do Paciente</label>
            <input type="text" value={editForm.paciente_nome || ''} onChange={e => setEditForm({...editForm, paciente_nome: e.target.value})} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Valor Cobrado (R$)</label>
              <input type="number" step="0.01" value={editForm.valor_cobrado || ''} onChange={e => setEditForm({...editForm, valor_cobrado: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor Recebido (R$)</label>
              <input type="number" step="0.01" value={editForm.valor_recebido || ''} onChange={e => setEditForm({...editForm, valor_recebido: e.target.value})} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status do Pagamento</label>
            <select value={editForm.status_pagamento || ''} onChange={e => setEditForm({...editForm, status_pagamento: e.target.value})} className={inputClass}>
              <option value="recebido">Recebido</option>
              <option value="pendente">Pendente</option>
              <option value="parcelando">Parcelando</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Procedimento</label>
            <select value={editForm.procedimento || ''} onChange={e => setEditForm({...editForm, procedimento: e.target.value})} className={inputClass}>
              {PROCEDIMENTOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!editForm.indicado_implante} onChange={e => setEditForm({...editForm, indicado_implante: e.target.checked})} className="accent-primary w-4 h-4" />
              Indicar para implante
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditItem(null)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSaveEdit} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-light">Salvar</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteItem}
        title="Excluir Atendimento"
        message={`Deseja excluir o atendimento de ${deleteItem?.paciente_nome}? Esta acao nao pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        confirmText="Excluir"
        danger
      />
    </div>
  );
}
