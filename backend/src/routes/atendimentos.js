const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authMiddleware, requirePerfil } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET all - filtered by role
router.get('/', (req, res) => {
  const { mes, status_pagamento, procedimento } = req.query;
  let sql = 'SELECT * FROM atendimentos WHERE 1=1';
  const params = [];

  // dentista only sees own records
  if (req.userPerfil === 'dentista') {
    sql += ' AND criado_por = ?';
    params.push(req.userId);
  }

  if (mes) {
    sql += " AND strftime('%Y-%m', data_atendimento) = ?";
    params.push(mes);
  }
  if (status_pagamento) {
    sql += ' AND status_pagamento = ?';
    params.push(status_pagamento);
  }
  if (procedimento) {
    sql += ' AND procedimento = ?';
    params.push(procedimento);
  }

  sql += ' ORDER BY data_atendimento DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// GET dashboard stats
router.get('/dashboard', (req, res) => {
  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Get the dentista user id
  let dentistaFilter = '';
  const params = [];
  if (req.userPerfil === 'dentista') {
    dentistaFilter = ' AND criado_por = ?';
    params.push(req.userId);
  }

  // Current month stats
  const mesStats = db.prepare(`
    SELECT
      COALESCE(SUM(valor_cobrado), 0) as total_faturado,
      COALESCE(SUM(valor_recebido), 0) as total_recebido,
      COUNT(*) as total_pacientes
    FROM atendimentos
    WHERE strftime('%Y-%m', data_atendimento) = ?${dentistaFilter}
  `).get(mesAtual, ...params);

  // Get percentual
  const configRow = db.prepare("SELECT valor FROM configuracoes WHERE chave = 'percentual_parceria'").get();
  const percentual = configRow ? parseFloat(configRow.valor) : 25;

  // Last 6 months data
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const grafico = meses.map(m => {
    const row = db.prepare(`
      SELECT
        COALESCE(SUM(valor_cobrado), 0) as faturado,
        COALESCE(SUM(valor_recebido), 0) as recebido
      FROM atendimentos
      WHERE strftime('%Y-%m', data_atendimento) = ?${dentistaFilter}
    `).get(m, ...params);
    return { mes: m, ...row };
  });

  // Total pago ao Dr. João
  const totalPago = db.prepare('SELECT COALESCE(SUM(valor_pago), 0) as total FROM pagamentos').get();

  // Total historico recebido
  const totalRecebidoHist = db.prepare(`
    SELECT COALESCE(SUM(valor_recebido), 0) as total FROM atendimentos${dentistaFilter ? ' WHERE 1=1' + dentistaFilter : ''}
  `).get(...params);

  // Indicações de implante
  const indicacoes = db.prepare(`
    SELECT COUNT(*) as total FROM atendimentos WHERE indicado_implante = 1 AND status_implante = 'pendente'${dentistaFilter}
  `).get(...params);

  // Últimos atendimentos
  const ultimos = db.prepare(`
    SELECT * FROM atendimentos WHERE 1=1${dentistaFilter} ORDER BY data_atendimento DESC LIMIT 5
  `).all(...params);

  res.json({
    mesAtual: {
      ...mesStats,
      total_devido: mesStats.total_recebido * (percentual / 100)
    },
    percentual,
    grafico,
    totalPagoJoao: totalPago.total,
    totalRecebidoHistorico: totalRecebidoHist.total,
    indicacoesPendentes: indicacoes.total,
    ultimosAtendimentos: ultimos
  });
});

// GET fechamento mensal
router.get('/fechamento/:mes', (req, res) => {
  const { mes } = req.params;
  let dentistaFilter = '';
  const params = [mes];
  if (req.userPerfil === 'dentista') {
    dentistaFilter = ' AND criado_por = ?';
    params.push(req.userId);
  }

  const stats = db.prepare(`
    SELECT
      COALESCE(SUM(valor_cobrado), 0) as total_faturado,
      COALESCE(SUM(valor_recebido), 0) as total_recebido,
      COUNT(*) as total_atendimentos
    FROM atendimentos
    WHERE strftime('%Y-%m', data_atendimento) = ?${dentistaFilter}
  `).get(...params);

  const configRow = db.prepare("SELECT valor FROM configuracoes WHERE chave = 'percentual_parceria'").get();
  const percentual = configRow ? parseFloat(configRow.valor) : 25;

  const pagamentos = db.prepare('SELECT * FROM pagamentos WHERE mes_referencia = ?').all(mes);
  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor_pago, 0);

  res.json({
    mes,
    ...stats,
    percentual,
    total_devido: stats.total_recebido * (percentual / 100),
    total_pago: totalPago,
    saldo_pendente: (stats.total_recebido * (percentual / 100)) - totalPago,
    pagamentos
  });
});

// POST create
router.post('/', requirePerfil('dentista', 'admin'), (req, res) => {
  const { paciente_nome, paciente_cpf, paciente_telefone, procedimento, descricao, valor_cobrado, valor_recebido, data_atendimento, forma_pagamento, status_pagamento, indicado_implante } = req.body;

  if (!paciente_nome || !procedimento || valor_cobrado === undefined || !data_atendimento || !forma_pagamento || !status_pagamento) {
    return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO atendimentos (id, paciente_nome, paciente_cpf, paciente_telefone, procedimento, descricao, valor_cobrado, valor_recebido, data_atendimento, forma_pagamento, status_pagamento, indicado_implante, status_implante, criado_por)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, paciente_nome, paciente_cpf || '', paciente_telefone || '', procedimento, descricao || '', valor_cobrado, valor_recebido || 0, data_atendimento, forma_pagamento, status_pagamento, indicado_implante ? 1 : 0, 'pendente', req.userId);

  const created = db.prepare('SELECT * FROM atendimentos WHERE id = ?').get(id);
  res.status(201).json(created);
});

// PUT update
router.put('/:id', (req, res) => {
  const atend = db.prepare('SELECT * FROM atendimentos WHERE id = ?').get(req.params.id);
  if (!atend) return res.status(404).json({ error: 'Atendimento não encontrado' });

  if (req.userPerfil === 'dentista' && atend.criado_por !== req.userId) {
    return res.status(403).json({ error: 'Sem permissão' });
  }

  // proprietario can only update status_implante
  if (req.userPerfil === 'proprietario') {
    if (req.body.status_implante) {
      db.prepare('UPDATE atendimentos SET status_implante = ?, atualizado_em = datetime("now") WHERE id = ?')
        .run(req.body.status_implante, req.params.id);
      const updated = db.prepare('SELECT * FROM atendimentos WHERE id = ?').get(req.params.id);
      return res.json(updated);
    }
    return res.status(403).json({ error: 'Sem permissão para editar atendimentos' });
  }

  const fields = ['paciente_nome', 'paciente_cpf', 'paciente_telefone', 'procedimento', 'descricao', 'valor_cobrado', 'valor_recebido', 'data_atendimento', 'forma_pagamento', 'status_pagamento', 'indicado_implante', 'status_implante'];

  const updates = [];
  const values = [];

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      if (f === 'indicado_implante') {
        values.push(req.body[f] ? 1 : 0);
      } else {
        values.push(req.body[f]);
      }
    }
  }

  if (updates.length > 0) {
    updates.push('atualizado_em = datetime("now")');
    values.push(req.params.id);
    db.prepare(`UPDATE atendimentos SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  const updated = db.prepare('SELECT * FROM atendimentos WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE
router.delete('/:id', (req, res) => {
  const atend = db.prepare('SELECT * FROM atendimentos WHERE id = ?').get(req.params.id);
  if (!atend) return res.status(404).json({ error: 'Atendimento não encontrado' });

  if (req.userPerfil === 'dentista' && atend.criado_por !== req.userId) {
    return res.status(403).json({ error: 'Sem permissão' });
  }
  if (req.userPerfil === 'proprietario') {
    return res.status(403).json({ error: 'Sem permissão para excluir atendimentos' });
  }

  db.prepare('DELETE FROM atendimentos WHERE id = ?').run(req.params.id);
  res.json({ message: 'Excluído com sucesso' });
});

// GET indicações de implante
router.get('/indicacoes', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM atendimentos WHERE indicado_implante = 1 ORDER BY data_atendimento DESC
  `).all();
  res.json(rows);
});

module.exports = router;
