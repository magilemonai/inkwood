import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter, TextureFilter, MistFilter } from "../svg/filters";
import { Wisp, StoneBlock } from "../svg/primitives";

/** Helper: clamp progress into a sub-range for staggered entry */
function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

/** Rune paths — angular glyphs carved into standing stones */
const RUNE_PATHS = [
  "M0 -5 L3 -2 L2 3 L-2 3 L-3 -2 Z",
  "M-2 -5 L2 -5 L0 0 L2 5 L-2 5 L0 0 Z",
  "M0 -5 L4 0 L0 5 L-4 0 Z",
  "M-3 -4 L3 -4 L3 0 L0 4 L-3 0 Z",
  "M0 -5 L2 -3 L2 2 L0 5 L-2 2 L-2 -3 Z",
  "M-3 -3 L0 -5 L3 -3 M0 -5 L0 5 M-3 3 L0 5 L3 3",
  "M-2 -5 L2 -5 M0 -5 L0 5 M-3 0 L3 0",
];

/** Standing stone data — 7 stones in a perspective arc */
const STONES = [
  {
    cx: 42, baseY: 200, w: 24, h: 62,
    path: "M30 200 C28 175, 26 155, 32 140 C34 135, 38 133, 42 132 C48 133, 52 137, 53 142 C56 158, 54 178, 54 200 Z",
    delay: 0.0, runeIdx: 0,
  },
  {
    cx: 100, baseY: 198, w: 28, h: 72,
    path: "M86 198 C84 170, 82 148, 87 130 C90 124, 96 120, 102 119 C108 120, 113 125, 115 132 C118 150, 116 175, 114 198 Z",
    delay: 0.04, runeIdx: 1,
  },
  {
    cx: 160, baseY: 195, w: 30, h: 82,
    path: "M145 195 C143 162, 140 138, 146 118 C149 110, 155 106, 162 105 C168 106, 173 111, 176 120 C180 140, 178 168, 175 195 Z",
    delay: 0.08, runeIdx: 2,
  },
  {
    cx: 210, baseY: 193, w: 32, h: 88,
    path: "M194 193 C192 158, 189 130, 195 110 C198 102, 205 98, 212 97 C219 98, 225 103, 228 112 C232 132, 230 162, 226 193 Z",
    delay: 0.12, runeIdx: 3,
  },
  {
    cx: 260, baseY: 195, w: 30, h: 82,
    path: "M245 195 C243 165, 241 140, 247 120 C250 112, 256 108, 262 107 C268 108, 273 113, 275 121 C279 142, 277 170, 275 195 Z",
    delay: 0.08, runeIdx: 4,
  },
  {
    cx: 318, baseY: 198, w: 28, h: 70,
    path: "M304 198 C302 172, 300 150, 305 132 C308 126, 314 122, 320 121 C326 122, 331 127, 333 134 C336 152, 334 176, 332 198 Z",
    delay: 0.04, runeIdx: 5,
  },
  {
    cx: 370, baseY: 200, w: 24, h: 60,
    path: "M358 200 C356 178, 354 158, 360 142 C362 137, 366 134, 372 133 C377 134, 381 138, 383 144 C386 160, 384 180, 382 200 Z",
    delay: 0.0, runeIdx: 6,
  },
];

function StonesScene({ progress: p }: SceneProps) {
  // ── Sky — overcast, subtly lightening ──
  const skyL = 8 + p * 16;
  const skyS = 10 + p * 18;

  // ── Stone rise progress — each stone rises from the ground ──
  const stoneRiseDuration = 0.35;

  // ── Ley line progress — after 50% ──
  const leyP = sub(p, 0.5, 0.3);

  // ── Ground circle — after 65% ──
  const circleP = sub(p, 0.65, 0.2);

  // ── Energy pulse — after 85% ──
  const pulseP = sub(p, 0.85, 0.15);

  // ── Aurora — after 75% ──
  const auroraP = sub(p, 0.75, 0.2);

  // ── Ritual objects between stones ──
  const cairns = [
    { x: 72,  y: 202, h: 8 },
    { x: 132, y: 200, h: 6 },
    { x: 185, y: 197, h: 7 },
    { x: 236, y: 197, h: 7 },
    { x: 290, y: 200, h: 6 },
    { x: 345, y: 202, h: 8 },
  ];

  // ── Wisps of cloud/mist ──
  const mistWisps = [
    { x: 50,  y: 140, delay: 0.3 },
    { x: 150, y: 120, delay: 0.4 },
    { x: 280, y: 130, delay: 0.35 },
    { x: 360, y: 145, delay: 0.45 },
  ];

  // ── Grass tufts ──
  const grassPatches = [
    { x: 20,  y: 208, count: 5 },
    { x: 75,  y: 205, count: 4 },
    { x: 130, y: 202, count: 5 },
    { x: 180, y: 200, count: 3 },
    { x: 230, y: 200, count: 4 },
    { x: 280, y: 202, count: 5 },
    { x: 330, y: 205, count: 4 },
    { x: 380, y: 208, count: 3 },
  ];

  // ── Ley line connections (stone index pairs) ──
  const leyLines: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
    [0, 3], [1, 4], [2, 5], [3, 6],
  ];

  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        {/* Filters */}
        <GlowFilter id="runeGlow" radius={5} color="#88a8c8" opacity={0.7} />
        <GlowFilter id="leyGlow" radius={4} color="#a0c0e0" opacity={0.5} />
        <GlowFilter id="pulseGlow" radius={14} color="#88a8c8" opacity={0.4} />
        <GlowFilter id="auroraGlow" radius={10} color="#88a8c8" opacity={0.3} />
        <TextureFilter id="stoneTex" scale={0.1} intensity={0.2} seed={7} />
        <TextureFilter id="groundTex" scale={0.07} intensity={0.12} seed={3} />
        <MistFilter id="moorMist" scale={0.012} opacity={0.25} />

        {/* Sky gradient — overcast */}
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(215, ${skyS}%, ${skyL + 5}%)`} />
          <stop offset="60%" stopColor={`hsl(210, ${skyS - 3}%, ${skyL + 2}%)`} />
          <stop offset="100%" stopColor={`hsl(205, ${skyS - 5}%, ${skyL}%)`} />
        </linearGradient>

        {/* Ground gradient */}
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(35, ${12 + p * 8}%, ${10 + p * 6}%)`} />
          <stop offset="100%" stopColor={`hsl(30, ${10 + p * 6}%, ${8 + p * 4}%)`} />
        </linearGradient>

        {/* Pulse radial */}
        <radialGradient id="pulseRadial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#88a8c8" stopOpacity={pulseP * 0.35} />
          <stop offset="40%" stopColor="#a0c0e0" stopOpacity={pulseP * 0.15} />
          <stop offset="100%" stopColor="#88a8c8" stopOpacity={0} />
        </radialGradient>

        {/* Aurora gradient */}
        <linearGradient id="auroraGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#88a8c8" stopOpacity={0} />
          <stop offset="20%" stopColor="#6898b8" stopOpacity={auroraP * 0.15} />
          <stop offset="40%" stopColor="#88a8c8" stopOpacity={auroraP * 0.25} />
          <stop offset="60%" stopColor="#78b8a8" stopOpacity={auroraP * 0.2} />
          <stop offset="80%" stopColor="#88a8c8" stopOpacity={auroraP * 0.15} />
          <stop offset="100%" stopColor="#88a8c8" stopOpacity={0} />
        </linearGradient>

        {/* Clip for ground circle (perspective ellipse) */}
        <clipPath id="groundClip">
          <rect x="0" y="160" width="400" height="90" />
        </clipPath>
      </defs>

      {/* ── Sky ── */}
      <rect width="400" height="250" fill="url(#skyGrad)" />

      {/* ── Overcast cloud layers ── */}
      <ellipse cx={80} cy={30} rx={90} ry={18}
        fill={`hsl(210, ${8 + p * 5}%, ${skyL + 8}%)`} opacity={0.3 + p * 0.1}
      />
      <ellipse cx={220} cy={22} rx={110} ry={20}
        fill={`hsl(212, ${6 + p * 4}%, ${skyL + 6}%)`} opacity={0.25 + p * 0.1}
      />
      <ellipse cx={350} cy={35} rx={80} ry={15}
        fill={`hsl(208, ${7 + p * 5}%, ${skyL + 7}%)`} opacity={0.28 + p * 0.08}
      />

      {/* ── Aurora / sky glow at high progress ── */}
      {auroraP > 0 && (
        <g>
          <path
            d={`M60 10 Q120 ${5 - auroraP * 8}, 200 ${12 - auroraP * 6}
                Q280 ${5 - auroraP * 10}, 340 10
                L340 55 Q280 ${45 + auroraP * 5}, 200 ${50 + auroraP * 3}
                Q120 ${45 + auroraP * 7}, 60 55 Z`}
            fill="url(#auroraGrad)"
            filter="url(#auroraGlow)"
          />
          {/* Secondary aurora band */}
          <path
            d={`M100 25 Q180 ${18 - auroraP * 5}, 300 25
                L300 45 Q180 ${38 + auroraP * 4}, 100 45 Z`}
            fill="#88a8c8"
            opacity={auroraP * 0.08}
          />
        </g>
      )}

      {/* ── Distant rolling hills — background ── */}
      <path
        d="M0 160 Q40 145, 80 150 C120 142, 160 148, 200 143
           C240 138, 280 145, 320 140 Q360 136, 400 148 L400 180 L0 180 Z"
        fill={`hsl(200, ${8 + p * 5}%, ${7 + p * 4}%)`}
      />
      <path
        d="M0 168 Q60 155, 100 160 C150 153, 190 158, 240 154
           C290 150, 340 156, 400 158 L400 190 L0 190 Z"
        fill={`hsl(160, ${8 + p * 6}%, ${8 + p * 4}%)`}
      />
      {/* Mid hills */}
      <path
        d="M0 178 Q50 168, 100 172 C160 165, 220 170, 280 167
           C330 164, 370 170, 400 172 L400 200 L0 200 Z"
        fill={`hsl(45, ${10 + p * 6}%, ${9 + p * 5}%)`}
      />

      {/* ── Foreground ground — moorland ── */}
      <path
        d="M0 195 Q60 188, 120 192 C180 186, 240 188, 300 192
           Q360 188, 400 195 L400 250 L0 250 Z"
        fill="url(#groundGrad)"
        filter="url(#groundTex)"
      />

      {/* ── Low scrubby grass and heather ── */}
      {grassPatches.map((gp, gi) =>
        Array.from({ length: gp.count }).map((_, i) => {
          const gx = gp.x + (i - gp.count / 2) * 8 + ((i * 3) % 5);
          const gh = 4 + (i % 3) * 2.5;
          const lean = ((i + gi) % 3 - 1) * 1.5;
          const grassColor = (i + gi) % 3 === 0
            ? `hsl(30, ${15 + p * 10}%, ${14 + p * 6}%)`
            : (i + gi) % 3 === 1
              ? `hsl(80, ${12 + p * 8}%, ${12 + p * 5}%)`
              : `hsl(320, ${8 + p * 5}%, ${14 + p * 4}%)`;
          return (
            <path
              key={`grass-${gi}-${i}`}
              d={`M${gx} ${gp.y} Q${gx + lean} ${gp.y - gh * 0.6} ${gx + lean * 1.4} ${gp.y - gh * (0.4 + p * 0.6)}`}
              fill="none"
              stroke={grassColor}
              strokeWidth={1 + (i % 2) * 0.4}
              strokeLinecap="round"
              opacity={0.5 + p * 0.4}
            />
          );
        })
      )}

      {/* ── Heather clumps (muted purple/brown) ── */}
      {[
        { x: 55, y: 206 }, { x: 145, y: 201 }, { x: 240, y: 199 },
        { x: 310, y: 203 }, { x: 385, y: 207 },
      ].map((hc, i) => (
        <g key={`heather-${i}`} opacity={0.4 + p * 0.3}>
          <ellipse cx={hc.x} cy={hc.y} rx={6 + i % 3} ry={2.5}
            fill={`hsl(${310 + i * 8}, ${12 + p * 6}%, ${14 + p * 4}%)`}
          />
          <ellipse cx={hc.x + 4} cy={hc.y - 1} rx={4} ry={2}
            fill={`hsl(${320 + i * 5}, ${14 + p * 5}%, ${16 + p * 3}%)`}
          />
        </g>
      ))}

      {/* ── Dashed ground circle connecting stones — after 65% ── */}
      {circleP > 0 && (
        <ellipse
          cx={210} cy={200}
          rx={175 * circleP} ry={18 * circleP}
          fill="none"
          stroke="#88a8c8"
          strokeWidth={1}
          strokeDasharray="6 4"
          opacity={circleP * 0.4}
          clipPath="url(#groundClip)"
        />
      )}

      {/* ── Worn symbols on the ground between stones ── */}
      {cairns.map((c, i) => {
        const cp = sub(p, 0.15 + i * 0.05, 0.2);
        return cp > 0 ? (
          <g key={`ground-sym-${i}`} opacity={cp * 0.25}>
            <circle cx={c.x} cy={c.y + 2} r={4} fill="none"
              stroke={`hsl(40, 10%, ${15 + p * 5}%)`} strokeWidth={0.6}
            />
            <line x1={c.x - 2} y1={c.y + 2} x2={c.x + 2} y2={c.y + 2}
              stroke={`hsl(40, 10%, ${15 + p * 5}%)`} strokeWidth={0.5}
            />
          </g>
        ) : null;
      })}

      {/* ── Small cairns between stones ── */}
      {cairns.map((c, i) => {
        const cp = sub(p, 0.1 + i * 0.04, 0.25);
        return cp > 0 ? (
          <g key={`cairn-${i}`} opacity={cp * 0.7}>
            <StoneBlock x={c.x - 4} y={c.y - c.h * cp} width={8} height={c.h * cp}
              color={`hsl(35, ${6 + p * 3}%, ${14 + p * 4}%)`} roughness={1.5} seed={i + 20}
            />
            {/* Top stone */}
            <ellipse cx={c.x} cy={c.y - c.h * cp} rx={3.5} ry={1.5}
              fill={`hsl(30, ${5 + p * 3}%, ${16 + p * 3}%)`}
            />
          </g>
        ) : null;
      })}

      {/* ── Ley lines connecting stones — after 50% ── */}
      {leyP > 0 && (
        <g filter="url(#leyGlow)">
          {leyLines.map(([a, b], i) => {
            const lineP = sub(p, 0.5 + i * 0.02, 0.15);
            if (lineP <= 0) return null;

            const sa = STONES[a];
            const sb = STONES[b];
            const stoneAP = sub(p, sa.delay, stoneRiseDuration);
            const stoneBP = sub(p, sb.delay, stoneRiseDuration);
            const aTopY = sa.baseY - (sa.h * 0.65) * stoneAP;
            const bTopY = sb.baseY - (sb.h * 0.65) * stoneBP;
            const midY = Math.min(aTopY, bTopY) + 5;

            // Animate line drawing from stone A to stone B
            const endX = sa.cx + (sb.cx - sa.cx) * lineP;
            const endY = aTopY + (bTopY - aTopY) * lineP;
            const midControlY = midY - 8 * lineP;

            return (
              <path
                key={`ley-${i}`}
                d={`M${sa.cx} ${aTopY}
                    Q${(sa.cx + endX) / 2} ${midControlY},
                     ${endX} ${endY}`}
                fill="none"
                stroke="#a0c0e0"
                strokeWidth={0.8 + lineP * 0.4}
                opacity={lineP * 0.5}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      )}

      {/* ── Energy pulse at high progress ── */}
      {pulseP > 0 && (
        <g>
          <ellipse
            cx={210} cy={196}
            rx={80 + pulseP * 100} ry={12 + pulseP * 15}
            fill="url(#pulseRadial)"
            filter="url(#pulseGlow)"
          />
          {/* Inner bright ring */}
          <ellipse
            cx={210} cy={196}
            rx={40 + pulseP * 50} ry={6 + pulseP * 8}
            fill="none"
            stroke="#a0c0e0"
            strokeWidth={0.6}
            opacity={pulseP * 0.3}
          />
        </g>
      )}

      {/* ── Standing stones ── */}
      {STONES.map((stone, i) => {
        const sp = sub(p, stone.delay, stoneRiseDuration);
        if (sp <= 0) return null;

        // Stone rises: translate upward from buried position
        const riseOffset = (1 - sp) * stone.h * 0.7;
        const runeP = sub(p, stone.delay + stoneRiseDuration, 0.15);

        return (
          <g key={`stone-${i}`}>
            {/* Stone body — organic bezier shape */}
            <g transform={`translate(0, ${riseOffset})`} opacity={0.3 + sp * 0.7}>
              <path
                d={stone.path}
                fill={`hsl(210, ${5 + p * 3}%, ${14 + p * 4}%)`}
                filter="url(#stoneTex)"
              />
              {/* Stone highlight edge — left side catch light */}
              <path
                d={stone.path}
                fill="none"
                stroke={`hsl(210, ${8 + p * 5}%, ${22 + p * 5}%)`}
                strokeWidth={0.8}
                opacity={0.3}
              />
              {/* Dark crevice line */}
              <line
                x1={stone.cx - stone.w * 0.1}
                y1={stone.baseY - stone.h * 0.3}
                x2={stone.cx + stone.w * 0.05}
                y2={stone.baseY - stone.h * 0.6}
                stroke={`hsl(210, 5%, ${8 + p * 2}%)`}
                strokeWidth={0.5}
                opacity={0.4}
              />

              {/* Rune — appears after stone is fully risen */}
              {runeP > 0 && (
                <g
                  transform={`translate(${stone.cx}, ${stone.baseY - stone.h * 0.45}) scale(1.3)`}
                  opacity={runeP}
                  filter="url(#runeGlow)"
                >
                  <path
                    d={RUNE_PATHS[stone.runeIdx]}
                    fill="none"
                    stroke="#88a8c8"
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              )}
            </g>

            {/* Shadow at stone base */}
            <ellipse
              cx={stone.cx + 3}
              cy={stone.baseY + 2}
              rx={stone.w * 0.6}
              ry={3}
              fill="#000"
              opacity={sp * 0.15}
            />
          </g>
        );
      })}

      {/* ── Mist wisps drifting through ── */}
      {mistWisps.map((mw, i) => {
        const mp = sub(p, mw.delay, 0.2);
        const drift = mp * 20;
        return mp > 0 ? (
          <Wisp
            key={`mist-wisp-${i}`}
            x={mw.x + drift}
            y={mw.y}
            color="#b0c8d8"
            radius={4 + i}
            opacity={mp * 0.2}
          />
        ) : null;
      })}

      {/* ── Low mist layer on ground ── */}
      <rect
        x={0} y={190} width={400} height={60}
        fill="#a0b8c8"
        opacity={(0.6 + p * 0.4) * 0.06}
        filter="url(#moorMist)"
      />

      {/* ── Additional mist at base of stones ── */}
      <ellipse
        cx={210} cy={202}
        rx={160} ry={14}
        fill="#b0c8d8"
        opacity={Math.max(0, (1 - p * 0.6)) * 0.08}
        filter="url(#moorMist)"
      />

      {/* ── Foreground grass tufts (closest) ── */}
      {Array.from({ length: 20 }).map((_, i) => {
        const gx = i * 21 + ((i * 7) % 11);
        const gy = 235 + (i % 3) * 3;
        const gh = 6 + (i % 4) * 2;
        const lean = ((i % 5) - 2) * 1.2;
        return (
          <path
            key={`fg-grass-${i}`}
            d={`M${gx} ${gy} Q${gx + lean} ${gy - gh * 0.6} ${gx + lean * 1.5} ${gy - gh * (0.3 + p * 0.7)}`}
            fill="none"
            stroke={i % 3 === 0
              ? `hsl(35, ${14 + p * 8}%, ${12 + p * 5}%)`
              : `hsl(75, ${10 + p * 6}%, ${11 + p * 5}%)`}
            strokeWidth={1.3 + (i % 2) * 0.5}
            strokeLinecap="round"
            opacity={0.4 + p * 0.3}
          />
        );
      })}

      {/* ── Vignette — slight darkness at edges ── */}
      <rect width="400" height="250"
        fill="hsl(210, 15%, 3%)"
        opacity={Math.max(0, 0.2 - p * 0.12)}
      />
    </svg>
  );
}

export default memo(StonesScene);
