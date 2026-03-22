# Gestionale Badante

Applicazione web per la gestione dello stipendio della badante secondo il **CCNL Lavoro Domestico** italiano.

## Funzionalità

- **Calcolo stipendio in tempo reale** (convivente e non convivente)
- **Contributi INPS** separati (lavoratrice ~7% e datore ~16%)
- **TFR** mensile (7,41% del lordo)
- **Tredicesima** rata mensile (lordo / 12)
- **Generazione PDF** busta paga con layout professionale
- **Archivio automatico** dei PDF per anno in `/buste/[anno]/`
- **Gestione anagrafica** datore di lavoro e lavoratrice

## Livelli CCNL supportati

| Livello | Stipendio mensile (convivente) |
|---------|-------------------------------|
| B Super (BS) | €1.053,00 |
| C Super (CS) | €1.120,00 |

## Tecnologie

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite (via better-sqlite3)
- **PDF**: PDFKit

## Avvio rapido

### Prerequisiti
- Node.js >= 18
- npm >= 9

### Installazione

```bash
# Installa tutte le dipendenze
npm run install:all
```

### Sviluppo (server + client insieme)

```bash
npm run dev
```

Oppure separatamente:

```bash
# Terminale 1 - Backend (porta 3001)
cd server && npm run dev

# Terminale 2 - Frontend (porta 5173)
cd client && npm run dev
```

Apri il browser su: **http://localhost:5173**

### Produzione

```bash
# Build del frontend
npm run client:build

# Avvia il server (servirà anche il frontend)
cd server && npm start
```

## Struttura progetto

```
gestionale-badante/
├── server/               # Backend Express
│   ├── server.js         # Entry point
│   ├── db.js             # Database SQLite
│   ├── routes/
│   │   ├── anagrafiche.js  # CRUD datore/lavoratrice
│   │   └── buste.js        # Generazione e archivio buste
│   └── utils/
│       ├── calculations.js  # Logica calcolo stipendio
│       └── generatePDF.js   # Generazione PDF con PDFKit
├── client/               # Frontend React
│   └── src/
│       ├── App.jsx          # Componente principale
│       ├── components/
│       │   ├── InputForm.jsx      # Form input mensile
│       │   ├── ResultsPanel.jsx   # Pannello risultati
│       │   ├── PDFButton.jsx      # Pulsante genera PDF
│       │   ├── AnagraficaModal.jsx # Modal dati anagrafici
│       │   └── ArchivioTab.jsx    # Tab archivio buste
│       └── utils/
│           ├── calculations.js  # Calcoli lato client
│           ├── api.js           # Client API
│           └── formatters.js    # Formattatori euro/date
└── buste/                # PDF generati (auto)
    └── [anno]/
        └── Busta_[Mese]_[Anno]_[Nome].pdf
```

## API Backend

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/anagrafica` | Legge datori e lavoratrice |
| PUT | `/api/anagrafica/datore` | Aggiorna datore |
| PUT | `/api/anagrafica/lavoratrice` | Aggiorna lavoratrice |
| GET | `/api/buste` | Lista buste paga |
| POST | `/api/buste/genera` | Genera busta paga + PDF |
| GET | `/api/buste/:id/download` | Scarica PDF |
| DELETE | `/api/buste/:id` | Elimina busta |

## Nota legale

I calcoli sono indicativi e basati su aliquote semplificate.
Per situazioni specifiche consultare un consulente del lavoro.
