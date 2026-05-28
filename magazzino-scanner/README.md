# PrismaScanner (Android)

App Android **PrismaScanner** per consultare la giacenza in LAN: scansiona **EAN / CODE128 / QR**, sceglie il **NAS Synology** o il **NAS QNAP** (ciascuno con il proprio database) e interroga:

`{baseUrl}/giacenza.php?id=...`

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

## Icona (PNG) — dove e quando metterla

1. **Percorso nel progetto:** sostituisci il file  
   `magazzino-scanner/app/src/main/res/drawable-nodpi/ic_launcher_foreground_prisma.png`  
   con **la tua** immagine, **stesso nome di file** (`ic_launcher_foreground_prisma.png`).

2. **Formato consigliato:** PNG **quadrato** (es. 1024×1024). Meglio se il disegno tiene conto della “zona sicura” dell’icona adattiva (il sistema ritaglia i bordi a forma di cerchio/squircle).

3. **Prima della build:**
   - **Locale:** dopo aver copiato il PNG, in Android Studio fai *Build → Rebuild Project* oppure da terminale `./gradlew assembleDebug`.
   - **GitHub Actions:** fai **commit + push** del PNG sul branch che usi per il workflow, poi lancia **«Build PrismaScanner APK»** (o attendi il run automatico). Il workflow usa ciò che c’è nel repository al momento del run.

**Alternativa:** in Android Studio *File → New → Image Asset*, importi il PNG e generi le risorse; in quel caso segui la procedura guidata (potrebbe creare altre cartelle `mipmap-*`; va bene se il risultato è coerente con il manifest).

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

## L’API sui due NAS — devi “compilarla” tu?

L’app **non** contiene l’API: è solo un client che chiama un URL sul NAS.

- **Sì, lato server va preparato su ogni NAS** (Synology e QNAP), perché ciascuno ha il **proprio** database e deve rispondere allo stesso contratto (`/giacenza.php?id=...` e JSON come sopra).
- **Non** è obbligatorio che sia PHP: può essere PHP (Web Station), Node, Python, Docker, ecc.; l’importante è che risponda in HTTP e JSON come si aspetta l’app.
- In pratica: **installi/configuri** il servizio web su ogni NAS (cartella del sito, virtual host, permessi sul file SQLite in lettura), **carichi** gli script (o l’immagine Docker) e verifichi dal browser o da `curl` che l’URL risponda. Non c’è un “compilatore” unico obbligatorio: dipende da cosa scegli tu sul NAS.

Un punto di partenza per PHP + SQLite è `docs/esempio-giacenza.php` (adatta percorso DB e query al tuo schema).
