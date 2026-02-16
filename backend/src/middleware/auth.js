const jwt = require('jsonwebtoken');
const SECRET = 'parceria-dental-secret-key-2026';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Token mal formatado' });

  try {
    const decoded = jwt.verify(parts[1], SECRET);
    req.userId = decoded.id;
    req.userPerfil = decoded.perfil;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function requirePerfil(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.userPerfil)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    next();
  };
}

module.exports = { authMiddleware, requirePerfil, SECRET };
