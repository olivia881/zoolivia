# Gestionale Buste Paga Badante

Applicazione full-stack per:

- calcolo stipendio badante (convivente / non convivente)
- calcolo contributi INPS (quota lavoratrice e quota datore)
- generazione PDF busta paga mensile
- archivio automatico in `backend/buste/[anno]/`

## Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** SQLite
- **PDF:** pdf-lib

## Avvio rapido

1. Installa dipendenze:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

2. Avvia frontend + backend:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## API principali

- `GET /api/profile` - legge anagrafica salvata
- `PUT /api/profile` - salva anagrafica
- `POST /api/payroll/calculate` - calcola importi mensili
- `POST /api/payroll/pdf` - genera e salva PDF

## Struttura essenziale

```text
backend/
  src/
    services/payrollCalculator.js
    services/pdfService.js
    utils/validation.js
    db.js
    server.js
frontend/
  src/
    components/InputForm.jsx
    components/ResultsPanel.jsx
    components/PDFButton.jsx
    utils/payrollCalculator.js
    App.jsx
```
