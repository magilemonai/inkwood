interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

/** Render particles as SVG circles with fade lifecycle */
export default function ParticleField({ particles, opacity = 1 }: { particles: Particle[]; opacity?: number }) {
  return (
    <g>
      {particles.map((p) => {
        const lifeRatio = Math.max(0, p.life / p.maxLife);
        const fade = lifeRatio > 0.7 ? (1 - lifeRatio) / 0.3 : lifeRatio < 0.3 ? lifeRatio / 0.3 : 1;
        return (
          <circle
            key={p.id}
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
