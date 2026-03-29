# Promemoria rifiuti

App **solo per uso personale** sul telefono (come per busta badante): la installi tu, **non** è un sito da condividere. Icona dedicata (**cestino + riciclo** su sfondo verde/teal), diversa da un’icona “documento / busta”.

## Installazione sul telefono (consigliato)

Serve un PC con **Android Studio** (almeno la prima volta).

1. Clona il repo sul PC.
2. Nella cartella del progetto:

   ```bash
   npm install
   npm run android
   ```

3. Si apre **Android Studio** sulla cartella `android`.
4. Collega il telefono in **USB** (debug USB attivo) o usa un emulatore.
5. **Run** (triangolo verde): l’app viene installata solo sul dispositivo collegato.

I dati restano sul telefono (nessun account obbligatorio). Il repo su GitHub può essere **privato**.

## Scaricare l’APK da GitHub (come per busta badante)

A ogni push su **`main`** (e se lanci il workflow a mano) GitHub Actions compila un **APK debug** e lo mette a disposizione.

1. Vai al repo **zoolivia** su GitHub.
2. **Releases** → [Ultimo APK — Promemoria rifiuti](https://github.com/olivia881/zoolivia/releases/tag/apk-ultimo) → scarica **`promemoria-rifiuti.apk`**  
   (link diretto: [promemoria-rifiuti.apk](https://github.com/olivia881/zoolivia/releases/download/apk-ultimo/promemoria-rifiuti.apk)).
3. Sul telefono apri il file e installa (potrebbe servire consentire installazioni da origini sconosciute).

In alternativa: tab **Actions** → workflow **Build APK** → ultimo run con segno verde → in basso **Artifacts** → scarica **promemoria-rifiuti-apk** (zip con l’APK dentro).

> Se il repository è **privato**, devi essere loggata su GitHub con l’account che ha accesso al repo.

## APK solo per te (senza Play Store)

### Debug (più veloce, firma di sviluppo)

Dalla cartella `android`:

```bash
./gradlew assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk` — copialo sul telefono (Drive, USB, ecc.) e aprilo per installare.

### Release con la tua firma (consigliato se vuoi “come un’app vera”)

Così Android non tratta l’app come “solo debug” e puoi aggiornarla in futuro con la **stessa** chiave.

1. Nella cartella `android`, crea un keystore (una volta):

   ```bash
   keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias promemoria_rifiuti
   ```

2. Copia `keystore.properties.example` in `keystore.properties` e compila i campi (password, alias, percorso del `.jks`). **Non** committare `keystore.properties` né il file `.jks`.

3. Build:

   ```bash
   ./gradlew assembleRelease
   ```

APK: `android/app/build/outputs/apk/release/app-release.apk`

Se **non** crei `keystore.properties`, `./gradlew assembleRelease` usa comunque la firma **debug** (va bene per uso strettamente personale sul tuo telefono).

## Come su Google Play ma solo per te (installazione interna)

Se vuoi il flusso “da Play Store” **senza** renderla pubblica:

1. Crea un account [Google Play Console](https://play.google.com/console) (c’è una quota di registrazione).
2. Crea un’app e carica un **Android App Bundle** (AAB):

   ```bash
   ./gradlew bundleRelease
   ```

   File: `android/app/build/outputs/bundle/release/app-release.aab`

3. Usa **test interni** (internal testing): aggiungi solo il tuo indirizzo Gmail; solo tu (e chi aggiungi tu) potete installarla da Play, **non** compare nel catalogo pubblico.

## Sviluppo web sul PC

```bash
npm install
npm run dev
```

## Funzioni

- Calendario rifiuti settimanale personalizzabile.
- Notifiche promemoria sul telefono (permesso alla prima attivazione).
