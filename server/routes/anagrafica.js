/**
 * API per gestione anagrafica (datore e lavoratrice)
 */

import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

// GET datore (singolo record)
router.get('/datore', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM datore WHERE id = 1').get();
  res.json(row || null);
});

// PUT datore
router.put('/datore', (req, res) => {
  const { nome, cognome, cf, indirizzo, cap, citta } = req.body;
  const db = getDb();
  db.prepare(`
    INSERT INTO datore (id, nome, cognome, cf, indirizzo, cap, citta)
    VALUES (1, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      nome = excluded.nome,
      cognome = excluded.cognome,
      cf = excluded.cf,
      indirizzo = excluded.indirizzo,
      cap = excluded.cap,
      citta = excluded.citta
  `).run(nome || '', cognome || '', cf || '', indirizzo || '', cap || '', citta || '');
  res.json({ success: true });
});

// GET lavoratrice (singolo record)
router.get('/lavoratrice', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM lavoratrice WHERE id = 1').get();
  res.json(row || null);
});

// PUT lavoratrice
router.put('/lavoratrice', (req, res) => {
  const { nome, cognome, cf, tipo_contratto } = req.body;
  const db = getDb();
  db.prepare(`
    INSERT INTO lavoratrice (id, nome, cognome, cf, tipo_contratto)
    VALUES (1, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      nome = excluded.nome,
      cognome = excluded.cognome,
      cf = excluded.cf,
      tipo_contratto = excluded.tipo_contratto
  `).run(nome || '', cognome || '', cf || '', tipo_contratto || 'non_convivente');
  res.json({ success: true });
});

export default router;
