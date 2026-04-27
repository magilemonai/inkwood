// Thin GoatCounter wrapper. The script in index.html sets
// `no_onload: true`, so every pageview — including the first — is fired
// from here. If the async script hasn't arrived yet, queue and retry.

interface GoatCounter {
  count?: (opts: { path: string; title?: string; event?: boolean }) => void;
}

function getGC(): GoatCounter | undefined {
  return (window as unknown as { goatcounter?: GoatCounter }).goatcounter;
}

export function trackPageview(path: string, title?: string, tries = 0) {
  if (typeof window === "undefined") return;
  const gc = getGC();
  if (gc?.count) {
    gc.count({ path, title });
  } else if (tries < 25) {
    setTimeout(() => trackPageview(path, title, tries + 1), 200);
  }
}
