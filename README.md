# Gestionale Buste Paga Badante

Applicazione web per la gestione delle buste paga del lavoro domestico (badanti) secondo il CCNL italiano.

## Funzionalità

- Calcolo stipendio badante convivente e non convivente
- Gestione contributi INPS (quota lavoratore e datore)
- Calcolo TFR e tredicesima
- Generazione busta paga in PDF
- Archivio automatico delle buste paga
- Interfaccia mobile-friendly

## Tecnologie

- **Frontend:** React
- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **PDF:** jsPDF

## Avvio

```bash
# Backend
cd backend
npm install
npm start

# Frontend (in un altro terminale)
cd frontend
npm install
npm start
```

Il backend gira sulla porta 3001, il frontend sulla porta 3000 con proxy verso il backend.
