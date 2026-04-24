import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// === Garde anti-iframe / preview Lovable pour le service worker PWA ===
// Le SW ne doit s'enregistrer QUE sur le site publié (jamais dans le preview Lovable),
// sinon il pollue le cache et bloque les mises à jour.
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true; // accès cross-origin bloqué => on considère qu'on est en iframe
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.endsWith(".lovable.app") === false
    ? false
    : window.location.hostname.includes("id-preview--") ||
      window.location.hostname.includes("lovableproject.com");

const shouldDisableSW = isInIframe || isPreviewHost;

if (shouldDisableSW && "serviceWorker" in navigator) {
  // Désinscrit tout SW déjà enregistré dans un contexte preview/iframe
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
} else if ("serviceWorker" in navigator && import.meta.env.PROD) {
  // En production hors iframe, on enregistre le SW généré par vite-plugin-pwa
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
