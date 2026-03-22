/**
 * Server Express per Sistema Buste Paga Badante
 * Gestisce API, database SQLite e generazione PDF
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import { calcolaStipendio } from './calcolo.js';
import { generaBustaPagaPDF } from './pdf.js';
import anagraficaRoutes from './routes/anagrafica.js';
import busteRoutes from './routes/buste.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Inizializza database
initDatabase();

// API Routes
app.use('/api/anagrafica', anagraficaRoutes);
app.use('/api/buste', busteRoutes);

// Endpoint calcolo (senza salvataggio)
app.post('/api/calcola', (req, res) => {
  try {
    const risultato = calcolaStipendio(req.body);
    res.json(risultato);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Genera PDF busta paga
app.post('/api/pdf/genera', async (req, res) => {
  try {
    const { datiCalcolo, datore, lavoratrice } = req.body;
    const pdfPath = await generaBustaPagaPDF(datiCalcolo, datore, lavoratrice);
    // URL per download (static serve da buste/, quindi path = anno/nome.pdf)
    const urlPath = pdfPath.replace(/^buste[/\\]/, '');
    const downloadUrl = `/api/buste-pdf/${urlPath}`;
    res.json({ success: true, path: pdfPath, downloadUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve file PDF archiviati
app.use('/api/buste-pdf', express.static(path.join(__dirname, 'buste')));

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
