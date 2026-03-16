# 🐾 Zoolivia

Piattaforma di streaming per contenuti dedicati al mondo degli animali.

## Funzionalità

- Visualizzazione abbonamento attivo
- **Cancellazione abbonamento** con selezione del motivo e feedback
- API REST per la gestione degli abbonamenti

## Come interrompere l'abbonamento

1. Accedi alla pagina di gestione abbonamento (`/`)
2. Verifica i dettagli del tuo piano attivo
3. Nella sezione **"Cancella abbonamento"**, seleziona il motivo della cancellazione
4. (Opzionale) Lascia un commento per aiutarci a migliorare
5. Clicca su **"Cancella abbonamento"** e conferma nella finestra di dialogo

> **Nota:** dopo la cancellazione continuerai ad avere accesso a tutti i contenuti Premium fino alla data di scadenza del periodo già pagato. Il rinnovo automatico verrà semplicemente disattivato.

## Avvio in locale

```bash
npm install
npm start
```

L'applicazione sarà disponibile su [http://localhost:3000](http://localhost:3000).

## API

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET  | `/api/abbonamento/:userId` | Recupera i dati dell'abbonamento |
| POST | `/api/abbonamento/:userId/cancella` | Cancella l'abbonamento |

### Body POST `/cancella`

```json
{
  "motivo": "troppo-caro",
  "feedback": "Testo libero opzionale"
}
```
