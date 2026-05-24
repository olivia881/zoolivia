# Magazzino Scanner (Android)

App Android per consultare la giacenza in magazzino: scansiona **EAN / CODE128 / QR**, sceglie **Synology** (squadre) o **QNAP** (personale) e interroga in LAN:

- `{baseUrl}/api/giacenza.php?codice=...`

La risposta attesa è JSON, ad esempio:

```json
{
  "codice": "XYZ123",
  "descrizione": "Guanti in lattice",
  "giacenza": 42,
  "lotto": "L2024-09",
  "scadenza": "2026-03-15"
}
```

Per **codice non trovato** l’API può restituire `{"non_trovato":true}` oppure `{"errore":"..."}` senza campi utili.

## Configurazione

1. Installa **Android Studio** e l’**Android SDK**.
2. In `magazzino-scanner/`, crea `local.properties` con una riga del tipo:
   `sdk.dir=/percorso/al/Android/sdk`
3. Da terminale: `./gradlew assembleDebug`  
   L’APK sarà in `app/build/outputs/apk/debug/`.

Sull’app, icona **Impostazioni**: imposta l’URL base di ogni NAS (es. `http://192.168.1.10`). L’app aggiunge automaticamente `/api/giacenza.php`.

## Rete

È abilitato **HTTP in chiaro** (`usesCleartextTraffic`) solo per uso in LAN come da tuo scenario.

## Licenza del codice

Stesso repository del progetto principale.
