const db = require('./database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const hash = (pw) => bcrypt.hashSync(pw, 10);

// Clear existing
db.exec('DELETE FROM configuracoes');
db.exec('DELETE FROM pagamentos');
db.exec('DELETE FROM atendimentos');
db.exec('DELETE FROM users');

const gabiId = uuidv4();
const joaoId = uuidv4();
const lucasId = uuidv4();

const insertUser = db.prepare('INSERT INTO users (id, nome, email, senha, perfil) VALUES (?,?,?,?,?)');
insertUser.run(gabiId, 'Gabrielle', 'gabi@email.com', hash('gabi123'), 'dentista');
insertUser.run(joaoId, 'Dr. João Guilherme', 'drjoao@email.com', hash('joao123'), 'proprietario');
insertUser.run(lucasId, 'Lucas', 'lucas@email.com', hash('lucas123'), 'admin');

// Default config
const insertConfig = db.prepare('INSERT INTO configuracoes (id, chave, valor) VALUES (?,?,?)');
insertConfig.run(uuidv4(), 'percentual_parceria', '25');
insertConfig.run(uuidv4(), 'procedimentos', JSON.stringify(['Limpeza','Restauração','Canal','Clareamento','Extração','Avaliação','Outros']));

// Sample atendimentos
const insertAtend = db.prepare(`INSERT INTO atendimentos (id, paciente_nome, paciente_cpf, paciente_telefone, procedimento, descricao, valor_cobrado, valor_recebido, data_atendimento, forma_pagamento, status_pagamento, indicado_implante, status_implante, criado_por) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

const sampleData = [
  ['Maria Silva', '123.456.789-00', '(44) 99999-1111', 'Limpeza', '', 150, 150, '2026-02-01', 'PIX', 'recebido', 0, 'pendente'],
  ['João Pereira', '234.567.890-11', '(44) 99999-2222', 'Restauração', 'Dente 16', 350, 350, '2026-02-03', 'Cartão Débito', 'recebido', 0, 'pendente'],
  ['Ana Costa', '345.678.901-22', '(44) 88888-3333', 'Canal', 'Dente 24', 800, 400, '2026-02-05', 'Parcelado', 'parcelando', 1, 'pendente'],
  ['Carlos Souza', '', '(44) 99999-4444', 'Avaliação', 'Paciente com dor', 100, 100, '2026-02-07', 'Dinheiro', 'recebido', 1, 'pendente'],
  ['Fernanda Lima', '567.890.123-44', '(44) 77777-5555', 'Clareamento', '', 600, 600, '2026-02-10', 'PIX', 'recebido', 0, 'pendente'],
  ['Roberto Santos', '', '(44) 99999-6666', 'Extração', 'Siso inferior', 450, 0, '2026-02-12', 'Cartão Crédito', 'pendente', 0, 'pendente'],
  ['Lucia Mendes', '789.012.345-66', '(44) 88888-7777', 'Restauração', '', 280, 280, '2026-01-15', 'PIX', 'recebido', 0, 'pendente'],
  ['Pedro Oliveira', '', '(44) 99999-8888', 'Limpeza', '', 150, 150, '2026-01-20', 'Dinheiro', 'recebido', 0, 'pendente'],
  ['Camila Rocha', '901.234.567-88', '(44) 77777-9999', 'Canal', 'Urgência', 900, 900, '2026-01-25', 'PIX', 'recebido', 1, 'agendado'],
  ['Marcos Alves', '', '(44) 66666-0000', 'Avaliação', '', 100, 100, '2025-12-10', 'Dinheiro', 'recebido', 0, 'pendente'],
  ['Julia Santos', '012.345.678-99', '(44) 55555-1111', 'Clareamento', '', 600, 600, '2025-12-15', 'Cartão Crédito', 'recebido', 0, 'pendente'],
  ['Thiago Costa', '', '', 'Restauração', 'Três dentes', 850, 850, '2025-11-20', 'PIX', 'recebido', 0, 'pendente'],
];

for (const d of sampleData) {
  insertAtend.run(uuidv4(), d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11], gabiId);
}

// Sample pagamento for January
const insertPag = db.prepare('INSERT INTO pagamentos (id, mes_referencia, valor_pago, data_pagamento, registrado_por) VALUES (?,?,?,?,?)');
insertPag.run(uuidv4(), '2026-01', 357.50, '2026-02-05', gabiId);

console.log('Seed completed successfully!');
console.log('Users created:');
console.log('  gabi@email.com / gabi123 (dentista)');
console.log('  drjoao@email.com / joao123 (proprietario)');
console.log('  lucas@email.com / lucas123 (admin)');
