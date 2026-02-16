import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import { formatCPF, formatPhone } from '../utils/format';

const PROCEDIMENTOS = ['Limpeza', 'Restauracao', 'Canal', 'Clareamento', 'Extracao', 'Avaliacao', 'Outros'];
const FORMAS_PAGAMENTO = ['Dinheiro', 'PIX', 'Cartao Debito', 'Cartao Credito', 'Parcelado'];

export default function NovoAtendimento() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    paciente_nome: '',
    paciente_cpf: '',
    paciente_telefone: '',
    procedimento: '',
    descricao: '',
    valor_cobrado: '',
    data_atendimento: new Date().toISOString().split('T')[0],
    forma_pagamento: '',
    status_pagamento: 'recebido',
    valor_recebido: '',
    indicado_implante: false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // auto-fill valor_recebido when status is recebido
      if (field === 'status_pagamento' && value === 'recebido') {
        next.valor_recebido = next.valor_cobrado;
      }
      if (field === 'status_pagamento' && value === 'pendente') {
        next.valor_recebido = '0';
      }
      if (field === 'valor_cobrado' && next.status_pagamento === 'recebido') {
        next.valor_recebido = value as string;
      }
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/atendimentos', {
        ...form,
        valor_cobrado: parseFloat(form.valor_cobrado) || 0,
        valor_recebido: parseFloat(form.valor_recebido) || 0,
      });
      addToast('Atendimento cadastrado com sucesso!');
      navigate('/historico');
    } catch {
      addToast('Erro ao cadastrar atendimento', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
  const labelClass = "block text-sm font-medium mb-1";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-6">Novo Atendimento</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 space-y-5">
        <div>
          <label className={labelClass}>Nome do Paciente *</label>
          <input type="text" value={form.paciente_nome} onChange={e => handleChange('paciente_nome', e.target.value)} className={inputClass} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>CPF</label>
            <input type="text" value={form.paciente_cpf} onChange={e => handleChange('paciente_cpf', formatCPF(e.target.value))} className={inputClass} maxLength={14} placeholder="000.000.000-00" />
          </div>
          <div>
            <label className={labelClass}>Telefone</label>
            <input type="text" value={form.paciente_telefone} onChange={e => handleChange('paciente_telefone', formatPhone(e.target.value))} className={inputClass} maxLength={15} placeholder="(00) 00000-0000" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Procedimento *</label>
          <select value={form.procedimento} onChange={e => handleChange('procedimento', e.target.value)} className={inputClass} required>
            <option value="">Selecione...</option>
            {PROCEDIMENTOS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Descricao adicional</label>
          <textarea value={form.descricao} onChange={e => handleChange('descricao', e.target.value)} className={inputClass} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Valor Cobrado (R$) *</label>
            <input type="number" step="0.01" min="0" value={form.valor_cobrado} onChange={e => handleChange('valor_cobrado', e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Data do Atendimento *</label>
            <input type="date" value={form.data_atendimento} onChange={e => handleChange('data_atendimento', e.target.value)} className={inputClass} required />
          </div>
        </div>
        <div>
          <label className={labelClass}>Forma de Pagamento *</label>
          <select value={form.forma_pagamento} onChange={e => handleChange('forma_pagamento', e.target.value)} className={inputClass} required>
            <option value="">Selecione...</option>
            {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status do Pagamento *</label>
          <div className="flex gap-6 mt-2">
            {(['recebido', 'pendente', 'parcelando'] as const).map(s => (
              <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="status" checked={form.status_pagamento === s} onChange={() => handleChange('status_pagamento', s)} className="accent-primary" />
                <span className="capitalize">{s}</span>
              </label>
            ))}
          </div>
        </div>
        {form.status_pagamento !== 'pendente' && (
          <div>
            <label className={labelClass}>Valor ja Recebido (R$)</label>
            <input type="number" step="0.01" min="0" value={form.valor_recebido} onChange={e => handleChange('valor_recebido', e.target.value)} className={inputClass} />
          </div>
        )}
        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.indicado_implante} onChange={e => handleChange('indicado_implante', e.target.checked)} className="accent-primary w-4 h-4" />
            <span>Indicar para implante (aparecera para o Dr. Joao)</span>
          </label>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar Atendimento'}
          </button>
        </div>
      </form>
    </div>
  );
}
