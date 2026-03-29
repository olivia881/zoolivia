# Promemoria rifiuti

App **solo per uso personale** sul telefono (come l’esperienza “busta badante”): non è un sito pubblico da condividere, è un’**app Android** che installi tu sul tuo dispositivo.

## Come averla sul telefono (consigliato)

Serve un PC con **Android Studio** (una volta).

1. Clona il repo (o scarica lo zip) sul PC.
2. Nella cartella del progetto:

   ```bash
   npm install
   npm run android
   ```

3. Si apre **Android Studio** sulla cartella `android`.
4. Collega il telefono con **USB** (debug USB attivo in Opzioni sviluppatore) oppure usa un **emulatore**.
5. In Android Studio: **Run** (triangolo verde) per installare l’app sul telefono.

### APK da copiare sul telefono (senza USB ogni volta)

Da terminale, nella cartella `android`:

```bash
./gradlew assembleDebug
```

L’APK è in:

`android/app/build/outputs/apk/debug/app-debug.apk`

Copialo sul telefono (Drive, email, cavo) e aprilo per installare. Android potrebbe chiedere di consentire installazioni da “origini sconosciute” per quel file manager.

> Il repository GitHub può restare **privato**: l’app non dipende da un sito pubblico; i dati restano sul dispositivo.

## Sviluppo / anteprima sul PC

```bash
npm install
npm run dev
```

## Contenuto

- Calendario rifiuti settimanale (personalizzabile).
- Promemoria con **notifiche** sul telefono (permesso notifiche alla prima attivazione).
