# PrismaMobile (Android)

App Android **PrismaMobile** per consultare la giacenza: scansiona **EAN / CODE128 / QR**, sceglie il **NAS Synology** o il **NAS QNAP** (ciascuno con il proprio database in LAN) e interroga:

`{baseUrl}/api/giacenza.php?codice=...`

Risposta JSON attesa, ad esempio:

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

## Icona

L’icona launcher è un **vettore adattivo** ispirata ai colori del brand (blu `#001035`, rosso `#8B0000`, bianco). Se hai il file **PNG/SVG** definitivo dell’icona, puoi sostituire `app/src/main/res/drawable/ic_launcher_foreground_prisma.xml` con le risorse generate da Android Studio (Image Asset).

## Build

1. Android Studio + Android SDK.  
2. In `magazzino-scanner/`, crea `local.properties` con `sdk.dir=...`  
3. `./gradlew assembleDebug` → APK in `app/build/outputs/apk/debug/`.

## Rete

È abilitato **HTTP in chiaro** (`usesCleartextTraffic`) per uso in LAN.

## Esempio PHP

Vedi `docs/esempio-giacenza.php` (adatta percorso DB e query al tuo schema).
