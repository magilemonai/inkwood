import { useRef, useEffect, useState } from "react";

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
  /** Bounding box for particle spawn */
  bounds: { x: number; y: number; width: number; height: number };
  /** Particle colors — one picked randomly per particle */
  colors: string[];
  /** Size range [min, max] */
  sizeRange: [number, number];
  /** Velocity range — pixels per second */
  speedRange: [number, number];
  /** Direction bias: -1 = left, 0 = up, 1 = right */
  driftX?: number;
  /** Upward drift speed (negative = up) */
  driftY?: number;
  /** Lifetime range in seconds [min, max] */
  lifeRange: [number, number];
  /** Overall opacity multiplier */
  opacity?: number;
}

/**
 * Animated particle system using requestAnimationFrame.
 * Returns an array of particles with positions that update each frame.
 * Particles drift, fade out, and respawn automatically.
 */
export function useParticles(config: ParticleConfig, active: boolean): Particle[] {
  const [particles, setParticles] = useState<Particle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (!active) {
      particlesRef.current = [];
      setParticles([]);
      return;
    }

    // Initialize particles
    const initial: Particle[] = [];
    for (let i = 0; i < config.count; i++) {
      initial.push(spawnParticle(config, true));
    }
    particlesRef.current = initial;

    const tick = (now: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = now;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1); // cap at 100ms
      lastTimeRef.current = now;

      const ps = particlesRef.current;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        // Respawn if dead
        if (p.life <= 0) {
          ps[i] = spawnParticle(config, false);
        }
      }

      // Throttle React updates to ~12fps
      if (now % 80 < 17) {
        setParticles([...ps]);
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameRef.current);
      lastTimeRef.current = 0;
    };
  }, [active, config.count]);

  return particles;
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

/** Render particles as SVG circles */
export function ParticleField({ particles, opacity = 1 }: { particles: Particle[]; opacity?: number }) {
  return (
    <g>
      {particles.map((p, i) => {
        const lifeRatio = Math.max(0, p.life / p.maxLife);
        // Fade in during first 20% of life, fade out during last 30%
        const fade = lifeRatio > 0.7 ? (1 - lifeRatio) / 0.3 : lifeRatio < 0.3 ? lifeRatio / 0.3 : 1;
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.size * (0.5 + fade * 0.5)}
            fill={p.color}
            opacity={fade * opacity}
          />
        );
      })}
    </g>
  );
}
