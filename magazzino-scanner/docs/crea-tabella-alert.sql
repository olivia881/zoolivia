-- Tabella alert per Prisma (esaurimento / scadenza).
-- Esegui sul file Prisma.db (PC test: D:\Prisma\Prisma.db).
-- Strumenti: DB Browser for SQLite, oppure sqlite3.exe da prompt.
--
-- Sul PC, esempio da prompt (se hai sqlite3 nel PATH):
--   sqlite3 D:\Prisma\Prisma.db < D:\percorso\crea-tabella-alert.sql

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS AlertMagazzino (
    Id           INTEGER PRIMARY KEY AUTOINCREMENT,
    ProdottoId   INTEGER NOT NULL,
    Tipo         TEXT    NOT NULL CHECK (Tipo IN ('esaurimento', 'scadenza')),
    Attivo       INTEGER NOT NULL DEFAULT 1 CHECK (Attivo IN (0, 1)),
    CreatoIl     TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    AggiornatoIl TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE (ProdottoId, Tipo)
);

CREATE INDEX IF NOT EXISTS idx_alert_attivo_aggiornato
    ON AlertMagazzino (Attivo, AggiornatoIl DESC);

-- ---------------------------------------------------------------------------
-- DATI DI PROVA (opzionale): sostituisci 160 con un Id prodotto reale nel tuo DB
-- ---------------------------------------------------------------------------
-- INSERT INTO AlertMagazzino (ProdottoId, Tipo, Attivo)
-- VALUES (160, 'esaurimento', 1)
-- ON CONFLICT(ProdottoId, Tipo) DO UPDATE SET
--     Attivo = 1,
--     AggiornatoIl = datetime('now', 'localtime');

-- INSERT INTO AlertMagazzino (ProdottoId, Tipo, Attivo)
-- VALUES (160, 'scadenza', 1)
-- ON CONFLICT(ProdottoId, Tipo) DO UPDATE SET
--     Attivo = 1,
--     AggiornatoIl = datetime('now', 'localtime');
