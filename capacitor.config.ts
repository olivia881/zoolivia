/// <reference types="@capacitor/local-notifications" />

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "it.promemoria.rifiuti",
  appName: "Turni di servizio",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_rifiuti",
      iconColor: "#0d9488",
    },
  },
};

export default config;
