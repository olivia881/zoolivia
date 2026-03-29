# Promemoria rifiuti giornaliero

Piccola app web statica per ricordare cosa buttare ogni giorno.

## Funzionalita

- vista rapida di cosa conferire oggi e cosa preparare per domani
- calendario settimanale personalizzabile direttamente nell'interfaccia
- preferenze salvate in locale con `localStorage`
- notifiche browser opzionali all'orario scelto
- pulsante per inviare una notifica di prova

## Come avviarla

Hai due modi semplici:

1. aprire `index.html` direttamente nel browser
2. oppure servire la cartella con un server statico, per esempio:

```bash
python3 -m http.server 4173
```

e poi visitare `http://localhost:4173`.

## File principali

- `index.html`: struttura della pagina
- `styles.css`: stile responsive
- `app.js`: logica dell'app, calendario e notifiche

## Note sulle notifiche

Le notifiche funzionano solo se:

- il browser supporta la API `Notification`
- concedi il permesso quando richiesto
- la pagina resta aperta nel browser

Questa versione e pensata come base semplice e leggera. In un secondo momento possiamo aggiungere:

- calendario mensile
- piu profili di raccolta
- PWA installabile su telefono
- import/export del calendario
