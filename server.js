const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store degli abbonamenti (demo)
const abbonamenti = {
  'USR001': {
    id: 'USR001',
    nome: 'Mario Rossi',
    piano: 'Premium',
    dataInizio: '2024-01-15',
    dataRinnovo: '2026-04-15',
    stato: 'attivo',
    prezzo: 9.99,
  },
};

// GET - recupera i dati dell'abbonamento
app.get('/api/abbonamento/:userId', (req, res) => {
  const { userId } = req.params;
  const abbonamento = abbonamenti[userId];

  if (!abbonamento) {
    return res.status(404).json({ errore: 'Abbonamento non trovato.' });
  }

  res.json(abbonamento);
});

// POST - richiesta di cancellazione abbonamento
app.post('/api/abbonamento/:userId/cancella', (req, res) => {
  const { userId } = req.params;
  const { motivo, feedback } = req.body;
  const abbonamento = abbonamenti[userId];

  if (!abbonamento) {
    return res.status(404).json({ errore: 'Abbonamento non trovato.' });
  }

  if (abbonamento.stato === 'cancellato') {
    return res.status(400).json({ errore: "L'abbonamento è già stato cancellato." });
  }

  abbonamento.stato = 'cancellato';
  abbonamento.dataCancellazione = new Date().toISOString().split('T')[0];
  abbonamento.motivoCancellazione = motivo || 'Non specificato';
  abbonamento.feedback = feedback || '';

  console.log(`[${new Date().toISOString()}] Abbonamento cancellato - Utente: ${userId}, Motivo: ${abbonamento.motivoCancellazione}`);

  res.json({
    messaggio: 'Abbonamento cancellato con successo.',
    dataFineServizio: abbonamento.dataRinnovo,
    abbonamento,
  });
});

app.listen(PORT, () => {
  console.log(`Server Zoolivia in ascolto su http://localhost:${PORT}`);
});
