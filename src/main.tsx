import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./pwa/registerSW";
import { initTheme } from "./hooks/useTheme";

initTheme();

createRoot(document.getElementById("root")!).render(<App />);

registerServiceWorker();
