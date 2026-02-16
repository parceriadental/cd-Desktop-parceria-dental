import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import Loading from '../components/Loading';

interface User {
  id: string; nome: string; email: string; perfil: string; criado_em: string;
}

export default function Configuracoes() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [percentual, setPercentual] = useState('25');
  const [procedimentos, setProcedimentos] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({ nome: '', email: '', senha: '', perfil: '' });
  const [newProc, setNewProc] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<Record<string, any>>('/config'),
      api.get<User[]>('/config/users'),
    ]).then(([configData, usersData]) => {
      setPercentual(String(configData.percentual_parceria || 25));
      setProcedimentos(configData.procedimentos || []);
      setUsers(usersData);
    }).finally(() => setLoading(false));
  }, []);

  const savePercentual = async () => {
    try {
      await api.put('/config/percentual_parceria', { valor: percentual });
      addToast('Percentual atualizado!');
    } catch { addToast('Erro', 'error'); }
  };

  const saveProcedimentos = async (procs: string[]) => {
    try {
      await api.put('/config/procedimentos', { valor: procs });
      setProcedimentos(procs);
      addToast('Procedimentos atualizados!');
    } catch { addToast('Erro', 'error'); }
  };

  const addProcedimento = () => {
    if (newProc.trim() && !procedimentos.includes(newProc.trim())) {
      saveProcedimentos([...procedimentos, newProc.trim()]);
      setNewProc('');
    }
  };

  const removeProcedimento = (p: string) => {
    saveProcedimentos(procedimentos.filter(x => x !== p));
  };

  const openEditUser = (u: User) => {
    setEditUser(u);
    setEditUserForm({ nome: u.nome, email: u.email, senha: '', perfil: u.perfil });
  };

  const saveUser = async () => {
    if (!editUser) return;
    try {
      const payload: any = { nome: editUserForm.nome, email: editUserForm.email, perfil: editUserForm.perfil };
      if (editUserForm.senha) payload.senha = editUserForm.senha;
      await api.put(`/config/users/${editUser.id}`, payload);
      addToast('Usuario atualizado!');
      setEditUser(null);
      const data = await api.get<User[]>('/config/users');
      setUsers(data);
    } catch { addToast('Erro', 'error'); }
  };

  const exportBackup = async () => {
    try {
      const data = await api.get<any>('/config/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `backup_${new Date().toISOString().split('T')[0]}.json`; a.click();
      URL.revokeObjectURL(url);
      addToast('Backup exportado!');
    } catch { addToast('Erro ao exportar', 'error'); }
  };

  if (loading) return <Loading />;

  const inputClass = "w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">Configuracoes</h1>

      {/* Percentual */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold mb-4">Percentual da Parceria</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-text-light mb-1">Percentual sobre valor recebido</label>
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="100" step="0.5" value={percentual} onChange={e => setPercentual(e.target.value)} className={inputClass} />
              <span className="text-lg font-bold">%</span>
            </div>
          </div>
          <button onClick={savePercentual} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-light">Salvar</button>
        </div>
      </div>

      {/* Procedimentos */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold mb-4">Procedimentos Disponiveis</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {procedimentos.map(p => (
            <span key={p} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
              {p}
              <button onClick={() => removeProcedimento(p)} className="text-text-light hover:text-danger ml-1">&times;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newProc} onChange={e => setNewProc(e.target.value)} onKeyDown={e => e.key === 'Enter' && addProcedimento()} placeholder="Novo procedimento" className={inputClass} />
          <button onClick={addProcedimento} className="px-4 py-2 bg-secondary text-white rounded-lg text-sm hover:bg-secondary-dark whitespace-nowrap">Adicionar</button>
        </div>
      </div>

      {/* Usuarios */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold mb-4">Usuarios</h2>
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{u.nome}</p>
                <p className="text-xs text-text-light">{u.email} - <span className="capitalize">{u.perfil}</span></p>
              </div>
              <button onClick={() => openEditUser(u)} className="text-xs text-primary hover:underline">Editar</button>
            </div>
          ))}
        </div>
      </div>

      {/* Backup */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold mb-4">Backup de Dados</h2>
        <p className="text-sm text-text-light mb-3">Exporte todos os dados do sistema em formato JSON.</p>
        <button onClick={exportBackup} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-light">Exportar Backup (JSON)</button>
      </div>

      {/* Edit User Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Editar Usuario" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input type="text" value={editUserForm.nome} onChange={e => setEditUserForm({...editUserForm, nome: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={editUserForm.email} onChange={e => setEditUserForm({...editUserForm, email: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nova Senha (deixe vazio para manter)</label>
            <input type="password" value={editUserForm.senha} onChange={e => setEditUserForm({...editUserForm, senha: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Perfil</label>
            <select value={editUserForm.perfil} onChange={e => setEditUserForm({...editUserForm, perfil: e.target.value})} className={inputClass}>
              <option value="dentista">Dentista</option>
              <option value="proprietario">Proprietario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <button onClick={saveUser} className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-light">Salvar</button>
        </div>
      </Modal>
    </div>
  );
}
