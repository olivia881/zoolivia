# 🗑️ Promemoria Rifiuti

Web app progressiva (PWA) per ricordarti giorno per giorno quali rifiuti differenziati portare fuori.

## Funzionalità

- **Schermata "Oggi"** – mostra immediatamente i bidoni da esporre oggi con colori distintivi
- **Striscia settimanale** – panoramica a colpo d'occhio dell'intera settimana con pallini colorati
- **Dettaglio per giorno** – clicca un giorno per vedere la lista completa di cosa buttare in ogni bidone
- **Notifiche push** – promemoria la sera prima configurabile (es. ogni sera alle 20:00)
- **Funziona offline** – service worker con cache degli asset statici
- **Installabile come app** – manifest PWA completo, si può aggiungere alla home dello smartphone
- **Calendario personalizzabile** – puoi modificare lo schema raccolta giorno per giorno dalle impostazioni
- **Senza server** – tutto gira nel browser, zero dati inviati online

## Tipi di rifiuto gestiti

| Colore | Tipo | Esempi |
|--------|------|--------|
| 🟤 Marrone | Organico | Scarti cucina, fondi caffè, gusci d'uovo |
| 🟡 Giallo | Plastica / Alluminio | Bottiglie, lattine, tetrapak |
| 🔵 Blu | Carta / Cartone | Giornali, scatole, imballaggi |
| 🟢 Verde | Vetro | Bottiglie, barattoli, vasetti |
| ⚫ Grigio | Secco non riciclabile | Pannolini, mozziconi |
| 🌿 Verde scuro | Verde / Sfalci | Erba, foglie, potature |
| 🟣 Viola | Ingombranti | Mobili, materassi |
| 🔌 Arancione | RAEE | Elettrodomestici, lampadine |

## Schema predefinito

| Giorno | Raccolta |
|--------|----------|
| Lunedì | Organico + Plastica |
| Martedì | Carta |
| Mercoledì | Organico |
| Giovedì | Vetro + Plastica |
| Venerdì | Organico + Secco |
| Sabato | Verde |
| Domenica | — |

> Lo schema è completamente personalizzabile dalle impostazioni (icona ⚙️).

## Utilizzo

Apri semplicemente `index.html` in un browser moderno oppure pubblica la cartella su qualsiasi hosting statico (GitHub Pages, Netlify, Vercel…).

Per installare l'app sullo smartphone, apri il sito con Chrome/Safari e usa **"Aggiungi a schermata Home"**.

## Struttura file

```
index.html      – app completa (HTML + CSS + JS inline)
manifest.json   – manifest PWA
sw.js           – service worker (cache offline + notifiche push)
icons/
  icon-192.png  – icona app 192×192
  icon-512.png  – icona app 512×512
```
