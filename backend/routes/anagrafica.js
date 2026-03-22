const express = require('express');
const router = express.Router();
const { getDb } = require('../models/database');

// --- DATORE ---

router.get('/datore', (req, res) => {
  const db = getDb();
  const datori = db.prepare('SELECT * FROM datore ORDER BY id DESC').all();
  res.json(datori);
});

router.post('/datore', (req, res) => {
  const { nome, cognome, codice_fiscale, indirizzo, citta, cap } = req.body;

  if (!nome || !cognome || !codice_fiscale) {
    return res.status(400).json({ error: 'Nome, cognome e codice fiscale sono obbligatori' });
  }

  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO datore (nome, cognome, codice_fiscale, indirizzo, citta, cap) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(nome, cognome, codice_fiscale, indirizzo || '', citta || '', cap || '');
  const datore = db.prepare('SELECT * FROM datore WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(datore);
});

router.put('/datore/:id', (req, res) => {
  const { nome, cognome, codice_fiscale, indirizzo, citta, cap } = req.body;
  const db = getDb();
  db.prepare(
    'UPDATE datore SET nome=?, cognome=?, codice_fiscale=?, indirizzo=?, citta=?, cap=? WHERE id=?'
  ).run(nome, cognome, codice_fiscale, indirizzo || '', citta || '', cap || '', req.params.id);
  const datore = db.prepare('SELECT * FROM datore WHERE id = ?').get(req.params.id);
  res.json(datore);
});

router.delete('/datore/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM datore WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- LAVORATRICE ---

router.get('/lavoratrice', (req, res) => {
  const db = getDb();
  const lavoratrici = db.prepare('SELECT * FROM lavoratrice ORDER BY id DESC').all();
  res.json(lavoratrici);
});

router.post('/lavoratrice', (req, res) => {
  const { nome, cognome, codice_fiscale, tipo_contratto, livello, ore_settimanali, paga_oraria, datore_id } = req.body;

  if (!nome || !cognome || !codice_fiscale || !tipo_contratto || !livello) {
    return res.status(400).json({ error: 'Tutti i campi obbligatori devono essere compilati' });
  }

  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO lavoratrice (nome, cognome, codice_fiscale, tipo_contratto, livello, ore_settimanali, paga_oraria, datore_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    nome, cognome, codice_fiscale, tipo_contratto, livello,
    ore_settimanali || 0, paga_oraria || 0, datore_id || null
  );
  const lavoratrice = db.prepare('SELECT * FROM lavoratrice WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(lavoratrice);
});

router.put('/lavoratrice/:id', (req, res) => {
  const { nome, cognome, codice_fiscale, tipo_contratto, livello, ore_settimanali, paga_oraria, datore_id } = req.body;
  const db = getDb();
  db.prepare(
    `UPDATE lavoratrice SET nome=?, cognome=?, codice_fiscale=?, tipo_contratto=?, livello=?,
     ore_settimanali=?, paga_oraria=?, datore_id=? WHERE id=?`
  ).run(nome, cognome, codice_fiscale, tipo_contratto, livello,
    ore_settimanali || 0, paga_oraria || 0, datore_id || null, req.params.id);
  const lavoratrice = db.prepare('SELECT * FROM lavoratrice WHERE id = ?').get(req.params.id);
  res.json(lavoratrice);
});

router.delete('/lavoratrice/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM lavoratrice WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
