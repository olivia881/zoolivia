const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'badante.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Abilita WAL per performance migliori
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS datori (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL DEFAULT '',
    cognome TEXT NOT NULL DEFAULT '',
    codice_fiscale TEXT DEFAULT '',
    indirizzo TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS lavoratrici (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL DEFAULT '',
    cognome TEXT NOT NULL DEFAULT '',
    codice_fiscale TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS buste_paga (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    datore_id INTEGER REFERENCES datori(id),
    lavoratrice_id INTEGER REFERENCES lavoratrici(id),
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Inserisce profilo datore default se non esiste
const daatoreEsiste = db.prepare('SELECT id FROM datori WHERE id = 1').get();
if (!daatoreEsiste) {
  db.prepare(`
    INSERT INTO datori (id, nome, cognome, codice_fiscale, indirizzo)
    VALUES (1, '', '', '', '')
  `).run();
}

// Inserisce profilo lavoratrice default se non esiste
const lavoratriceEsiste = db.prepare('SELECT id FROM lavoratrici WHERE id = 1').get();
if (!lavoratriceEsiste) {
  db.prepare(`
    INSERT INTO lavoratrici (id, nome, cognome, codice_fiscale)
    VALUES (1, '', '', '')
  `).run();
}

module.exports = db;
