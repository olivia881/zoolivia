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

## App installabile sul cellulare

L'app è una **PWA** (Progressive Web App): una volta pubblicata online, puoi installarla come un'app nativa (icona sulla home, schermo intero, nessuna barra del browser).

### 1. Pubblica l'app (URL permanente)

**Opzione A – Render (gratuito):**

1. Vai su [dashboard.render.com](https://dashboard.render.com) e crea un account
2. **New → Blueprint** e collega il repository GitHub `zoolivia`
3. Render legge `render.yaml` e crea il servizio
4. Al termine del deploy otterrai un URL tipo `https://busta-badante-xxx.onrender.com`

**Opzione B – Railway:**

1. Vai su [railway.app](https://railway.app) e collega il repository
2. Imposta **Build:** `npm install && npm install --prefix backend && npm install --prefix frontend && npm run build`
3. Imposta **Start:** `npm run start --prefix backend`
4. Ottieni l'URL pubblico del servizio

### 2. Installa sul telefono

- **Android (Chrome):** apri l’URL dell’app → menu (⋮) → **Installa app** oppure **Aggiungi a schermata Home**
- **iPhone (Safari):** apri l’URL → **Condividi** → **Aggiungi a schermata Home**

Dopo l’installazione avrai un’icona sulla home che apre l’app a schermo intero, senza dipendere da TunnelMole.

**Nota:** Sul piano free di Render il servizio si sospende dopo 15 minuti di inattività; il primo avvio dopo la sospensione può richiedere circa 1 minuto.

### 3. APK standalone (senza server)

L'app funziona **offline** come APK: nessun deploy, nessun URL, nessun TunnelMole. Tutto avviene sul telefono.

**Requisiti:** Android Studio (con Android SDK) installato sul PC.

**Passi:**

1. Installa Android Studio da [developer.android.com](https://developer.android.com/studio)
2. Apri il progetto e vai nella cartella `frontend`:
   ```bash
   cd frontend
   ```
3. Sincronizza e apri il progetto Android:
   ```bash
   npm run cap:sync
   npm run cap:open
   ```
4. In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. L’APK sarà in `frontend/android/app/build/outputs/apk/debug/app-debug.apk`
6. Trasferisci l’APK sul telefono (cavo USB, email, cloud) e installalo

L’app APK usa generazione PDF locale e salva anagrafica e storico in memoria sul dispositivo. Non serve connessione internet.

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
