const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authMiddleware, requirePerfil } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET all pagamentos
router.get('/', (req, res) => {
  const { mes } = req.query;
  let sql = 'SELECT p.*, u.nome as registrado_por_nome FROM pagamentos p LEFT JOIN users u ON p.registrado_por = u.id';
  const params = [];

  if (mes) {
    sql += ' WHERE mes_referencia = ?';
    params.push(mes);
  }

  sql += ' ORDER BY data_pagamento DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// POST create pagamento
router.post('/', requirePerfil('dentista', 'admin'), (req, res) => {
  const { mes_referencia, valor_pago, data_pagamento } = req.body;

  if (!mes_referencia || !valor_pago || !data_pagamento) {
    return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
  }

  const id = uuidv4();
  db.prepare('INSERT INTO pagamentos (id, mes_referencia, valor_pago, data_pagamento, registrado_por) VALUES (?,?,?,?,?)')
    .run(id, mes_referencia, valor_pago, data_pagamento, req.userId);

  const created = db.prepare('SELECT p.*, u.nome as registrado_por_nome FROM pagamentos p LEFT JOIN users u ON p.registrado_por = u.id WHERE p.id = ?').get(id);
  res.status(201).json(created);
});

// DELETE pagamento (admin only)
router.delete('/:id', requirePerfil('admin'), (req, res) => {
  db.prepare('DELETE FROM pagamentos WHERE id = ?').run(req.params.id);
  res.json({ message: 'Excluído com sucesso' });
});

module.exports = router;
