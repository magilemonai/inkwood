import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// GoatCounter pageview (no_onload is set, so we count manually).
// If the async script hasn't loaded yet, retry briefly.
{
  const fire = (tries = 0) => {
    const gc = (window as unknown as { goatcounter?: { count?: (opts?: object) => void } }).goatcounter;
    if (gc?.count) gc.count();
    else if (tries < 20) setTimeout(() => fire(tries + 1), 200);
  };
  if (typeof window !== "undefined") fire();
}
