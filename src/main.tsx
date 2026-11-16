import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./app/App";
import "./index.css";

const SERVICE_WORKER_UPDATE_INTERVAL_MS = 60 * 60 * 1000;

function registerPwaUpdates() {
  registerSW({
    immediate: true,
    onRegisteredSW: (_serviceWorkerUrl, registration) => {
      if (!registration) return;

      const checkForUpdate = () => {
        if (!navigator.onLine) return;
        void registration.update().catch(() => undefined);
      };

      checkForUpdate();
      window.setInterval(checkForUpdate, SERVICE_WORKER_UPDATE_INTERVAL_MS);
      window.addEventListener("online", checkForUpdate);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });
    },
  });
}

registerPwaUpdates();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("No se encontró el elemento raíz #root");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
