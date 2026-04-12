import { sub } from "./util";
import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter, MistFilter } from "../svg/filters";
import { Star } from "../svg/primitives";


// ── Star data: 28 stars with staggered appearance ──
const STARS: { x: number; y: number; r: number; glow: number; delay: number }[] = [
  { x: 52,  y: 18,  r: 1.5, glow: 6,  delay: 0.02 },
  { x: 310, y: 12,  r: 1.8, glow: 7,  delay: 0.04 },
  { x: 175, y: 35,  r: 1.2, glow: 5,  delay: 0.06 },
  { x: 380, y: 28,  r: 2.0, glow: 8,  delay: 0.08 },
  { x: 95,  y: 45,  r: 1.4, glow: 5,  delay: 0.10 },
  { x: 240, y: 20,  r: 1.6, glow: 6,  delay: 0.12 },
  { x: 28,  y: 55,  r: 1.3, glow: 5,  delay: 0.14 },
  { x: 355, y: 50,  r: 1.7, glow: 7,  delay: 0.16 },
  { x: 140, y: 60,  r: 2.2, glow: 9,  delay: 0.18 },
  { x: 200, y: 15,  r: 1.1, glow: 4,  delay: 0.20 },
  { x: 270, y: 55,  r: 1.5, glow: 6,  delay: 0.22 },
  { x: 15,  y: 30,  r: 1.0, glow: 4,  delay: 0.24 },
  { x: 325, y: 38,  r: 1.9, glow: 7,  delay: 0.26 },
  { x: 110, y: 22,  r: 1.3, glow: 5,  delay: 0.28 },
  { x: 390, y: 60,  r: 1.1, glow: 4,  delay: 0.30 },
  { x: 60,  y: 72,  r: 1.6, glow: 6,  delay: 0.32 },
  { x: 220, y: 68,  r: 1.4, glow: 5,  delay: 0.35 },
  { x: 165, y: 82,  r: 1.2, glow: 5,  delay: 0.38 },
  { x: 290, y: 78,  r: 1.8, glow: 7,  delay: 0.40 },
  { x: 45,  y: 90,  r: 1.0, glow: 4,  delay: 0.42 },
  { x: 345, y: 85,  r: 1.5, glow: 6,  delay: 0.44 },
  { x: 130, y: 95,  r: 1.3, glow: 5,  delay: 0.46 },
  { x: 250, y: 42,  r: 2.0, glow: 8,  delay: 0.48 },
  { x: 80,  y: 108, r: 1.1, glow: 4,  delay: 0.50 },
  { x: 370, y: 72,  r: 1.4, glow: 5,  delay: 0.52 },
  { x: 195, y: 105, r: 1.6, glow: 6,  delay: 0.54 },
  { x: 305, y: 95,  r: 1.2, glow: 5,  delay: 0.56 },
  { x: 155, y: 48,  r: 1.7, glow: 7,  delay: 0.58 },
];

// ── Constellation lines — pairs of star indices ──
// Lines that would cross the moon disc (cx=320, cy≈45, r=18) have been
// removed or rerouted: [6, 15] and [12, 7] and [7, 20] all passed through
// the moon. Replaced with [7, 14] which stays to the right of the moon.
const CONSTELLATIONS: [number, number][] = [
  [0, 6],   // top-left cluster
  [4, 8],   // mid-left triangle
  [8, 16],
  [4, 16],
  [1, 12],  // right arc
  [7, 14],  // right, clear of moon
  [9, 5],   // top center link
  [5, 10],
  [10, 18],
];

// ── Treeline data ──
const TREES = [
  { x: 10,  h: 42, s: 18 },
  { x: 35,  h: 55, s: 22 },
  { x: 58,  h: 38, s: 16 },
  { x: 82,  h: 62, s: 26 },
  { x: 110, h: 48, s: 20 },
  { x: 135, h: 58, s: 24 },
  { x: 162, h: 44, s: 18 },
  { x: 188, h: 65, s: 28 },
  { x: 215, h: 50, s: 22 },
  { x: 240, h: 60, s: 25 },
  { x: 265, h: 40, s: 17 },
  { x: 290, h: 56, s: 23 },
  { x: 318, h: 68, s: 28 },
  { x: 345, h: 45, s: 19 },
  { x: 370, h: 52, s: 21 },
  { x: 395, h: 38, s: 16 },
];

function StarScene({ progress: p }: SceneProps) {
  // ── Moon ──
  const moonP = sub(p, 0.05, 0.4);
  const moonY = 80 - moonP * 35;
  const moonBright = 0.3 + moonP * 0.7;

  // ── Milky Way ──
  const milkyP = sub(p, 0.2, 0.4);

  // ── Constellations ──
  const constP = sub(p, 0.65, 0.25);

  // ── Shooting stars — more in the final stretch ──
  const shoot1 = sub(p, 0.78, 0.06);
  const shoot2 = sub(p, 0.85, 0.06);
  const shoot3 = sub(p, 0.90, 0.05);
  const shoot4 = sub(p, 0.93, 0.04);
  const shoot5 = sub(p, 0.96, 0.04);
  const shoot6 = sub(p, 0.98, 0.03);

  // ── Horizon haze ──
  const hazeP = sub(p, 0.1, 0.3);

  // ── Treeline ──
  const treeP = sub(p, 0.02, 0.25);

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        {/* Filters */}
        <GlowFilter id="moonGlow" radius={18} color="#c8c8ff" opacity={0.35} />
        <GlowFilter id="starGlow" radius={4} color="#d8d8ff" opacity={0.3} />
        <GlowFilter id="shootGlow" radius={2} color="#ffffff" opacity={0.5} />
        <MistFilter id="horizonMist" scale={0.01} opacity={0.2} />

        {/* Sky gradient — deep blue top to slightly lighter at horizon */}
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#04061a" />
          <stop offset="50%" stopColor="#080e2a" />
          <stop offset="85%" stopColor="#101838" />
          <stop offset="100%" stopColor="#182048" />
        </linearGradient>

        {/* Horizon haze gradient */}
        <linearGradient id="hazeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#182048" stopOpacity={0} />
          <stop offset="40%" stopColor="#202860" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#283068" stopOpacity={0.3} />
        </linearGradient>

        {/* Milky way gradient — diagonal ellipse fill */}
        <radialGradient id="milkyGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9090f8" stopOpacity={0.08} />
          <stop offset="40%" stopColor="#7878d0" stopOpacity={0.04} />
          <stop offset="100%" stopColor="#6060a0" stopOpacity={0} />
        </radialGradient>

        {/* Moon radial glow */}
        <radialGradient id="moonRadial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8e8ff" stopOpacity={moonBright * 0.25} />
          <stop offset="50%" stopColor="#9090f8" stopOpacity={moonBright * 0.08} />
          <stop offset="100%" stopColor="#9090f8" stopOpacity={0} />
        </radialGradient>

        {/* Shooting star gradient */}
        <linearGradient id="shootGrad1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity={0.8} />
          <stop offset="100%" stopColor="white" stopOpacity={0} />
        </linearGradient>
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

      {/* ══════ BACKGROUND LAYER — SKY ══════ */}
      <rect width="400" height="250" fill="url(#skyGrad)" />

      <g className="bgLayer">

      {/* ── Milky Way band — diagonal wash ── */}
      {milkyP > 0 && (
        <g opacity={milkyP * 0.7}>
          <ellipse
            cx="200" cy="90"
            rx="220" ry="40"
            fill="url(#milkyGrad)"
            transform="rotate(-25, 200, 90)"
          />
          {/* Secondary wispy layer */}
          <ellipse
            cx="180" cy="85"
            rx="180" ry="25"
            fill="url(#milkyGrad)"
            transform="rotate(-25, 180, 85)"
            opacity={0.6}
          />
          {/* Tiny scattered dots within milky way */}
          {[
            { x: 120, y: 70 }, { x: 145, y: 78 }, { x: 170, y: 72 },
            { x: 195, y: 80 }, { x: 220, y: 75 }, { x: 245, y: 82 },
            { x: 270, y: 76 }, { x: 155, y: 85 }, { x: 210, y: 88 },
            { x: 240, y: 70 }, { x: 130, y: 82 }, { x: 260, y: 85 },
          ].map((d, i) => (
            <circle
              key={`mw-${i}`}
              cx={d.x} cy={d.y}
              r={0.5 + (i % 3) * 0.3}
              fill="white"
              opacity={milkyP * (0.08 + (i % 4) * 0.03)}
            />
          ))}
        </g>
      )}

      {/* ── Moon — crescent via overlapping circles ──
           Previously used GlowFilter on the bright disc, which rendered a
           visible rectangular bound and exposed the dark crescent-forming
           circle as a compositional seam. Now the halo is drawn exclusively
           with soft radial gradients (layered wide + narrow) and the
           crescent's dark circle matches the actual sky color at this y
           so it reads as absence, not an overlay. */}
      {moonP > 0 && (
        <g opacity={moonP}>
          {/* Wide soft aura */}
          <circle cx="320" cy={moonY} r="55" fill="url(#moonRadial)" />

          {/* Inner halo — tighter, brighter, no filter bounds */}
          <circle cx="320" cy={moonY} r="28"
            fill="#e8e8ff" opacity={moonBright * 0.08} />
          <circle cx="320" cy={moonY} r="22"
            fill="#f0f0ff" opacity={moonBright * 0.12} />

          {/* Moon bright disc — no SVG filter (was the source of the box) */}
          <circle
            cx="320" cy={moonY} r="18"
            fill={`rgb(${210 + Math.floor(moonBright * 35)}, ${210 + Math.floor(moonBright * 35)}, ${220 + Math.floor(moonBright * 30)})`}
          />

          {/* Dark overlap circle to create crescent — matched to sky gradient
               at moonY (the sky uses hsl-ish #080e2a → #101838 in this band). */}
          <circle
            cx="310" cy={moonY - 4} r="15"
            fill={`hsl(229, 65%, ${6 + (moonY / 250) * 8}%)`}
          />

          {/* Subtle surface detail on lit crescent */}
          <circle cx="328" cy={moonY - 2} r="2" fill="#c8c8e0" opacity={moonBright * 0.15} />
          <circle cx="325" cy={moonY + 6} r="1.5" fill="#c0c0d8" opacity={moonBright * 0.1} />
          <circle cx="330" cy={moonY + 2} r="1" fill="#c8c8e0" opacity={moonBright * 0.12} />
        </g>
      )}

      {/* ── Stars — 28 appearing sequentially ── */}
      {STARS.map((s, i) => {
        const sp = sub(p, s.delay, 0.08);
        return sp > 0 ? (
          <Star
            key={`star-${i}`}
            x={s.x}
            y={s.y}
            radius={s.r * sp}
            glowRadius={s.glow * sp}
            opacity={sp}
            color={i % 5 === 0 ? "#c8c8ff" : i % 7 === 0 ? "#ffe8c8" : "white"}
          />
        ) : null;
      })}

      {/* ── Constellation lines — draw in after 65% ── */}
      {constP > 0 && (
        <g opacity={constP * 0.35}>
          {CONSTELLATIONS.map(([a, b], i) => {
            const lineP = sub(p, 0.65 + i * 0.02, 0.12);
            if (lineP <= 0) return null;
            const sa = STARS[a];
            const sb = STARS[b];
            // Partial line draw via dasharray
            const dx = sb.x - sa.x;
            const dy = sb.y - sa.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            return (
              <line
                key={`const-${i}`}
                x1={sa.x} y1={sa.y}
                x2={sb.x} y2={sb.y}
                stroke="#9090f8"
                strokeWidth={0.6}
                strokeLinecap="round"
                strokeDasharray={`${len}`}
                strokeDashoffset={len * (1 - lineP)}
                opacity={lineP * 0.8}
              />
            );
          })}
        </g>
      )}

      {/* ── Shooting stars ── */}
      {shoot1 > 0 && shoot1 < 1 && (
        <line
          x1={100 + shoot1 * 60} y1={30 + shoot1 * 25}
          x2={100 + shoot1 * 60 - 30} y2={30 + shoot1 * 25 - 8}
          stroke="white" strokeWidth={1.2} strokeLinecap="round"
          opacity={(1 - shoot1) * 0.8}
          filter="url(#shootGlow)"
        />
      )}
      {shoot2 > 0 && shoot2 < 1 && (
        <line
          x1={260 + shoot2 * 50} y1={50 + shoot2 * 20}
          x2={260 + shoot2 * 50 - 35} y2={50 + shoot2 * 20 - 10}
          stroke="white" strokeWidth={1.0} strokeLinecap="round"
          opacity={(1 - shoot2) * 0.7}
          filter="url(#shootGlow)"
        />
      )}
      {shoot3 > 0 && shoot3 < 1 && (
        <line
          x1={180 + shoot3 * 45} y1={15 + shoot3 * 18}
          x2={180 + shoot3 * 45 - 25} y2={15 + shoot3 * 18 - 7}
          stroke="white" strokeWidth={0.9} strokeLinecap="round"
          opacity={(1 - shoot3) * 0.75}
          filter="url(#shootGlow)"
        />
      )}

      {/* ── Extra shooting stars in final 10% — the sky comes alive ── */}
      {shoot4 > 0 && shoot4 < 1 && (
        <line x1={50 + shoot4 * 70} y1={20 + shoot4 * 30}
          x2={50 + shoot4 * 70 - 28} y2={20 + shoot4 * 30 - 9}
          stroke="white" strokeWidth={0.8} strokeLinecap="round"
          opacity={(1 - shoot4) * 0.7} filter="url(#shootGlow)" />
      )}
      {shoot5 > 0 && shoot5 < 1 && (
        <line x1={320 + shoot5 * 55} y1={40 + shoot5 * 22}
          x2={320 + shoot5 * 55 - 32} y2={40 + shoot5 * 22 - 10}
          stroke="white" strokeWidth={1.0} strokeLinecap="round"
          opacity={(1 - shoot5) * 0.8} filter="url(#shootGlow)" />
      )}
      {shoot6 > 0 && shoot6 < 1 && (
        <line x1={150 + shoot6 * 50} y1={55 + shoot6 * 20}
          x2={150 + shoot6 * 50 - 22} y2={55 + shoot6 * 20 - 7}
          stroke="white" strokeWidth={0.7} strokeLinecap="round"
          opacity={(1 - shoot6) * 0.6} filter="url(#shootGlow)" />
      )}

      </g>

      <g className="midLayer">
      {/* ══════ HORIZON / MIDGROUND ══════ */}

      {/* Atmospheric haze at horizon */}
      <rect
        x="0" y="140" width="400" height="110"
        fill="url(#hazeGrad)"
        opacity={hazeP * 0.7}
      />

      {/* Haze mist overlay */}
      {hazeP > 0.2 && (
        <rect
          x="0" y="160" width="400" height="60"
          fill="#283060"
          opacity={hazeP * 0.06}
          filter="url(#horizonMist)"
        />
      )}

      {/* ── Rolling hills beneath treeline — hand-crafted ── */}
      <path d="M0 210 C30 205, 60 212, 100 208 C140 204, 180 210, 220 206 C260 202, 300 208, 340 204 C370 200, 390 206, 400 204 L400 250 L0 250 Z"
        fill="#060e18" opacity={0.3 + treeP * 0.7} />
      <path d="M0 220 C25 216, 55 222, 85 218 C115 214, 145 220, 175 216 C205 212, 235 218, 265 214 C295 210, 325 216, 355 212 C380 210, 395 214, 400 212 L400 250 L0 250 Z"
        fill="#050c14" opacity={0.3 + treeP * 0.7} />
      <path d="M0 228 C20 225, 50 230, 80 227 C110 224, 140 229, 170 226 C200 223, 230 228, 260 225 C290 222, 320 227, 350 224 C375 222, 392 226, 400 224 L400 250 L0 250 Z"
        fill="#040a10" opacity={0.4 + treeP * 0.6} />

      </g>

      <g className="fgLayer">
      {/* ══════ FOREGROUND — TREELINE ══════ */}

      {/* Dark ground base */}
      <rect x="0" y="220" width="400" height="30" fill="#030810" opacity={0.4 + treeP * 0.6} />

      {/* Hand-drawn treeline silhouette — continuous irregular skyline */}
      <path
        d={`
          M0 222
          C5 220, 8 ${222 - TREES[0].h * (0.2 + treeP * 0.8)}, 10 ${222 - TREES[0].h * (0.2 + treeP * 0.8)}
          C12 ${222 - TREES[0].h * (0.2 + treeP * 0.8) - 5}, 22 ${222 - TREES[0].h * (0.2 + treeP * 0.8) + 2}, 25 222
          C28 ${222 - 8 * treeP}, 30 ${222 - TREES[1].h * (0.2 + treeP * 0.8)}, 35 ${222 - TREES[1].h * (0.2 + treeP * 0.8)}
          C38 ${222 - TREES[1].h * (0.2 + treeP * 0.8) - 6}, 48 ${222 - TREES[1].h * (0.2 + treeP * 0.8) + 3}, 52 ${222 - 5 * treeP}
          C55 222, 56 ${222 - TREES[2].h * (0.2 + treeP * 0.8)}, 58 ${222 - TREES[2].h * (0.2 + treeP * 0.8)}
          C60 ${222 - TREES[2].h * (0.2 + treeP * 0.8) - 4}, 68 ${222 - TREES[2].h * (0.2 + treeP * 0.8) + 5}, 72 222
          C76 ${222 - 6 * treeP}, 78 ${222 - TREES[3].h * (0.2 + treeP * 0.8)}, 82 ${222 - TREES[3].h * (0.2 + treeP * 0.8)}
          C86 ${222 - TREES[3].h * (0.2 + treeP * 0.8) - 8}, 100 ${222 - TREES[3].h * (0.2 + treeP * 0.8) + 4}, 105 222
          C110 ${222 - 5 * treeP}, 115 ${222 - TREES[4].h * (0.2 + treeP * 0.8)}, 120 ${222 - TREES[4].h * (0.2 + treeP * 0.8)}
          C125 ${222 - TREES[4].h * (0.2 + treeP * 0.8) - 6}, 138 ${222 - TREES[4].h * (0.2 + treeP * 0.8) + 3}, 142 222
          C148 ${222 - 8 * treeP}, 152 ${222 - TREES[5].h * (0.2 + treeP * 0.8)}, 155 ${222 - TREES[5].h * (0.2 + treeP * 0.8)}
          C158 ${222 - TREES[5].h * (0.2 + treeP * 0.8) - 5}, 168 ${222 - TREES[5].h * (0.2 + treeP * 0.8) + 4}, 172 222
          C178 ${222 - 6 * treeP}, 182 ${222 - TREES[6].h * (0.2 + treeP * 0.8)}, 185 ${222 - TREES[6].h * (0.2 + treeP * 0.8)}
          C188 ${222 - TREES[6].h * (0.2 + treeP * 0.8) - 7}, 198 ${222 - TREES[6].h * (0.2 + treeP * 0.8) + 3}, 202 222
          C208 ${222 - 5 * treeP}, 212 ${222 - TREES[7].h * (0.2 + treeP * 0.8)}, 215 ${222 - TREES[7].h * (0.2 + treeP * 0.8)}
          C218 ${222 - TREES[7].h * (0.2 + treeP * 0.8) - 5}, 228 ${222 - TREES[7].h * (0.2 + treeP * 0.8) + 4}, 232 222
          C238 ${222 - 8 * treeP}, 242 ${222 - TREES[8].h * (0.2 + treeP * 0.8)}, 245 ${222 - TREES[8].h * (0.2 + treeP * 0.8)}
          C248 ${222 - TREES[8].h * (0.2 + treeP * 0.8) - 6}, 258 ${222 - TREES[8].h * (0.2 + treeP * 0.8) + 3}, 262 222
          C268 ${222 - 6 * treeP}, 272 ${222 - TREES[9].h * (0.2 + treeP * 0.8)}, 275 ${222 - TREES[9].h * (0.2 + treeP * 0.8)}
          C278 ${222 - TREES[9].h * (0.2 + treeP * 0.8) - 8}, 290 ${222 - TREES[9].h * (0.2 + treeP * 0.8) + 5}, 295 222
          C300 ${222 - 5 * treeP}, 305 ${222 - TREES[10].h * (0.2 + treeP * 0.8)}, 308 ${222 - TREES[10].h * (0.2 + treeP * 0.8)}
          C312 ${222 - TREES[10].h * (0.2 + treeP * 0.8) - 5}, 322 ${222 - TREES[10].h * (0.2 + treeP * 0.8) + 3}, 328 222
          C332 ${222 - 7 * treeP}, 338 ${222 - TREES[11].h * (0.2 + treeP * 0.8)}, 342 ${222 - TREES[11].h * (0.2 + treeP * 0.8)}
          C345 ${222 - TREES[11].h * (0.2 + treeP * 0.8) - 6}, 358 ${222 - TREES[11].h * (0.2 + treeP * 0.8) + 4}, 362 222
          C366 ${222 - 5 * treeP}, 370 ${222 - TREES[12].h * (0.2 + treeP * 0.8)}, 375 ${222 - TREES[12].h * (0.2 + treeP * 0.8)}
          C378 ${222 - TREES[12].h * (0.2 + treeP * 0.8) - 4}, 390 ${222 - TREES[12].h * (0.2 + treeP * 0.8) + 3}, 395 222
          L400 222 L400 250 L0 250 Z
        `}
        fill="#050d16"
        opacity={treeP * 0.9}
      />

      {/* Foreground ground — darkest layer */}
      <path d="M0 238 C20 236, 50 240, 80 237 C110 234, 140 238, 170 235 C200 232, 230 237, 260 234 C290 232, 320 236, 350 233 C375 231, 392 235, 400 233 L400 250 L0 250 Z"
        fill="#020608" opacity={0.5 + treeP * 0.5} />

      {/* ── Moonlight on tree tops — builds from 50% to 100% ── */}
      {p > 0.5 && (
        <g opacity={sub(p, 0.5, 0.5)}>
          {/* Broad moonlight wash on right-side trees (closest to moon) */}
          <ellipse cx="320" cy="200" rx="80" ry="25"
            fill="#9090f8" opacity={0.04} />
          {/* Individual tree-top highlights — brighter near the moon */}
          {TREES.map((t, i) => {
            const tp = sub(p, 0.02 + i * 0.012, 0.15);
            if (tp < 0.5) return null;
            const h = t.h * (0.3 + tp * 0.7);
            // Trees closer to moon (higher x) get more moonlight
            const moonProximity = 1 - Math.abs(t.x - 320) / 400;
            const glowStrength = moonProximity * sub(p, 0.5, 0.5) * 0.12;
            if (glowStrength < 0.01) return null;
            return (
              <ellipse key={`glow-${i}`}
                cx={t.x} cy={222 - h + 8}
                rx={t.s * 0.6} ry={6}
                fill="#b0b0f8"
                opacity={glowStrength}
              />
            );
          })}
        </g>
      )}

      {/* ── Bottom ground — absolute dark ── */}
      <rect x="0" y="240" width="400" height="10" fill="#020508" />
      </g>

      {/* Atmospheric particles — faint distant stars and cosmic dust */}
      {Array.from({ length: 40 }).map((_, i) => {
        const px = (i * 47 + 13) % 400;
        const baseY = (i * 71 + 29) % 220 + 15;
        const drift = Math.sin(p * Math.PI * 2 + i * 0.7) * 8;
        const py = baseY - p * 30 * ((i % 5) / 5);
        const size = 0.4 + (i % 4) * 0.2;
        const opacity = (0.06 + (i % 3) * 0.04) * (0.3 + p * 0.7);
        return (
          <circle key={`p${i}`} cx={px + drift} cy={py} r={size}
            fill={i % 3 === 0 ? "#c8c8ff" : "#e0e8ff"} opacity={opacity} />
        );
      })}
    </svg>
  );
}

export default memo(StarScene);
