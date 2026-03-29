# Turni di servizio

Mini web app (HTML, CSS, JavaScript vanilla) per pianificare e gestire i turni di servizio.

## Funzionalità principali

- Inserimento turno con:
  - data
  - orario inizio/fine
  - persona
  - servizio
  - luogo (opzionale)
  - note (opzionale)
- Ripetizione settimanale automatica del turno
- Modifica ed eliminazione dei turni
- Filtri per testo, persona, servizio e intervallo date
- Panoramica rapida:
  - turni di oggi
  - turni di domani
  - turni nei prossimi 7 giorni
  - prossimo turno in calendario
- Salvataggio locale nel browser tramite `localStorage`
- Export/Import dei turni in formato JSON

## Avvio

Essendo una web app statica, puoi aprire direttamente `index.html` nel browser.

In alternativa, puoi usare un server locale:

```bash
python3 -m http.server 8080
```

Poi apri:

```text
http://localhost:8080
```

## Struttura file

- `index.html`: interfaccia utente
- `styles.css`: stile responsive
- `app.js`: logica applicativa (CRUD turni, filtri, statistiche, import/export)
