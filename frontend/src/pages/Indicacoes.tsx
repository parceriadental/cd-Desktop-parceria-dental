import { useState, useEffect } from 'react';
import { api, formatDate } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Loading from '../components/Loading';

interface Atendimento {
  id: string;
  paciente_nome: string;
  paciente_telefone: string;
  data_atendimento: string;
  procedimento: string;
  status_implante: string;
}

export default function Indicacoes() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [indicacoes, setIndicacoes] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchData = () => {
    setLoading(true);
    api.get<Atendimento[]>('/atendimentos/indicacoes').then(data => {
      setIndicacoes(data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/atendimentos/${id}`, { status_implante: status });
      addToast('Status atualizado!');
      fetchData();
    } catch {
      addToast('Erro ao atualizar', 'error');
    }
  };

  const filtered = filter ? indicacoes.filter(i => i.status_implante === filter) : indicacoes;
  const canEdit = user?.perfil === 'proprietario' || user?.perfil === 'admin';

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Indicacoes de Implante</h1>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter('')} className={`px-3 py-1.5 rounded-lg text-sm ${!filter ? 'bg-primary text-white' : 'bg-white border border-border'}`}>Todas ({indicacoes.length})</button>
        <button onClick={() => setFilter('pendente')} className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'pendente' ? 'bg-yellow-500 text-white' : 'bg-white border border-border'}`}>Pendentes</button>
        <button onClick={() => setFilter('agendado')} className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'agendado' ? 'bg-blue-500 text-white' : 'bg-white border border-border'}`}>Agendados</button>
        <button onClick={() => setFilter('realizado')} className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'realizado' ? 'bg-green-500 text-white' : 'bg-white border border-border'}`}>Realizados</button>
      </div>

      {loading ? <Loading /> : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{item.paciente_nome}</p>
                  <p className="text-sm text-text-light">{item.paciente_telefone || 'Sem telefone'}</p>
                  <p className="text-xs text-text-light mt-1">Atendimento: {formatDate(item.data_atendimento)} - {item.procedimento}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.status_implante === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                  item.status_implante === 'agendado' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>{item.status_implante}</span>
              </div>
              {canEdit && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  {item.status_implante !== 'pendente' && (
                    <button onClick={() => updateStatus(item.id, 'pendente')} className="text-xs px-3 py-1 rounded border border-yellow-300 text-yellow-700 hover:bg-yellow-50">Pendente</button>
                  )}
                  {item.status_implante !== 'agendado' && (
                    <button onClick={() => updateStatus(item.id, 'agendado')} className="text-xs px-3 py-1 rounded border border-blue-300 text-blue-700 hover:bg-blue-50">Agendar</button>
                  )}
                  {item.status_implante !== 'realizado' && (
                    <button onClick={() => updateStatus(item.id, 'realizado')} className="text-xs px-3 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50">Realizado</button>
                  )}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-text-light py-8 text-sm">Nenhuma indicacao encontrada</p>}
        </div>
      )}
    </div>
  );
}
