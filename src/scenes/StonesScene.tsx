import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter, TextureFilter, MistFilter } from "../svg/filters";
import { Hill, Wisp, GrassRow } from "../svg/primitives";

function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

function StonesScene({ progress: p }: SceneProps) {
  const skyL = 5 + p * 6;
  const groundL = 7 + p * 5;

  // 7 standing stones — perspective arc, each unique
  const stones = [
    { x: 200, y: 85,  w: 22, h: 58, lean: 0,   delay: 0,    seed: 1 },
    { x: 138, y: 100, w: 20, h: 48, lean: -3,  delay: 0.08, seed: 3 },
    { x: 262, y: 98,  w: 21, h: 50, lean: 2,   delay: 0.15, seed: 5 },
    { x: 88,  y: 125, w: 18, h: 42, lean: -5,  delay: 0.22, seed: 7 },
    { x: 312, y: 122, w: 19, h: 44, lean: 4,   delay: 0.28, seed: 9 },
    { x: 62,  y: 158, w: 16, h: 35, lean: -4,  delay: 0.34, seed: 11 },
    { x: 338, y: 155, w: 17, h: 37, lean: 3,   delay: 0.4,  seed: 13 },
  ];

  // Ley lines connecting stones
  const leyLines = [
    { from: 0, to: 1, delay: 0.5 },
    { from: 0, to: 2, delay: 0.54 },
    { from: 1, to: 3, delay: 0.58 },
    { from: 2, to: 4, delay: 0.62 },
    { from: 3, to: 5, delay: 0.66 },
    { from: 4, to: 6, delay: 0.7 },
    { from: 5, to: 6, delay: 0.75 },
    { from: 1, to: 2, delay: 0.78 },
  ];

  // Small cairns between stones
  const cairns = [
    { x: 168, y: 195 },
    { x: 232, y: 193 },
    { x: 115, y: 205 },
    { x: 285, y: 203 },
  ];

  // Rune paths — simple angular marks
  const runeShapes = [
    "M0-5 L0 5 M-3-2 L3-2",
    "M-3-5 L0 0 L3-5 M0 0 L0 5",
    "M-3-4 L3-4 L3 4 L-3 4",
    "M0-5 L3 0 L0 5 L-3 0 Z",
    "M-3-5 L3 5 M3-5 L-3 5",
    "M-2-5 L-2 5 M2-5 L2 5 M-4 0 L4 0",
    "M0-5 L4 0 L0 5 M0-5 L-4 0 L0 5",
  ];

  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="runeGlow" radius={5} color="#88a8c8" opacity={0.6} />
        <GlowFilter id="leyGlow" radius={3} color="#88a8c8" opacity={0.5} />
        <TextureFilter id="stoneTex" scale={0.09} intensity={0.15} seed={2} />
        <MistFilter id="moorMist" scale={0.01} opacity={0.2} />

        {/* Sky gradient */}
        <linearGradient id="stonesSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(220, 12%, ${skyL + 4}%)`} />
          <stop offset="100%" stopColor={`hsl(215, 15%, ${skyL}%)`} />
        </linearGradient>

        {/* Aurora shimmer at top */}
        <linearGradient id="aurora" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#88a8c8" stopOpacity={0} />
          <stop offset="30%" stopColor="#88a8c8" stopOpacity={sub(p, 0.7, 0.2) * 0.08} />
          <stop offset="50%" stopColor="#a0b8d8" stopOpacity={sub(p, 0.7, 0.2) * 0.12} />
          <stop offset="70%" stopColor="#88a8c8" stopOpacity={sub(p, 0.7, 0.2) * 0.06} />
          <stop offset="100%" stopColor="#88a8c8" stopOpacity={0} />
        </linearGradient>

        {/* Ground glow */}
        <radialGradient id="stonesGlow" cx="50%" cy="45%" r="40%">
          <stop offset="0%" stopColor="#88a8c8" stopOpacity={p * 0.12} />
          <stop offset="100%" stopColor="#88a8c8" stopOpacity={0} />
        </radialGradient>
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

      {/* ── Sky ── */}
      <rect width="400" height="250" fill="url(#stonesSky)" />

      <g className="bgLayer">

      {/* ── Aurora at high progress ── */}
      {p > 0.7 && <rect x="60" y="5" width="280" height="40" fill="url(#aurora)" rx="20" />}

      {/* ── Distant hills ── */}
      <Hill y={175} height={22} color={`hsl(215, 10%, ${6 + p * 3}%)`} seed={0.5} />
      <Hill y={185} height={18} color={`hsl(218, 12%, ${7 + p * 3}%)`} seed={2.1} />

      {/* ── Ground plane ── */}
      <Hill y={195} height={12} color={`hsl(35, ${8 + p * 5}%, ${groundL}%)`} seed={1.3} />
      <rect x="0" y="205" width="400" height="45" fill={`hsl(35, ${8 + p * 5}%, ${groundL}%)`} />

      {/* ── Heather and scrub ── */}
      <GrassRow y={200} color={`hsl(30, ${15 + p * 8}%, ${12 + p * 5}%)`} count={30} maxHeight={8} progress={0.4 + p * 0.6} />
      <GrassRow y={210} color={`hsl(25, ${12 + p * 6}%, ${10 + p * 4}%)`} count={20} maxHeight={6} progress={0.3 + p * 0.7} />

      </g>

      <g className="midLayer">
      {/* ── Central glow ── */}
      <ellipse cx="200" cy="155" rx="140" ry="60" fill="url(#stonesGlow)" />

      {/* ── Ground ritual circle ── */}
      {p > 0.65 && (
        <g opacity={sub(p, 0.65, 0.2)}>
          <ellipse cx="200" cy="200" rx={120 * sub(p, 0.65, 0.15)} ry={22 * sub(p, 0.65, 0.15)}
            fill="none" stroke="#88a8c8" strokeWidth="0.8" opacity="0.35" strokeDasharray="6 8" />
          <ellipse cx="200" cy="200" rx={90 * sub(p, 0.7, 0.15)} ry={16 * sub(p, 0.7, 0.15)}
            fill="none" stroke="#88a8c8" strokeWidth="0.5" opacity="0.2" strokeDasharray="3 5" />
        </g>
      )}

      {/* ── Ley lines connecting stones ── */}
      {leyLines.map((l, i) => {
        const lp = sub(p, l.delay, 0.12);
        if (lp <= 0) return null;
        const s1 = stones[l.from];
        const s2 = stones[l.to];
        const stoneTopY1 = s1.y + s1.h - sub(p, s1.delay, 0.2) * s1.h;
        const stoneTopY2 = s2.y + s2.h - sub(p, s2.delay, 0.2) * s2.h;
        const midY1 = stoneTopY1 + 15;
        const midY2 = stoneTopY2 + 15;
        const lineLength = Math.sqrt((s2.x - s1.x) ** 2 + (midY2 - midY1) ** 2);
        return (
          <line
            key={i}
            x1={s1.x} y1={midY1}
            x2={s2.x} y2={midY2}
            stroke="#88a8c8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={lineLength}
            strokeDashoffset={lineLength * (1 - lp)}
            opacity={lp * 0.45}
            filter="url(#leyGlow)"
          />
        );
      })}

      {/* ── Standing stones ── */}
      {stones.map((s, i) => {
        const sp = sub(p, s.delay, 0.2);
        const rise = sp * s.h;
        if (sp <= 0) return null;
        const topY = s.y + s.h - rise;

        // Irregular stone shape using bezier
        const hw = s.w / 2;
        const path = `
          M${s.x - hw + s.lean} ${topY}
          C${s.x - hw * 1.1 + s.lean * 0.5} ${topY + rise * 0.3},
           ${s.x - hw * 1.15} ${topY + rise * 0.7},
           ${s.x - hw * 0.95} ${s.y + s.h}
          L${s.x + hw * 0.95} ${s.y + s.h}
          C${s.x + hw * 1.15} ${topY + rise * 0.7},
           ${s.x + hw * 1.1 + s.lean * 0.5} ${topY + rise * 0.3},
           ${s.x + hw + s.lean} ${topY}
          Z
        `;

        const runeP = sub(sp, 0.6, 0.3);

        return (
          <g key={i}>
            {/* Stone body */}
            <path
              d={path}
              fill={`hsl(220, ${6 + p * 3}%, ${18 + p * 4}%)`}
              filter="url(#stoneTex)"
            />
            {/* Stone cap — slightly lighter top edge */}
            <line
              x1={s.x - hw + s.lean + 2} y1={topY + 1}
              x2={s.x + hw + s.lean - 2} y2={topY + 1}
              stroke={`hsl(220, 5%, ${24 + p * 5}%)`}
              strokeWidth="2"
              strokeLinecap="round"
              opacity={sp * 0.5}
            />
            {/* Rune glow */}
            {runeP > 0 && (
              <g opacity={runeP} filter="url(#runeGlow)"
                transform={`translate(${s.x}, ${topY + rise * 0.4})`}>
                <path
                  d={runeShapes[i]}
                  fill="none"
                  stroke="#88a8c8"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        );
      })}

      {/* ── Small cairns ── */}
      {cairns.map((c, i) => (
        <g key={i} opacity={0.3 + p * 0.3}>
          <circle cx={c.x} cy={c.y} r="3" fill={`hsl(220, 6%, ${15 + p * 3}%)`} />
          <circle cx={c.x - 1} cy={c.y - 4} r="2.5" fill={`hsl(220, 7%, ${16 + p * 3}%)`} />
          <circle cx={c.x + 0.5} cy={c.y - 7} r="2" fill={`hsl(220, 8%, ${17 + p * 3}%)`} />
        </g>
      ))}

      {/* ── Mist wisps ── */}
      {p > 0.3 && (
        <g>
          <Wisp x={100} y={170} color="#88a8c8" radius={2} opacity={sub(p, 0.4, 0.15) * 0.3} />
          <Wisp x={300} y={165} color="#88a8c8" radius={1.8} opacity={sub(p, 0.5, 0.15) * 0.3} />
          <Wisp x={200} y={175} color="#a0b8d8" radius={2.2} opacity={sub(p, 0.6, 0.15) * 0.3} />
        </g>
      )}

      </g>

      <g className="fgLayer">
      {/* ── Low mist ── */}
      <rect x="0" y="195" width="400" height="55"
        fill="#8898a8"
        opacity={(0.15 - p * 0.05)}
        filter="url(#moorMist)"
      />

      {/* ── Energy pulse at completion ── */}
      {p > 0.9 && (
        <ellipse
          cx="200" cy="180"
          rx={80 * sub(p, 0.9, 0.1)}
          ry={25 * sub(p, 0.9, 0.1)}
          fill="#88a8c8"
          opacity={(1 - sub(p, 0.9, 0.1)) * 0.2}
        />
      )}

      {/* ── Foreground scrub ── */}
      <GrassRow y={240} color={`hsl(30, ${10 + p * 5}%, ${8 + p * 4}%)`} count={12} maxHeight={14} progress={0.5 + p * 0.5} />
      </g>

      {/* Atmospheric particles — wind-blown grass seeds and faint spirits */}
      {Array.from({ length: 40 }).map((_, i) => {
        const px = (i * 47 + 13) % 400;
        const baseY = (i * 71 + 29) % 220 + 15;
        const drift = Math.sin(p * Math.PI * 2 + i * 0.7) * 8;
        const py = baseY - p * 30 * ((i % 5) / 5);
        const size = 0.5 + (i % 4) * 0.25;
        const opacity = (0.07 + (i % 3) * 0.05) * (0.3 + p * 0.7);
        return (
          <circle key={`p${i}`} cx={px + drift} cy={py} r={size}
            fill={i % 3 === 0 ? "#a0b8d8" : "#88a8c8"} opacity={opacity} />
        );
      })}
    </svg>
  );
}

export default memo(StonesScene);
