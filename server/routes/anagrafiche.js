const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/anagrafica - restituisce datore e lavoratrice
router.get('/', (req, res) => {
  try {
    const datore = db.prepare('SELECT * FROM datori WHERE id = 1').get() || {};
    const lavoratrice = db.prepare('SELECT * FROM lavoratrici WHERE id = 1').get() || {};
    res.json({ datore, lavoratrice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/anagrafica/datore - aggiorna dati datore
router.put('/datore', (req, res) => {
  const { nome, cognome, codice_fiscale, indirizzo } = req.body;
  try {
    db.prepare(`
      UPDATE datori
      SET nome = ?, cognome = ?, codice_fiscale = ?, indirizzo = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(nome || '', cognome || '', codice_fiscale || '', indirizzo || '');

    const updated = db.prepare('SELECT * FROM datori WHERE id = 1').get();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/anagrafica/lavoratrice - aggiorna dati lavoratrice
router.put('/lavoratrice', (req, res) => {
  const { nome, cognome, codice_fiscale } = req.body;
  try {
    db.prepare(`
      UPDATE lavoratrici
      SET nome = ?, cognome = ?, codice_fiscale = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(nome || '', cognome || '', codice_fiscale || '');

    const updated = db.prepare('SELECT * FROM lavoratrici WHERE id = 1').get();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
