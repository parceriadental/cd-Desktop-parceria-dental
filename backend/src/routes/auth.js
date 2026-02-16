const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  if (!bcrypt.compareSync(senha, user.senha)) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = jwt.sign({ id: user.id, perfil: user.perfil, nome: user.nome }, SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil }
  });
});

module.exports = router;
