const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const bcrypt = require('bcryptjs');
const { authMiddleware, requirePerfil } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET all config
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM configuracoes').all();
  const config = {};
  rows.forEach(r => {
    try { config[r.chave] = JSON.parse(r.valor); } catch { config[r.chave] = r.valor; }
  });
  res.json(config);
});

// PUT update config (admin only)
router.put('/:chave', requirePerfil('admin'), (req, res) => {
  const { valor } = req.body;
  const existing = db.prepare('SELECT * FROM configuracoes WHERE chave = ?').get(req.params.chave);
  const valorStr = typeof valor === 'string' ? valor : JSON.stringify(valor);

  if (existing) {
    db.prepare('UPDATE configuracoes SET valor = ? WHERE chave = ?').run(valorStr, req.params.chave);
  } else {
    db.prepare('INSERT INTO configuracoes (id, chave, valor) VALUES (?,?,?)').run(uuidv4(), req.params.chave, valorStr);
  }

  res.json({ chave: req.params.chave, valor });
});

// GET users (admin only)
router.get('/users', requirePerfil('admin'), (req, res) => {
  const rows = db.prepare('SELECT id, nome, email, perfil, criado_em FROM users').all();
  res.json(rows);
});

// PUT update user (admin only)
router.put('/users/:id', requirePerfil('admin'), (req, res) => {
  const { nome, email, senha, perfil } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  if (nome) db.prepare('UPDATE users SET nome = ? WHERE id = ?').run(nome, req.params.id);
  if (email) db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, req.params.id);
  if (perfil) db.prepare('UPDATE users SET perfil = ? WHERE id = ?').run(perfil, req.params.id);
  if (senha) {
    const hash = bcrypt.hashSync(senha, 10);
    db.prepare('UPDATE users SET senha = ? WHERE id = ?').run(hash, req.params.id);
  }

  const updated = db.prepare('SELECT id, nome, email, perfil, criado_em FROM users WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// GET export all data (admin only)
router.get('/export', requirePerfil('admin'), (req, res) => {
  const users = db.prepare('SELECT id, nome, email, perfil, criado_em FROM users').all();
  const atendimentos = db.prepare('SELECT * FROM atendimentos').all();
  const pagamentos = db.prepare('SELECT * FROM pagamentos').all();
  const configuracoes = db.prepare('SELECT * FROM configuracoes').all();

  res.json({ users, atendimentos, pagamentos, configuracoes, exportadoEm: new Date().toISOString() });
});

// GET relatorios
router.get('/relatorios', requirePerfil('admin'), (req, res) => {
  const { tipo, mes } = req.query;

  if (tipo === 'mensal' && mes) {
    const atendimentos = db.prepare(`
      SELECT * FROM atendimentos WHERE strftime('%Y-%m', data_atendimento) = ? ORDER BY data_atendimento
    `).all(mes);
    const pagamentos = db.prepare('SELECT * FROM pagamentos WHERE mes_referencia = ?').all(mes);

    const configRow = db.prepare("SELECT valor FROM configuracoes WHERE chave = 'percentual_parceria'").get();
    const percentual = configRow ? parseFloat(configRow.valor) : 25;

    const totalFaturado = atendimentos.reduce((s, a) => s + a.valor_cobrado, 0);
    const totalRecebido = atendimentos.reduce((s, a) => s + a.valor_recebido, 0);
    const totalPago = pagamentos.reduce((s, p) => s + p.valor_pago, 0);

    return res.json({
      mes, atendimentos, pagamentos, percentual,
      resumo: {
        totalFaturado, totalRecebido,
        totalDevido: totalRecebido * (percentual / 100),
        totalPago,
        saldoPendente: (totalRecebido * (percentual / 100)) - totalPago,
        totalAtendimentos: atendimentos.length
      }
    });
  }

  if (tipo === 'procedimento') {
    const rows = db.prepare(`
      SELECT procedimento, COUNT(*) as quantidade,
        SUM(valor_cobrado) as total_cobrado,
        SUM(valor_recebido) as total_recebido
      FROM atendimentos GROUP BY procedimento ORDER BY total_cobrado DESC
    `).all();
    return res.json(rows);
  }

  if (tipo === 'inadimplencia') {
    const rows = db.prepare(`
      SELECT * FROM atendimentos WHERE status_pagamento IN ('pendente', 'parcelando') ORDER BY data_atendimento DESC
    `).all();
    return res.json(rows);
  }

  res.status(400).json({ error: 'Tipo de relatório inválido' });
});

module.exports = router;
