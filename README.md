# Sistema Buste Paga Badante

Applicazione gestionale per la gestione di una badante (lavoro domestico italiano):
- Calcolo stipendio (convivente e non convivente)
- Gestione contributi INPS
- Generazione busta paga mensile PDF
- Archivio automatico in `server/buste/[anno]/`

## Tecnologie

- **Frontend:** React (Vite) - UI mobile-friendly
- **Backend:** Node.js + Express
- **Database:** SQLite (locale)
- **PDF:** pdf-lib

## Avvio

```bash
# Installa dipendenze
npm install
cd server && npm install
cd ../client && npm install

# Avvia client e server insieme
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Funzionalità

1. **Anagrafica** – Datore di lavoro e lavoratrice (nome, CF, indirizzo)
2. **Input mensile** – Tipo contratto, livello BS/CS, ore settimanali, paga oraria (se non convivente), mese, anno
3. **Calcolo in tempo reale** – Lordo, netto, contributi (7% lavoratore, 16% datore), TFR (7.41%), tredicesima, costo totale
4. **Generazione PDF** – Busta paga completa, salvata in `buste/[anno]/`

## Struttura

```
workspace/
├── client/          # React frontend
│   └── src/
│       ├── components/
│       │   ├── InputForm.jsx
│       │   ├── ResultsPanel.jsx
│       │   ├── PDFButton.jsx
│       │   └── AnagraficaModal.jsx
│       └── App.jsx
├── server/          # Express backend
│   ├── calcolo.js   # Logica di calcolo
│   ├── pdf.js       # Generazione PDF
│   ├── db.js        # SQLite
│   └── buste/       # Archivio PDF (creato automaticamente)
└── package.json
```
