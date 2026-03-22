const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());

// Crea directory buste se non esiste
const BUSTE_DIR = path.join(__dirname, '..', 'buste');
if (!fs.existsSync(BUSTE_DIR)) {
  fs.mkdirSync(BUSTE_DIR, { recursive: true });
}

// Routes API
app.use('/api/anagrafica', require('./routes/anagrafiche'));
app.use('/api/buste', require('./routes/buste'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In produzione, serve i file statici del frontend
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(clientBuild)) {
    app.use(express.static(clientBuild));
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuild, 'index.html'));
    });
  }
}

// Gestione errori globale
app.use((err, req, res, next) => {
  console.error('Errore non gestito:', err);
  res.status(500).json({ error: 'Errore interno del server' });
});

app.listen(PORT, () => {
  console.log(`✅ Gestionale Badante - Server avviato su http://localhost:${PORT}`);
  console.log(`   Database: ./server/data/badante.db`);
  console.log(`   Archivio PDF: ./buste/`);
});

module.exports = app;
