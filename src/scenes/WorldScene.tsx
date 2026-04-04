import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter, MistFilter } from "../svg/filters";
import { Wisp } from "../svg/primitives";

/** Helper: clamp progress into a sub-range for staggered entry */
function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

/** Location node data */
const locations = [
  { x: 75,  y: 55,  label: "garden",  color: "#6bbf6b", delay: 0 },
  { x: 180, y: 38,  label: "cottage", color: "#e89a30", delay: 0.06 },
  { x: 310, y: 50,  label: "stars",   color: "#9090f8", delay: 0.12 },
  { x: 42,  y: 135, label: "well",    color: "#50b8b8", delay: 0.18 },
  { x: 358, y: 125, label: "bridge",  color: "#7aaa6a", delay: 0.24 },
  { x: 115, y: 170, label: "library", color: "#c088b0", delay: 0.30 },
  { x: 305, y: 178, label: "stones",  color: "#88a8c8", delay: 0.36 },
  { x: 200, y: 120, label: "sanctum", color: "#d0b870", delay: 0.42 },
  { x: 215, y: 65,  label: "tree",    color: "#b8c8a8", delay: 0.48 },
];

/** The 10th "world" node — center bottom, larger */
const worldNode = { x: 200, y: 215, label: "world", color: "#d8c890", delay: 0.54 };

/** Ley line connections between node indices (and -1 for worldNode) */
const connections: [number, number][] = [
  [0, 1], [1, 2], [0, 3], [2, 4], [3, 5], [4, 6],
  [5, 7], [6, 7], [7, 8], [1, 8], [3, 7], [4, 7],
  [5, -1], [6, -1], [7, -1], [8, -1],
];

function getNode(idx: number) {
  return idx === -1 ? worldNode : locations[idx];
}

function WorldScene({ progress: p }: SceneProps) {
  // Background warmth
  const bgH = 220 - p * 30;
  const bgS = 6 + p * 8;
  const bgL = 4 + p * 4;

  // Central radial glow expansion
  const centralGlowR = p * 0.9;

  // Final radiance
  const finalP = sub(p, 0.9, 0.1);

  // Topographic lines — faint background map texture
  const topoLines = [
    "M10,80 Q100,65 200,75 Q300,85 390,70",
    "M10,120 Q80,110 160,118 Q260,128 390,115",
    "M10,160 Q120,148 200,155 Q310,165 390,152",
    "M10,200 Q90,192 200,198 Q320,205 390,195",
    "M10,45 Q110,38 200,42 Q330,48 390,40",
  ];

  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="nodeGlow" radius={8} color="#d8c890" opacity={0.4} />
        <GlowFilter id="leyGlow" radius={3} color="#d8c890" opacity={0.3} />
        <GlowFilter id="pulseGlow" radius={4} color="#fffff0" opacity={0.5} />
        <GlowFilter id="worldNodeGlow" radius={12} color="#d8c890" opacity={0.5} />
        <MistFilter id="bgMist" scale={0.008} opacity={0.15} />

        {/* Background gradient */}
        <linearGradient id="worldSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${bgH + 10}, ${bgS}%, ${bgL + 2}%)`} />
          <stop offset="50%" stopColor={`hsl(${bgH}, ${bgS - 2}%, ${bgL}%)`} />
          <stop offset="100%" stopColor={`hsl(${bgH - 10}, ${bgS + 2}%, ${bgL + 1}%)`} />
        </linearGradient>

        {/* Central radial glow */}
        <radialGradient id="centralGlow" cx="50%" cy="52%" r="55%">
          <stop offset="0%" stopColor="#d8c890" stopOpacity={centralGlowR * 0.15} />
          <stop offset="50%" stopColor="#d8c890" stopOpacity={centralGlowR * 0.06} />
          <stop offset="100%" stopColor="#d8c890" stopOpacity={0} />
        </radialGradient>

        {/* Final radiance burst */}
        <radialGradient id="finalRadiance" cx="50%" cy="86%" r="50%">
          <stop offset="0%" stopColor="#fffff0" stopOpacity={finalP * 0.2} />
          <stop offset="30%" stopColor="#d8c890" stopOpacity={finalP * 0.1} />
          <stop offset="100%" stopColor="#d8c890" stopOpacity={0} />
        </radialGradient>

        {/* Per-node glow gradients */}
        {[...locations, worldNode].map((loc, i) => (
          <radialGradient key={`ng-${i}`} id={`nodeGrad-${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={loc.color} stopOpacity={0.5} />
            <stop offset="60%" stopColor={loc.color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={loc.color} stopOpacity={0} />
          </radialGradient>
        ))}

        {/* Parallax animations */}
        <style>{`
          @keyframes parallaxSlow { 0%,100% { transform: translateX(0); } 50% { transform: translateX(-3px); } }
          @keyframes parallaxMed { 0%,100% { transform: translateX(0); } 50% { transform: translateX(2px); } }
          @keyframes parallaxFast { 0%,100% { transform: translateX(0); } 50% { transform: translateX(-1px) translateY(-1px); } }
          .bgLayer { animation: parallaxSlow 12s ease-in-out infinite; }
          .midLayer { animation: parallaxMed 10s ease-in-out infinite; }
          .fgLayer { animation: parallaxFast 8s ease-in-out infinite; }
        `}</style>
      </defs>

      {/* ── Background ── */}
      <rect width="400" height="250" fill="url(#worldSky)" />

      <g className="bgLayer">
      {/* ── Atmospheric mist overlay ── */}
      <rect width="400" height="250" fill="#2a2820" opacity={0.1} filter="url(#bgMist)" />

      {/* ── Central glow ── */}
      <rect width="400" height="250" fill="url(#centralGlow)" />

      {/* ── Topographic background lines ── */}
      {topoLines.map((d, i) => (
        <path
          key={`topo-${i}`}
          d={d}
          fill="none"
          stroke="#d8c890"
          strokeWidth={0.4}
          opacity={sub(p, 0.02 + i * 0.04, 0.15) * 0.08}
        />
      ))}

      </g>{/* end bgLayer */}

      <g className="midLayer">
      {/* ── Ley line connections ── */}
      {connections.map(([a, b], i) => {
        const la = getNode(a);
        const lb = getNode(b);
        const maxDelay = Math.max(la.delay, lb.delay);
        const cp = sub(p, maxDelay + 0.05, 0.15);
        if (cp <= 0) return null;

        // Midpoint offset for slight curve
        const mx = (la.x + lb.x) / 2 + ((i % 3) - 1) * 8;
        const my = (la.y + lb.y) / 2 + ((i % 5) - 2) * 5;

        // Estimate path length for line-drawing animation
        const lineLength = Math.sqrt((lb.x - la.x) ** 2 + (lb.y - la.y) ** 2) * 1.15;

        return (
          <g key={`ley-${i}`}>
            <path
              d={`M${la.x} ${la.y} Q${mx} ${my} ${lb.x} ${lb.y}`}
              fill="none"
              stroke="#d8c890"
              strokeWidth={1}
              strokeDasharray={lineLength}
              strokeDashoffset={lineLength * (1 - cp)}
              opacity={cp * 0.25}
            />
            {/* Brighter inner line */}
            <path
              d={`M${la.x} ${la.y} Q${mx} ${my} ${lb.x} ${lb.y}`}
              fill="none"
              stroke="#f0e8c0"
              strokeWidth={0.4}
              strokeDasharray={lineLength}
              strokeDashoffset={lineLength * (1 - cp)}
              opacity={cp * 0.15}
            />
          </g>
        );
      })}

      {/* ── Energy pulses along ley lines ── */}
      {p > 0.7 && connections.map(([a, b], i) => {
        const la = getNode(a);
        const lb = getNode(b);
        const maxDelay = Math.max(la.delay, lb.delay);
        const cp = sub(p, maxDelay + 0.05, 0.15);
        if (cp < 0.8) return null;

        // Pulse position oscillates along the line
        const pulseT = ((p - 0.7) * 6 + i * 0.25) % 1;
        const mx = (la.x + lb.x) / 2 + ((i % 3) - 1) * 8;
        const my = (la.y + lb.y) / 2 + ((i % 5) - 2) * 5;
        // Quadratic bezier point at t
        const t = pulseT;
        const omt = 1 - t;
        const px = omt * omt * la.x + 2 * omt * t * mx + t * t * lb.x;
        const py = omt * omt * la.y + 2 * omt * t * my + t * t * lb.y;
        const pulseAlpha = sub(p, 0.7, 0.15) * 0.5 * (1 - Math.abs(pulseT - 0.5) * 1.6);

        return (
          <g key={`pulse-${i}`}>
            <circle cx={px} cy={py} r={3} fill="#d8c890" opacity={pulseAlpha * 0.3} />
            <circle cx={px} cy={py} r={1.5} fill="#f0e8c0" opacity={pulseAlpha * 0.6} />
            <circle cx={px} cy={py} r={0.6} fill="white" opacity={pulseAlpha * 0.8} />
          </g>
        );
      })}

      {/* ── Location nodes ── */}
      {locations.map((loc, i) => {
        const lp = sub(p, loc.delay, 0.15);
        if (lp <= 0) return null;
        return (
          <g key={`node-${i}`}>
            {/* Outer glow halo */}
            <circle
              cx={loc.x} cy={loc.y} r={20 * lp}
              fill={`url(#nodeGrad-${i})`}
              opacity={lp * 0.6}
            />
            {/* Inner ring */}
            <circle
              cx={loc.x} cy={loc.y} r={8 * lp}
              fill="none" stroke={loc.color} strokeWidth={1.2}
              opacity={lp * 0.55}
            />
            {/* Bright core */}
            <circle
              cx={loc.x} cy={loc.y} r={4 * lp}
              fill={loc.color} opacity={lp * 0.8}
            />
            {/* White center point */}
            <circle
              cx={loc.x} cy={loc.y} r={1.5 * lp}
              fill="white" opacity={lp * 0.6}
            />
            {/* Subtle label */}
            <text
              x={loc.x} y={loc.y + 14}
              textAnchor="middle"
              fontSize={5}
              fill={loc.color}
              opacity={lp * 0.3}
              fontFamily="serif"
            >
              {loc.label}
            </text>
          </g>
        );
      })}

      {/* ── World node — the 10th, larger, center-bottom ── */}
      {(() => {
        const wp = sub(p, worldNode.delay, 0.18);
        if (wp <= 0) return null;
        return (
          <g>
            {/* Large outer glow */}
            <circle
              cx={worldNode.x} cy={worldNode.y} r={32 * wp}
              fill={`url(#nodeGrad-${locations.length})`}
              opacity={wp * 0.5}
              filter="url(#worldNodeGlow)"
            />
            {/* Secondary glow ring */}
            <circle
              cx={worldNode.x} cy={worldNode.y} r={18 * wp}
              fill="none" stroke="#d8c890" strokeWidth={0.8}
              opacity={wp * 0.3}
            />
            {/* Inner ring */}
            <circle
              cx={worldNode.x} cy={worldNode.y} r={12 * wp}
              fill="none" stroke="#d8c890" strokeWidth={1.5}
              opacity={wp * 0.55}
            />
            {/* Bright core */}
            <circle
              cx={worldNode.x} cy={worldNode.y} r={6 * wp}
              fill="#d8c890" opacity={wp * 0.8}
            />
            {/* White center */}
            <circle
              cx={worldNode.x} cy={worldNode.y} r={2.5 * wp}
              fill="white" opacity={wp * 0.65}
            />
            {/* Label */}
            <text
              x={worldNode.x} y={worldNode.y + 20}
              textAnchor="middle"
              fontSize={6}
              fill="#d8c890"
              opacity={wp * 0.35}
              fontFamily="serif"
            >
              world
            </text>
          </g>
        );
      })()}

      </g>{/* end midLayer */}

      <g className="fgLayer">
      {/* ── Ambient wisps near nodes ── */}
      {[
        { x: 85,  y: 70,  delay: 0.5, color: "#6bbf6b" },
        { x: 320, y: 65,  delay: 0.55, color: "#9090f8" },
        { x: 50,  y: 148, delay: 0.6, color: "#50b8b8" },
        { x: 348, y: 140, delay: 0.65, color: "#7aaa6a" },
        { x: 210, y: 130, delay: 0.7, color: "#d0b870" },
      ].map((w, i) => {
        const wp = sub(p, w.delay, 0.12);
        return wp > 0 ? (
          <Wisp
            key={`wisp-${i}`}
            x={w.x}
            y={w.y}
            color={w.color}
            radius={1.5}
            opacity={wp * 0.35}
          />
        ) : null;
      })}

      </g>{/* end fgLayer */}

      {/* ── Final radiance effect at 90%+ ── */}
      {finalP > 0 && (
        <g>
          <rect width="400" height="250" fill="url(#finalRadiance)" />
          <ellipse
            cx={200} cy={215}
            rx={120 * finalP} ry={60 * finalP}
            fill="#d8c890" opacity={finalP * 0.08}
          />
          <ellipse
            cx={200} cy={215}
            rx={70 * finalP} ry={35 * finalP}
            fill="#f0e8c0" opacity={finalP * 0.06}
          />
        </g>
      )}

      {/* Atmospheric particles — energy motes traveling along connections */}
      {Array.from({ length: 40 }).map((_, i) => {
        const px = (i * 47 + 13) % 400;
        const baseY = (i * 71 + 29) % 220 + 15;
        const drift = Math.sin(p * Math.PI * 2 + i * 0.7) * 8;
        const py = baseY - p * 30 * ((i % 5) / 5);
        const size = 0.5 + (i % 4) * 0.25;
        const opacity = (0.08 + (i % 3) * 0.06) * (0.3 + p * 0.7);
        return (
          <circle key={`p${i}`} cx={px + drift} cy={py} r={size}
            fill={i % 4 === 0 ? "#f0e8c0" : "#d8c890"} opacity={opacity} />
        );
      })}
    </svg>
  );
}

export default memo(WorldScene);
