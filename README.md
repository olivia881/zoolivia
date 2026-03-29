# Turni di servizio

App **solo per uso personale** sul telefono: **vista settimanale** (predefinita) con **7 colonne** e dettagli visibili (mattina, pomeriggio, straordinario, fuori sede, note, flag C.O./PNL/BP…). Pulsante **«Applica turno a scalare a questa settimana»** compila automaticamente **lun–ven** con le fasce delle impostazioni (es. 9–15 e 15:30–18:30), inclusi i **rientri incrociati** (es. pomeriggio del lunedì sul mercoledì). C’è anche il **calendario mese** per panoramica e conteggi mensili. Promemoria opzionale.

L’**applicationId** Android è **`it.turni.servizio`**: è un’**app distinta** da «Promemoria rifiuti» (`it.promemoria.rifiuti`); puoi tenere entrambe installate. Icona: calendario + evidenziazione giorno (tema turni).

## Installazione sul telefono (consigliato: Android Studio)

Serve un PC con **Android Studio** (almeno la prima volta).

1. Clona il repo sul PC.
2. Nella cartella del progetto:

   ```bash
   npm install
   npm run android
   ```

3. Si apre **Android Studio** sulla cartella `android`.
4. Collega il telefono in **USB** (debug USB attivo) o usa un emulatore.
5. **Run** (triangolo verde): l’app viene installata sul dispositivo.

I dati restano sul telefono (localStorage / WebView). Il repo può essere **privato**.

### Notifiche e promemoria vocale (Android)

1. **Notifiche** — attive per l’app; priorità / suono se disponibili.
2. **Batteria** — “Senza restrizioni” / non ottimizzare, così le notifiche non arrivano in ritardo.
3. **Allarmi esatti** (Android 12+) — consentiti per l’app, se richiesto.
4. Dopo aver cambiato orario o ciclo, **apri l’app** per aggiornare i promemoria programmati.

La **voce** parte quando la notifica viene consegnata e il processo dell’app può eseguire il sintetizzatore (spesso con app aperta o appena in background); non è garantita con telefono a lungo inattivo o app forzata chiusa.

## Scaricare l’APK da GitHub

Il workflow **Build APK** compila un **APK debug** e lo pubblica sulla release **apk-ultimo** e come artifact.

- **Push su `main`:** il build parte automaticamente.
- **Dal tuo branch di feature:** GitHub → **Actions** → **Build APK** → **Run workflow** → scegli il branch → al termine scarica l’artifact **turni-servizio-apk** (zip con `turni-servizio.apk`).

Dopo il merge su `main`, la release [apk-ultimo](https://github.com/olivia881/zoolivia/releases/tag/apk-ultimo) conterrà **`turni-servizio.apk`** (nome aggiornato rispetto alle build vecchie).

Sul telefono apri il file e installa (potrebbe servire consentire installazioni da origini sconosciute).

> Repository **privato:** devi essere loggata su GitHub con l’account che ha accesso.

## APK in locale (senza GitHub)

Dopo `npm run build` e `npx cap sync android`, dalla cartella `android`:

```bash
./gradlew assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk` — copialo sul telefono (Drive, USB, ecc.) e aprilo.

### Release con la tua firma (opzionale)

1. Nella cartella `android`, crea un keystore (una volta):

   ```bash
   keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias turni_servizio
   ```

2. Copia `keystore.properties.example` in `keystore.properties` e compila i campi. **Non** committare `keystore.properties` né il `.jks`.

3. `./gradlew assembleRelease` → `android/app/build/outputs/apk/release/app-release.apk`

Senza `keystore.properties`, `assembleRelease` usa la firma **debug** (ok per uso personale).

## Sviluppo web sul PC

```bash
npm install
npm run dev
```

Poi apri `http://localhost:5173` (dal telefono sulla stessa rete: `http://IP_DEL_PC:5173` con `npm run dev -- --host 0.0.0.0`).

## Funzioni

- **Griglia settimanale** a scorrimento orizzontale + pulsante applica turno a scalare sulla settimana corrente.
- **Calendario mensile** (link «Vista settimana» / «Calendario mese»).
- **Conteggi** del mese (anche dalla vista settimana).
- Scheda completa per giorno (corsi, servizi esterni, ecc.).
- Sfondo interfaccia **blu** (tema coerente con l’icona).
