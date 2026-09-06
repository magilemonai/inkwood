/**
 * Service-worker update handoff.
 *
 * The PWA precaches each build and serves it cache-first. After a deploy,
 * the first load still shows the previous build while the new worker
 * installs, skips waiting, and claims the page — and nothing reloaded, so
 * players (and the director testing a gate) saw stale code until a second
 * load. This swaps to the fresh build the moment the new worker takes
 * control.
 *
 * Guards: never on a first visit's initial install (the page wasn't
 * controlled yet, so a controllerchange there is the worker arriving, not
 * an update), and never mid-phrase — a reload would eat the words being
 * typed. In that case the next natural load picks the build up.
 */

import { useGameStore } from "./store";

export function armServiceWorkerHandoff() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (navigator.serviceWorker.controller === null) return;

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    if (useGameStore.getState().typed.length > 0) return;
    refreshing = true;
    window.location.reload();
  });
}
