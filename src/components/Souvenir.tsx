import { LEVELS } from "../levels";

interface Props {
  date: Date;
  svgRef?: React.Ref<SVGSVGElement>;
}

/**
 * Souvenir — a static 1200×800 "postcard" SVG summarising the player's
 * journey through all ten levels. Rendered hidden in the DOM on the
 * outro screen so it can be serialised and downloaded as a PNG.
 *
 * Intentionally self-contained: all defs (gradients, filters) are
 * inline and all colours are hard-coded so the serialised SVG renders
 * identically outside the React tree.
 */

const WIDTH = 1200;
const HEIGHT = 800;

// Eight vignettes spaced across the horizon, mirroring OutroSequence
// but compressed into the inset panel area (x 100..1100).
const VIGNETTES: Array<{ x: number; accent: string; name: string }> = [
  { x: 170, accent: "#6bbf6b", name: "garden" },
  { x: 290, accent: "#e89a30", name: "cottage" },
  { x: 400, accent: "#9090f8", name: "stars" },
  { x: 500, accent: "#50b8b8", name: "well" },
  { x: 700, accent: "#7aaa6a", name: "bridge" },
  { x: 820, accent: "#c088b0", name: "library" },
  { x: 930, accent: "#88a8c8", name: "stones" },
  { x: 1040, accent: "#d0b870", name: "sanctum" },
];

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function Souvenir({ date, svgRef }: Props) {
  const dateLabel = formatDate(date);
  // Horizon y in the inset panel coordinate space.
  const horizonY = 560;
  // Great tree anchor (centre).
  const treeX = 600;
  const treeBaseY = 600;

  return (
    <svg
      ref={svgRef}
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <linearGradient id="souv-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0e1a" />
          <stop offset="55%" stopColor="#141022" />
          <stop offset="100%" stopColor="#20180c" />
        </linearGradient>
        <linearGradient id="souv-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c0f0a" />
          <stop offset="100%" stopColor="#050705" />
        </linearGradient>
        <radialGradient id="souv-radiance" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#d8c890" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#d8c890" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#d8c890" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="souv-canopy" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#9ac888" stopOpacity="0.7" />
          <stop offset="65%" stopColor="#5a8850" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#2a4020" stopOpacity="0.0" />
        </radialGradient>
        <radialGradient id="souv-moon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0e4c0" stopOpacity="1" />
          <stop offset="55%" stopColor="#d8c890" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#d8c890" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Paper background */}
      <rect width={WIDTH} height={HEIGHT} fill="#0a0806" />

      {/* Outer decorative frame — thin double line in old-gold */}
      <rect
        x="32" y="32" width={WIDTH - 64} height={HEIGHT - 64}
        fill="none" stroke="#3a2e1e" strokeWidth="1"
      />
      <rect
        x="40" y="40" width={WIDTH - 80} height={HEIGHT - 80}
        fill="none" stroke="#5a4828" strokeWidth="0.6"
      />

      {/* Corner ornaments — simple filled diamonds */}
      {[
        [60, 60], [WIDTH - 60, 60], [60, HEIGHT - 60], [WIDTH - 60, HEIGHT - 60],
      ].map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx} ${cy}) rotate(45)`}>
          <rect x="-3" y="-3" width="6" height="6" fill="#8a6a3a" opacity="0.6" />
          <rect x="-1.2" y="-1.2" width="2.4" height="2.4" fill="#d8c890" opacity="0.7" />
        </g>
      ))}

      {/* ── Title ── */}
      <text
        x={WIDTH / 2} y="130"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="62"
        fill="#d8c8a0"
        letterSpacing="18"
      >
        INKWOOD
      </text>
      <text
        x={WIDTH / 2} y="165"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="18"
        fontStyle="italic"
        fill="#8a7a60"
        letterSpacing="2"
      >
        — a journey through the forest —
      </text>

      {/* ── Scene panel ── */}
      <g>
        {/* Sky */}
        <rect
          x="80" y="210" width={WIDTH - 160} height="430"
          fill="url(#souv-sky)"
        />

        {/* Subtle scene border */}
        <rect
          x="80" y="210" width={WIDTH - 160} height="430"
          fill="none" stroke="#2a2418" strokeWidth="1"
        />

        {/* Clip everything inside the scene panel */}
        <clipPath id="souv-clip">
          <rect x="80" y="210" width={WIDTH - 160} height="430" />
        </clipPath>

        <g clipPath="url(#souv-clip)">
          {/* Moon — upper right */}
          <g>
            <circle cx="970" cy="300" r="60" fill="url(#souv-moon)" />
            <circle cx="970" cy="300" r="22" fill="#f0e4c0" opacity="0.9" />
            <circle cx="958" cy="293" r="20" fill="#141022" opacity="0.85" />
          </g>

          {/* Scattered stars */}
          {[
            [180, 260], [240, 290], [320, 245], [420, 275], [530, 255],
            [640, 245], [750, 280], [200, 330], [380, 320], [480, 305],
            [850, 265], [1080, 320], [560, 320], [710, 310], [1020, 280],
            [110, 290], [135, 240], [265, 260], [305, 315],
          ].map(([x, y], i) => (
            <g key={i} opacity={0.5 + (i % 5) * 0.1}>
              <circle cx={x} cy={y} r="2.2" fill="#d8c890" opacity="0.2" />
              <circle cx={x} cy={y} r="0.9" fill="#f0e4c0" />
            </g>
          ))}

          {/* Horizon line */}
          <line
            x1="80" y1={horizonY}
            x2={WIDTH - 80} y2={horizonY}
            stroke="#3a4a3a" strokeWidth="1" opacity="0.7"
          />

          {/* Ground */}
          <rect
            x="80" y={horizonY}
            width={WIDTH - 160} height={640 - horizonY}
            fill="url(#souv-ground)"
          />

          {/* Golden radiance around the tree */}
          <ellipse
            cx={treeX} cy={horizonY + 10}
            rx="520" ry="240"
            fill="url(#souv-radiance)"
          />

          {/* Ley lines from tree base to each vignette */}
          {VIGNETTES.map((v, i) => {
            const dx = v.x - treeX;
            const midX = treeX + dx * 0.5;
            const midY = treeBaseY + 22 + Math.abs(dx) * 0.02;
            const endX = v.x;
            const endY = horizonY - 4;
            return (
              <g key={`ley${i}`}>
                <path
                  d={`M${treeX} ${treeBaseY} Q${midX} ${midY} ${endX} ${endY}`}
                  fill="none" stroke="#3a2e1a" strokeWidth="3" opacity="0.55"
                />
                <path
                  d={`M${treeX} ${treeBaseY} Q${midX} ${midY} ${endX} ${endY}`}
                  fill="none" stroke="#d8c890" strokeWidth="1.2" opacity="0.35"
                />
              </g>
            );
          })}

          {/* Vignette markers — small glowing dots in each level's accent */}
          {VIGNETTES.map((v, i) => (
            <g key={`v${i}`}>
              <circle cx={v.x} cy={horizonY - 4} r="14" fill={v.accent} opacity="0.12" />
              <circle cx={v.x} cy={horizonY - 4} r="6" fill={v.accent} opacity="0.35" />
              <circle cx={v.x} cy={horizonY - 4} r="2.5" fill="#f0e4c0" opacity="0.9" />
            </g>
          ))}

          {/* Great tree — trunk */}
          <path
            d={`M${treeX - 10} ${treeBaseY}
                C${treeX - 16} ${treeBaseY - 70}, ${treeX - 20} ${treeBaseY - 140}, ${treeX - 10} ${treeBaseY - 220}
                L${treeX + 10} ${treeBaseY - 220}
                C${treeX + 20} ${treeBaseY - 140}, ${treeX + 16} ${treeBaseY - 70}, ${treeX + 10} ${treeBaseY}
                Z`}
            fill="#1a120a"
          />
          {/* Trunk highlight */}
          <path
            d={`M${treeX - 6} ${treeBaseY - 10}
                C${treeX - 10} ${treeBaseY - 80}, ${treeX - 12} ${treeBaseY - 150}, ${treeX - 6} ${treeBaseY - 210}`}
            fill="none" stroke="#2a1a0e" strokeWidth="2"
          />

          {/* Branches */}
          {[
            { x2: -70, y2: -180, c1x: -30, c1y: -160 },
            { x2:  70, y2: -180, c1x:  30, c1y: -160 },
            { x2: -100, y2: -140, c1x: -40, c1y: -140 },
            { x2:  100, y2: -140, c1x:  40, c1y: -140 },
            { x2: -40, y2: -230, c1x: -15, c1y: -200 },
            { x2:  40, y2: -230, c1x:  15, c1y: -200 },
          ].map((b, i) => (
            <path
              key={`br${i}`}
              d={`M${treeX} ${treeBaseY - 170}
                  Q${treeX + b.c1x} ${treeBaseY + b.c1y} ${treeX + b.x2} ${treeBaseY + b.y2}`}
              fill="none" stroke="#1a120a" strokeWidth={3 - i * 0.2}
            />
          ))}

          {/* Canopy — layered elliptical foliage */}
          {[
            { cx: 0,   cy: -230, rx: 95, ry: 55 },
            { cx: -55, cy: -215, rx: 60, ry: 40 },
            { cx:  55, cy: -215, rx: 60, ry: 40 },
            { cx: -25, cy: -255, rx: 48, ry: 32 },
            { cx:  25, cy: -255, rx: 48, ry: 32 },
          ].map((c, i) => (
            <ellipse
              key={`cp${i}`}
              cx={treeX + c.cx} cy={treeBaseY + c.cy}
              rx={c.rx} ry={c.ry}
              fill="#3a5a30" opacity="0.82"
            />
          ))}

          {/* Canopy highlight glow */}
          <ellipse
            cx={treeX} cy={treeBaseY - 235}
            rx="130" ry="75"
            fill="url(#souv-canopy)"
          />

          {/* Spirit lights in canopy */}
          {[
            [-42, -245], [0, -260], [38, -240], [-15, -225], [22, -232], [-60, -210], [55, -215],
          ].map(([dx, dy], i) => (
            <g key={`sl${i}`}>
              <circle cx={treeX + dx} cy={treeBaseY + dy} r="6" fill="#b8d8a8" opacity="0.15" />
              <circle cx={treeX + dx} cy={treeBaseY + dy} r="2.2" fill="#e8f0d0" opacity="0.7" />
              <circle cx={treeX + dx} cy={treeBaseY + dy} r="0.8" fill="#ffffff" opacity="0.9" />
            </g>
          ))}
        </g>
      </g>

      {/* ── Dot row — ten accent dots, one per level ── */}
      <g transform={`translate(${WIDTH / 2} 680)`}>
        {LEVELS.map((l, i) => {
          const spacing = 22;
          const x = (i - (LEVELS.length - 1) / 2) * spacing;
          return (
            <g key={i}>
              <circle cx={x} cy="0" r="5.5" fill={l.accent} opacity="0.25" />
              <circle cx={x} cy="0" r="3" fill={l.accent} />
            </g>
          );
        })}
      </g>

      {/* ── Quote ── */}
      <text
        x={WIDTH / 2} y="726"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="24"
        fontStyle="italic"
        fill="#c8b890"
        letterSpacing="1"
      >
        the forest remembers.
      </text>

      {/* ── Date ── */}
      <text
        x={WIDTH / 2} y="754"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="14"
        fill="#6a5a4a"
        letterSpacing="2"
      >
        {dateLabel}
      </text>
    </svg>
  );
}
