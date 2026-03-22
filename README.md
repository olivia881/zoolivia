# Gestionale buste paga badante

Applicazione full stack per la gestione di una badante con:

- anagrafica datore di lavoro e lavoratrice;
- calcolo stipendio convivente / non convivente;
- contributi INPS semplificati;
- TFR, tredicesima e costo totale;
- generazione PDF della busta paga;
- archivio automatico dei PDF in `buste/<anno>/`;
- persistenza locale tramite SQLite.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite con `better-sqlite3`
- PDF: `pdf-lib`

## Avvio in sviluppo

```bash
npm install
npm run dev
```

Servizi disponibili:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3001`

## Build frontend

```bash
npm run build
```

## Avvio backend

```bash
npm run start
```

## Struttura

```text
frontend/   interfaccia React
backend/    API Express, SQLite, generazione PDF
shared/     logica di calcolo condivisa
data/       database SQLite locale (generato automaticamente)
buste/      archivio PDF per anno (generato automaticamente)
```
