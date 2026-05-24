# PrismaScanner (Android)

App Android **PrismaScanner** per consultare la giacenza in LAN: scansiona **EAN / CODE128 / QR**, sceglie il **NAS Synology** o il **NAS QNAP** (ciascuno con il proprio database) e interroga:

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

Foreground adattivo: `app/src/main/res/drawable-nodpi/ic_launcher_foreground_prisma.png` (sostituibile con il tuo PNG ufficiale, stesso nome di file, oppure *Image Asset* in Android Studio).

## Build in locale

1. Installa **Android Studio** e l’**Android SDK**.  
2. Nella cartella `magazzino-scanner/`, crea `local.properties` con una riga:  
   `sdk.dir=/percorso/al/Android/sdk`  
3. Da terminale, nella cartella `magazzino-scanner/`:  
   `./gradlew assembleDebug`  
   L’APK sarà in `app/build/outputs/apk/debug/`.

## Build con GitHub Actions

Nel repository è definito il workflow **«Build PrismaScanner APK»** (file `.github/workflows/build-prisma-scanner-apk.yml`).

1. Su GitHub apri il repo → tab **Azioni**.  
2. Seleziona **«Build PrismaScanner APK»** → **Esegui workflow**.  
3. Scegli il **branch** che contiene le modifiche (es. `main` o il branch della feature).  
4. Al termine del run, nella pagina del job, sezione **Artifacts**: scarica **`prisma-scanner-apk-debug`** (contiene `prisma-scanner-debug.apk`).

Il workflow parte anche automaticamente su **push** e **pull request** che toccano la cartella `magazzino-scanner/`.

## Rete

È abilitato **HTTP in chiaro** (`usesCleartextTraffic`) per uso in LAN.

## Esempio PHP sul NAS

Vedi `docs/esempio-giacenza.php` (adatta percorso database e query).
