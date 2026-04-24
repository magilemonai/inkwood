import { useRef, useEffect, useSyncExternalStore, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface ParticleConfig {
  count: number;
  bounds: { x: number; y: number; width: number; height: number };
  colors: string[];
  sizeRange: [number, number];
  speedRange: [number, number];
  driftX?: number;
  driftY?: number;
  lifeRange: [number, number];
}

function spawnParticle(config: ParticleConfig, randomAge: boolean): Particle {
  const { bounds, colors, sizeRange, speedRange, lifeRange, driftX = 0, driftY = -8 } = config;
  const life = lifeRange[0] + Math.random() * (lifeRange[1] - lifeRange[0]);
  return {
    x: bounds.x + Math.random() * bounds.width,
    y: bounds.y + Math.random() * bounds.height,
    vx: (Math.random() - 0.5) * speedRange[1] + driftX,
    vy: driftY + (Math.random() - 0.5) * speedRange[0],
    life: randomAge ? Math.random() * life : life,
    maxLife: life,
    size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animated particle system using requestAnimationFrame.
 * Returns a snapshot array that updates ~12fps via useSyncExternalStore.
 *
 * Accessibility: when prefers-reduced-motion is set, a static spawn-pass
 * is emitted once and the animation loop is skipped entirely. The scene
 * still renders the atmospheric particles — they just don't drift.
 */
export function useParticles(config: ParticleConfig, active: boolean): Particle[] {
  const storeRef = useRef({
    particles: [] as Particle[],
    snapshot: [] as Particle[],
    listeners: new Set<() => void>(),
  });

  const subscribe = useCallback((cb: () => void) => {
    storeRef.current.listeners.add(cb);
    return () => { storeRef.current.listeners.delete(cb); };
  }, []);

  const getSnapshot = useCallback(() => storeRef.current.snapshot, []);

  useEffect(() => {
    const store = storeRef.current;
    if (!active) {
      store.particles = [];
      store.snapshot = [];
      store.listeners.forEach((l) => l());
      return;
    }

    store.particles = [];
    for (let i = 0; i < config.count; i++) {
      store.particles.push(spawnParticle(config, true));
    }

    // Reduced-motion: seed a static snapshot and skip the rAF loop.
    if (prefersReducedMotion()) {
      store.snapshot = [...store.particles];
      store.listeners.forEach((l) => l());
      return;
    }

    let lastTime = 0;
    let lastNotify = 0;
    let frame: number;

    const tick = (now: number) => {
      if (lastTime === 0) lastTime = now;
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const ps = store.particles;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) {
          ps[i] = spawnParticle(config, false);
        }
      }

      if (now - lastNotify > 80) {
        lastNotify = now;
        store.snapshot = [...ps];
        store.listeners.forEach((l) => l());
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, config.count]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
