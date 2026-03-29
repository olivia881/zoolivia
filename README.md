# zoolivia

Repository con la web app **Promemoria rifiuti** (React + Vite) e il progetto **Android** (Capacitor).

## Usare l’app dal browser (telefono o PC)

URL pubblico (dopo aver configurato Pages come sotto):

**https://olivia881.github.io/zoolivia/**

### Configurare GitHub Pages (importante)

Il workflow carica il sito sul branch **`gh-pages`**. In GitHub:

1. Apri **[Impostazioni → Pages](https://github.com/olivia881/zoolivia/settings/pages)**.
2. Sotto **Build and deployment**:
   - **Source** / **Origine**: scegli **Deploy from a branch** (non «GitHub Actions» se ti dava errore 404).
   - **Branch**: **`gh-pages`**
   - Cartella: **`/ (root)`**
3. Salva.

Al primo utilizzo, esegui il workflow **Deploy GitHub Pages** da [Actions](https://github.com/olivia881/zoolivia/actions) (oppure fai un commit su `main`): verrà creato il branch `gh-pages`. Poi, se serve, ricontrolla che in Pages sia ancora selezionato quel branch.

## Sviluppo in locale

```bash
npm install
npm run dev
```

Build come su GitHub Pages:

```bash
npm run build:pages
```

## App Android

L’APK non passa da GitHub Pages: si compila in locale con Android Studio.

```bash
npm install
npm run android
```

Si apre Android Studio sulla cartella `android`.
