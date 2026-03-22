const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'badante.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS datore (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      codice_fiscale TEXT NOT NULL,
      indirizzo TEXT,
      citta TEXT,
      cap TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lavoratrice (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      codice_fiscale TEXT NOT NULL,
      tipo_contratto TEXT NOT NULL CHECK(tipo_contratto IN ('convivente', 'non_convivente')),
      livello TEXT NOT NULL CHECK(livello IN ('BS', 'CS')),
      ore_settimanali REAL DEFAULT 0,
      paga_oraria REAL DEFAULT 0,
      datore_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (datore_id) REFERENCES datore(id)
    );

    CREATE TABLE IF NOT EXISTS busta_paga (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lavoratrice_id INTEGER NOT NULL,
      datore_id INTEGER NOT NULL,
      mese INTEGER NOT NULL,
      anno INTEGER NOT NULL,
      tipo_contratto TEXT NOT NULL,
      livello TEXT NOT NULL,
      ore_settimanali REAL,
      paga_oraria REAL,
      lordo REAL NOT NULL,
      contributi_lavoratore REAL NOT NULL,
      contributi_datore REAL NOT NULL,
      netto REAL NOT NULL,
      tfr REAL NOT NULL,
      tredicesima REAL NOT NULL,
      costo_totale REAL NOT NULL,
      pdf_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lavoratrice_id) REFERENCES lavoratrice(id),
      FOREIGN KEY (datore_id) REFERENCES datore(id)
    );
  `);
}

module.exports = { getDb };
