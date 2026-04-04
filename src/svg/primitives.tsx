/**
 * Reusable SVG shape primitives for organic, high-fidelity scene art.
 * All components accept `progress` (0-1) to animate with typing.
 */

/** Smooth rolling hill / terrain curve */
export function Hill({
  y,
  height = 40,
  color,
  opacity = 1,
  seed = 0,
}: {
  y: number;
  height?: number;
  color: string;
  opacity?: number;
  seed?: number;
}) {
  // Generate a gentle, organic hill curve
  const points = [];
  const w = 400;
  for (let x = 0; x <= w; x += 2) {
    const t = x / w;
    const h =
      Math.sin(t * Math.PI + seed) * height * 0.4 +
      Math.sin(t * Math.PI * 2.3 + seed * 1.7) * height * 0.25 +
      Math.sin(t * Math.PI * 4.1 + seed * 0.5) * height * 0.1;
    points.push(`${x},${y - h}`);
  }
  return (
    <polygon
      points={`0,250 ${points.join(" ")} 400,250`}
      fill={color}
      opacity={opacity}
    />
  );
}

/** Organic tree silhouette with bezier trunk and canopy */
export function TreeSilhouette({
  x,
  y,
  height = 60,
  spread = 30,
  color = "#0a0c06",
  opacity = 1,
}: {
  x: number;
  y: number;
  height?: number;
  spread?: number;
  color?: string;
  opacity?: number;
}) {
  const trunkW = spread * 0.15;
  const topY = y - height;
  const canopyR = spread * 0.65;
  return (
    <g opacity={opacity}>
      {/* Trunk — slight curve */}
      <path
        d={`M${x - trunkW} ${y}
            C${x - trunkW * 0.5} ${y - height * 0.3},
             ${x - trunkW * 1.2} ${y - height * 0.6},
             ${x - trunkW * 0.3} ${topY + canopyR * 0.5}
            L${x + trunkW * 0.3} ${topY + canopyR * 0.5}
            C${x + trunkW * 1.2} ${y - height * 0.6},
             ${x + trunkW * 0.5} ${y - height * 0.3},
             ${x + trunkW} ${y}
            Z`}
        fill={color}
      />
      {/* Canopy — stacked ellipses for organic shape */}
      <ellipse cx={x} cy={topY + canopyR * 0.3} rx={canopyR} ry={canopyR * 0.8} fill={color} />
      <ellipse cx={x - canopyR * 0.3} cy={topY + canopyR * 0.1} rx={canopyR * 0.7} ry={canopyR * 0.65} fill={color} />
      <ellipse cx={x + canopyR * 0.35} cy={topY + canopyR * 0.15} rx={canopyR * 0.65} ry={canopyR * 0.6} fill={color} />
    </g>
  );
}

/** Cloud — soft multi-ellipse cloud */
export function Cloud({
  x,
  y,
  scale = 1,
  opacity = 0.4,
  color = "white",
}: {
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
  color?: string;
}) {
  return (
    <g opacity={opacity}>
      <ellipse cx={x} cy={y} rx={32 * scale} ry={10 * scale} fill={color} />
      <ellipse cx={x - 18 * scale} cy={y - 4 * scale} rx={22 * scale} ry={8 * scale} fill={color} />
      <ellipse cx={x + 20 * scale} cy={y - 3 * scale} rx={25 * scale} ry={9 * scale} fill={color} />
      <ellipse cx={x + 5 * scale} cy={y - 7 * scale} rx={18 * scale} ry={7 * scale} fill={color} />
    </g>
  );
}

/** Flower with organic petals */
export function Flower({
  x,
  y,
  stemHeight,
  petalColor,
  petalCount = 5,
  petalSize = 8,
  progress = 1,
}: {
  x: number;
  y: number;
  stemHeight: number;
  petalColor: string;
  petalCount?: number;
  petalSize?: number;
  progress?: number;
}) {
  const headY = y - stemHeight * progress;
  const ps = petalSize * progress;
  return (
    <g opacity={progress}>
      {/* Stem — slight curve */}
      <path
        d={`M${x} ${y} Q${x + 3} ${y - stemHeight * 0.5} ${x} ${headY}`}
        fill="none"
        stroke="#2a5a1a"
        strokeWidth={2}
      />
      {/* Leaf on stem */}
      {stemHeight > 30 && (
        <path
          d={`M${x} ${y - stemHeight * 0.4 * progress}
              Q${x + 10} ${y - stemHeight * 0.5 * progress}
               ${x + 14} ${y - stemHeight * 0.35 * progress}
              Q${x + 8} ${y - stemHeight * 0.38 * progress}
               ${x} ${y - stemHeight * 0.4 * progress}`}
          fill="#2a6a1a"
          opacity={progress * 0.7}
        />
      )}
      {/* Petals */}
      {Array.from({ length: petalCount }).map((_, i) => {
        const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
        const px = x + Math.cos(angle) * ps * 1.2;
        const py = headY + Math.sin(angle) * ps * 1.2;
        return (
          <ellipse
            key={i}
            cx={px}
            cy={py}
            rx={ps * 0.7}
            ry={ps * 0.45}
            fill={petalColor}
            transform={`rotate(${(angle * 180) / Math.PI + 90}, ${px}, ${py})`}
          />
        );
      })}
      {/* Center */}
      <circle cx={x} cy={headY} r={ps * 0.38} fill="#f5e060" />
      <circle cx={x} cy={headY} r={ps * 0.2} fill="#e8c830" />
    </g>
  );
}

/** Rain drops — array of animated streaks */
export function Rain({
  intensity = 1,
  opacity = 0.5,
  color = "#a0c8e8",
  windAngle = -3,
}: {
  intensity?: number;
  opacity?: number;
  color?: string;
  windAngle?: number;
}) {
  const drops = Array.from({ length: Math.floor(30 * intensity) }, (_, i) => ({
    x: (i * 37 + 13) % 400,
    y: (i * 71 + 7) % 200,
    len: 10 + (i % 5) * 3,
  }));
  return (
    <g opacity={opacity}>
      {drops.map((d, i) => (
        <line
          key={i}
          x1={d.x}
          y1={d.y}
          x2={d.x + windAngle}
          y2={d.y + d.len}
          stroke={color}
          strokeWidth={1 + (i % 3) * 0.3}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

/** Grass blades along a line */
export function GrassRow({
  y,
  color,
  count = 30,
  maxHeight = 18,
  progress = 1,
}: {
  y: number;
  color: string;
  count?: number;
  maxHeight?: number;
  progress?: number;
}) {
  return (
    <g opacity={progress}>
      {Array.from({ length: count }).map((_, i) => {
        const x = (i / count) * 400 + ((i * 7) % 13);
        const h = (maxHeight * 0.5 + ((i * 3) % maxHeight) * 0.5) * progress;
        const lean = ((i % 5) - 2) * 2;
        return (
          <path
            key={i}
            d={`M${x} ${y} Q${x + lean} ${y - h * 0.6} ${x + lean * 1.3} ${y - h}`}
            fill="none"
            stroke={color}
            strokeWidth={1.2 + (i % 3) * 0.3}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

/** Star with glow halo */
export function Star({
  x,
  y,
  radius = 2,
  opacity = 1,
  color = "white",
  glowRadius = 8,
}: {
  x: number;
  y: number;
  radius?: number;
  opacity?: number;
  color?: string;
  glowRadius?: number;
}) {
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={glowRadius} fill={color} opacity={0.06} />
      <circle cx={x} cy={y} r={radius * 1.8} fill={color} opacity={0.15} />
      <circle cx={x} cy={y} r={radius} fill={color} />
    </g>
  );
}

/** Firefly / spirit wisp particle */
export function Wisp({
  x,
  y,
  color = "#d8e8c8",
  radius = 2.5,
  opacity = 0.6,
}: {
  x: number;
  y: number;
  color?: string;
  radius?: number;
  opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={radius * 4} fill={color} opacity={0.06} />
      <circle cx={x} cy={y} r={radius * 2} fill={color} opacity={0.12} />
      <circle cx={x} cy={y} r={radius} fill={color} opacity={0.5} />
      <circle cx={x} cy={y} r={radius * 0.4} fill="white" opacity={0.7} />
    </g>
  );
}

/** Stone block with organic edges */
export function StoneBlock({
  x,
  y,
  width,
  height,
  color = "#3a3a38",
  roughness = 3,
  seed = 0,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  roughness?: number;
  seed?: number;
}) {
  const r = roughness;
  const s = seed;
  // Generate slightly irregular rectangle
  const tl = { x: x + ((s * 3) % r), y: y + ((s * 7) % r) };
  const tr = { x: x + width - ((s * 5) % r), y: y + ((s * 2) % r) - r * 0.3 };
  const br = { x: x + width - ((s * 4) % r) + r * 0.2, y: y + height - ((s * 6) % r) };
  const bl = { x: x + ((s * 8) % r) - r * 0.2, y: y + height - ((s * 1) % r) + r * 0.3 };

  return (
    <path
      d={`M${tl.x} ${tl.y}
          L${tr.x} ${tr.y}
          L${br.x} ${br.y}
          L${bl.x} ${bl.y} Z`}
      fill={color}
    />
  );
}
