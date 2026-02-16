const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    perfil TEXT NOT NULL CHECK(perfil IN ('dentista','proprietario','admin')),
    criado_em TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS atendimentos (
    id TEXT PRIMARY KEY,
    paciente_nome TEXT NOT NULL,
    paciente_cpf TEXT,
    paciente_telefone TEXT,
    procedimento TEXT NOT NULL,
    descricao TEXT,
    valor_cobrado REAL NOT NULL DEFAULT 0,
    valor_recebido REAL NOT NULL DEFAULT 0,
    data_atendimento TEXT NOT NULL,
    forma_pagamento TEXT NOT NULL,
    status_pagamento TEXT NOT NULL CHECK(status_pagamento IN ('recebido','pendente','parcelando')),
    indicado_implante INTEGER NOT NULL DEFAULT 0,
    status_implante TEXT DEFAULT 'pendente' CHECK(status_implante IN ('pendente','agendado','realizado')),
    criado_por TEXT NOT NULL,
    criado_em TEXT DEFAULT (datetime('now')),
    atualizado_em TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (criado_por) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS pagamentos (
    id TEXT PRIMARY KEY,
    mes_referencia TEXT NOT NULL,
    valor_pago REAL NOT NULL,
    data_pagamento TEXT NOT NULL,
    registrado_por TEXT NOT NULL,
    criado_em TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (registrado_por) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS configuracoes (
    id TEXT PRIMARY KEY,
    chave TEXT UNIQUE NOT NULL,
    valor TEXT NOT NULL
  );
`);

module.exports = db;
