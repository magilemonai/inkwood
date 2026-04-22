import { useRef, useEffect, useSyncExternalStore, useCallback } from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

let nextParticleId = 1;

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
    id: nextParticleId++,
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

/**
 * Animated particle system using requestAnimationFrame.
 * Returns a snapshot array that updates ~12fps via useSyncExternalStore.
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
    // Honor prefers-reduced-motion: skip the rAF loop and render no
    // particles. The rest of the scene still renders statically.
    if (!active || prefersReducedMotion()) {
      store.particles = [];
      store.snapshot = [];
      store.listeners.forEach((l) => l());
      return;
    }

    // Initialize particles
    store.particles = [];
    for (let i = 0; i < config.count; i++) {
      store.particles.push(spawnParticle(config, true));
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

      // Throttle React notifications to ~12fps
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

