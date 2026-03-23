# Gestionale Buste Paga Badante

Applicazione full-stack per:

- calcolo stipendio badante (convivente / non convivente)
- calcolo contributi INPS (quota lavoratrice e quota datore)
- generazione documenti PDF:
  - contratto di assunzione
  - clausola integrativa
  - busta paga
  - ricevuta pagamento
- archivio automatico in `backend/documenti/[anno]/`

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

## Installazione su telefono (PWA)

L'app frontend e installabile come PWA (icona su Home del telefono):

- **Android (Chrome):** apri il sito e scegli **Installa app** dal menu.
- **iPhone (Safari):** **Condividi > Aggiungi a schermata Home**.

Note importanti:

- In locale funziona come PWA su `localhost`.
- Per installazione reale da telefono con rete mobile, pubblica l'app su HTTPS.
- L'app installata usa sempre il backend configurato (`VITE_API_BASE_URL`).

## Android + TunnelMole (accesso da telefono in rete locale)

Per usare l'app da uno smartphone Android tramite tunnel pubblico:

1. **Builda e avvia** (in un terminale):
   ```bash
   npm run tunnel
   ```
   Oppure: `npm run build` seguito da `npm start`.

2. **Esponi con TunnelMole** (installa con `npm install -g tunnelmole`) in un altro terminale:
   ```bash
   tmole 4000
   ```

3. **Sul telefono Android:** apri l'URL HTTPS fornito (es. `https://xxx.tunnelmole.com`), usa l'app e installala come PWA se desideri.

Il backend serve il frontend dalla stessa origin, quindi con un solo tunnel (porta 4000) funzionano sia l'interfaccia che le API. Non serve `VITE_API_BASE_URL`.

## API principali

- `GET /api/profile` - legge anagrafica salvata
- `PUT /api/profile` - salva anagrafica
- `POST /api/payroll/calculate` - calcola importi mensili
- `POST /api/payroll/pdf` - genera busta paga (compatibilita)
- `POST /api/documents/generate` - genera contratto, busta o ricevuta

## Struttura essenziale

```text
backend/
  src/
    models/entities.js
    templates/contractTemplate.js
    templates/payslipTemplate.js
    templates/receiptTemplate.js
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
    components/DocumentsPanel.jsx
    utils/payrollCalculator.js
    App.jsx
```
