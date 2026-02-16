const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const atendimentosRoutes = require('./routes/atendimentos');
const pagamentosRoutes = require('./routes/pagamentos');
const configRoutes = require('./routes/config');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/atendimentos', atendimentosRoutes);
app.use('/api/pagamentos', pagamentosRoutes);
app.use('/api/config', configRoutes);

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
