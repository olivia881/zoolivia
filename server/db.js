/**
 * Database SQLite per anagrafica e storico
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export function getDb() {
  if (!db) {
    db = new Database(path.join(__dirname, 'badante.db'));
  }
  return db;
}

export function initDatabase() {
  const database = getDb();

  // Tabella datore di lavoro (singolo record)
  database.exec(`
    CREATE TABLE IF NOT EXISTS datore (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      cf TEXT NOT NULL,
      indirizzo TEXT,
      cap TEXT,
      citta TEXT
    )
  `);

  // Tabella lavoratrice (singolo record)
  database.exec(`
    CREATE TABLE IF NOT EXISTS lavoratrice (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      cf TEXT NOT NULL,
      tipo_contratto TEXT DEFAULT 'non_convivente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database inizializzato');
}
