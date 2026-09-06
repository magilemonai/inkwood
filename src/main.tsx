import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App";
import { armServiceWorkerHandoff } from "./pwa";

// Swap to a freshly deployed build as soon as its service worker takes
// control, instead of showing the previous build until the next load.
armServiceWorkerHandoff();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
