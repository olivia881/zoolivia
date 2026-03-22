const express = require('express');
const router = express.Router();
const { getDb } = require('../models/database');
const { calcolaStipendio } = require('../utils/calcoloStipendio');

router.post('/calcola', (req, res) => {
  try {
    const risultato = calcolaStipendio(req.body);
    res.json(risultato);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/salva', (req, res) => {
  try {
    const {
      lavoratrice_id, datore_id, mese, anno,
      tipo_contratto, livello, ore_settimanali, paga_oraria,
      lordo, contributi_lavoratore, contributi_datore,
      netto, tfr, tredicesima, costo_totale, pdf_path,
    } = req.body;

    if (!lavoratrice_id || !datore_id || !mese || !anno) {
      return res.status(400).json({ error: 'lavoratrice_id, datore_id, mese e anno sono obbligatori' });
    }

    const db = getDb();
    const stmt = db.prepare(
      `INSERT INTO busta_paga
       (lavoratrice_id, datore_id, mese, anno, tipo_contratto, livello,
        ore_settimanali, paga_oraria, lordo, contributi_lavoratore, contributi_datore,
        netto, tfr, tredicesima, costo_totale, pdf_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      lavoratrice_id, datore_id, mese, anno, tipo_contratto, livello,
      ore_settimanali || 0, paga_oraria || 0,
      lordo, contributi_lavoratore, contributi_datore,
      netto, tfr, tredicesima, costo_totale, pdf_path || ''
    );
    const busta = db.prepare('SELECT * FROM busta_paga WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(busta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/archivio', (req, res) => {
  const db = getDb();
  const { anno } = req.query;
  let query = `
    SELECT bp.*, 
      l.nome as lavoratrice_nome, l.cognome as lavoratrice_cognome,
      d.nome as datore_nome, d.cognome as datore_cognome
    FROM busta_paga bp
    JOIN lavoratrice l ON bp.lavoratrice_id = l.id
    JOIN datore d ON bp.datore_id = d.id
  `;
  const params = [];
  if (anno) {
    query += ' WHERE bp.anno = ?';
    params.push(anno);
  }
  query += ' ORDER BY bp.anno DESC, bp.mese DESC';
  const buste = db.prepare(query).all(...params);
  res.json(buste);
});

router.get('/archivio/:id', (req, res) => {
  const db = getDb();
  const busta = db.prepare(`
    SELECT bp.*,
      l.nome as lavoratrice_nome, l.cognome as lavoratrice_cognome, l.codice_fiscale as lavoratrice_cf,
      d.nome as datore_nome, d.cognome as datore_cognome, d.codice_fiscale as datore_cf, d.indirizzo as datore_indirizzo
    FROM busta_paga bp
    JOIN lavoratrice l ON bp.lavoratrice_id = l.id
    JOIN datore d ON bp.datore_id = d.id
    WHERE bp.id = ?
  `).get(req.params.id);
  if (!busta) return res.status(404).json({ error: 'Busta paga non trovata' });
  res.json(busta);
});

module.exports = router;
