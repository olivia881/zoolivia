# zoolivia

Repository con la web app **Promemoria rifiuti** (React + Vite) e il progetto **Android** (Capacitor).

## Usare l’app sul telefono (web)

Dopo aver attivato GitHub Pages (vedi sotto), l’indirizzo pubblico è:

**https://olivia881.github.io/zoolivia/**

### Attivare GitHub Pages (una tantum)

1. Apri [Impostazioni Pages del repository](https://github.com/olivia881/zoolivia/settings/pages).
2. In **Build and deployment** → **Source** scegli **GitHub Actions** (non un branch).
3. Vai su [Azioni](https://github.com/olivia881/zoolivia/actions), apri il workflow **Deploy GitHub Pages** e usa **Run workflow** oppure fai un commit su `main` per rilanciare il deploy.

## Sviluppo in locale

```bash
npm install
npm run dev
```

Build per pubblicazione su Pages (stesso comando usato in CI):

```bash
npm run build:pages
```

## App Android

```bash
npm install
npm run android
```

Si apre Android Studio sulla cartella `android`.
