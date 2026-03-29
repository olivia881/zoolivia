/// <reference types="@capacitor/local-notifications" />

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "it.turni.servizio",
  appName: "Turni di servizio",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_turni",
      iconColor: "#1e40af",
    },
  },
};

export default config;
