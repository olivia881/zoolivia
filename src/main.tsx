import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { registerNotificationVoiceListener } from "./notificationVoiceListener";
import "./index.css";

registerNotificationVoiceListener();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
