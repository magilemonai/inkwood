import { sub } from "./util";
import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter } from "../svg/filters";
import { useParticles } from "../hooks/useParticles";
import ParticleField from "../components/ParticleField";

/** Helper: clamp progress into a sub-range for staggered entry */

/** Hand-drawn tree silhouette for dense forest framing */
function ForestTree({
  x,
  y,
  height,
  trunkWidth,
  canopyWidth,
  lean = 0,
  opacity = 1,
  color = "#080a04",
  variant = 0,
}: {
  x: number;
  y: number;
  height: number;
  trunkWidth: number;
  canopyWidth: number;
  lean?: number;
  opacity?: number;
  color?: string;
  variant?: number;
}) {
  const topY = y - height;
  const tw = trunkWidth;
  const cw = canopyWidth;
  const lx = lean;
  return (
    <g opacity={opacity}>
      {/* Trunk - organic bezier */}
      <path
        d={`M${x - tw} ${y}
            C${x - tw * 0.8 + lx * 0.3} ${y - height * 0.35},
             ${x - tw * 1.3 + lx * 0.6} ${y - height * 0.65},
             ${x - tw * 0.2 + lx} ${topY + cw * 0.6}
            L${x + tw * 0.2 + lx} ${topY + cw * 0.6}
            C${x + tw * 1.3 + lx * 0.6} ${y - height * 0.65},
             ${x + tw * 0.8 + lx * 0.3} ${y - height * 0.35},
             ${x + tw} ${y}
            Z`}
        fill={color}
      />
      {/* Canopy - bumpy irregular silhouette, varied by variant */}
      {(() => {
        // Per-variant offsets to make each tree unique
        const v = variant % 4;
        const a = v === 0 ? 0 : v === 1 ? 0.05 : v === 2 ? -0.04 : 0.03;
        const b = v === 0 ? 0 : v === 1 ? -0.06 : v === 2 ? 0.04 : -0.05;
        const c = v === 0 ? 0 : v === 1 ? 0.03 : v === 2 ? -0.06 : 0.04;
        const wL = v === 1 ? 0.08 : v === 3 ? -0.06 : 0; // wider or narrower left
        const wR = v === 2 ? 0.06 : v === 1 ? -0.04 : 0; // wider or narrower right
        const hOff = v === 3 ? -0.05 : v === 2 ? 0.04 : 0; // taller or shorter
        return (
          <path
            d={`M${x + lx - cw * (0.55 + wL)} ${topY + cw * 0.6}
                C${x + lx - cw * (0.65 + wL)} ${topY + cw * (0.45 + a)},
                 ${x + lx - cw * (0.7 + wL)} ${topY + cw * (0.3 + b)},
                 ${x + lx - cw * (0.62 + a)} ${topY + cw * (0.15 + c)}
                C${x + lx - cw * (0.55 + b)} ${topY + cw * (0.02 + a)},
                 ${x + lx - cw * 0.5} ${topY + cw * (-0.08 + hOff)},
                 ${x + lx - cw * (0.38 + c)} ${topY + cw * (-0.12 + hOff)}
                C${x + lx - cw * (0.28 + a)} ${topY + cw * (-0.18 + hOff)},
                 ${x + lx - cw * 0.2} ${topY + cw * (-0.25 + hOff)},
                 ${x + lx - cw * (0.08 + b)} ${topY + cw * (-0.22 + hOff)}
                C${x + lx + cw * (0.02 + c)} ${topY + cw * (-0.3 + hOff)},
                 ${x + lx + cw * 0.08} ${topY + cw * (-0.28 + hOff)},
                 ${x + lx + cw * (0.15 + a)} ${topY + cw * (-0.2 + hOff)}
                C${x + lx + cw * (0.25 + b)} ${topY + cw * (-0.15 + c)},
                 ${x + lx + cw * (0.32 + c)} ${topY + cw * (-0.18 + a)},
                 ${x + lx + cw * (0.4 + wR)} ${topY + cw * (-0.08 + b)}
                C${x + lx + cw * (0.48 + wR)} ${topY + cw * (0.0 + c)},
                 ${x + lx + cw * (0.55 + wR)} ${topY + cw * (0.05 + a)},
                 ${x + lx + cw * (0.6 + wR)} ${topY + cw * (0.15 + b)}
                C${x + lx + cw * (0.65 + wR)} ${topY + cw * (0.28 + c)},
                 ${x + lx + cw * 0.62} ${topY + cw * 0.42},
                 ${x + lx + cw * (0.5 + wR)} ${topY + cw * 0.6}
                Z`}
            fill={color}
          />
        );
      })()}
    </g>
  );
}

/** Spirit figure - translucent humanoid bezier shape */
function SpiritFigure({
  x,
  y,
  height,
  opacity,
  color,
}: {
  x: number;
  y: number;
  height: number;
  opacity: number;
  color: string;
}) {
  const topY = y - height;
  const headR = height * 0.1;
  const bodyW = height * 0.18;
  return (
    <g opacity={opacity}>
      {/* Glow behind spirit */}
      <ellipse
        cx={x}
        cy={y - height * 0.4}
        rx={bodyW * 2}
        ry={height * 0.55}
        fill={color}
        opacity={0.08}
      />
      {/* Flowing robe body - wider at base, narrow at shoulders */}
      <path
        d={`M${x - bodyW * 1.3} ${y}
            C${x - bodyW * 1.1} ${y - height * 0.25},
             ${x - bodyW * 0.5} ${y - height * 0.55},
             ${x - bodyW * 0.3} ${topY + headR * 2.5}
            L${x + bodyW * 0.3} ${topY + headR * 2.5}
            C${x + bodyW * 0.5} ${y - height * 0.55},
             ${x + bodyW * 1.1} ${y - height * 0.25},
             ${x + bodyW * 1.3} ${y}
            Z`}
        fill={color}
        opacity={0.35}
      />
      {/* Inner light core */}
      <path
        d={`M${x - bodyW * 0.6} ${y}
            C${x - bodyW * 0.5} ${y - height * 0.3},
             ${x - bodyW * 0.2} ${y - height * 0.55},
             ${x} ${topY + headR * 3}
            C${x + bodyW * 0.2} ${y - height * 0.55},
             ${x + bodyW * 0.5} ${y - height * 0.3},
             ${x + bodyW * 0.6} ${y}
            Z`}
        fill={color}
        opacity={0.2}
      />
      {/* Head */}
      <ellipse
        cx={x}
        cy={topY + headR}
        rx={headR}
        ry={headR * 1.15}
        fill={color}
        opacity={0.4}
      />
      {/* Head bright center */}
      <circle
        cx={x}
        cy={topY + headR}
        r={headR * 0.4}
        fill="white"
        opacity={0.2}
      />
    </g>
  );
}

const FIREFLY_CONFIG = {
  count: 25,
  bounds: { x: 130, y: 60, width: 140, height: 120 },
  colors: ["#e8d090", "#d0b870", "#f0e0a0", "#c8a850"],
  sizeRange: [0.4, 0.9] as [number, number],
  speedRange: [3, 8] as [number, number],
  driftX: 0,
  driftY: -1,
  lifeRange: [3, 7] as [number, number],
};

function SanctumScene({ progress: p }: SceneProps) {
  const fireflyParticles = useParticles(FIREFLY_CONFIG, p > 0.25);
  // Ambient brightening
  const ambL = 3 + p * 10;
  const ambS = 10 + p * 15;

  // Moon
  const moonBright = sub(p, 0.05, 0.3);
  const moonX = 200;
  const moonY = 35;

  // Moonbeams
  const beams = [
    { x: 170, delay: 0.15 },
    { x: 200, delay: 0.22 },
    { x: 230, delay: 0.3 },
  ];

  // Spirit figures in a loose circle in the clearing
  const spirits = [
    { x: 155, y: 165, h: 32, delay: 0.55 },
    { x: 180, y: 168, h: 28, delay: 0.6 },
    { x: 200, y: 162, h: 35, delay: 0.65 },
    { x: 220, y: 167, h: 30, delay: 0.7 },
    { x: 245, y: 164, h: 33, delay: 0.75 },
  ];

  // Stars
  const stars = [
    { x: 100, y: 18, r: 1.2 },
    { x: 145, y: 12, r: 0.8 },
    { x: 175, y: 22, r: 1.0 },
    { x: 225, y: 15, r: 0.9 },
    { x: 255, y: 20, r: 1.1 },
    { x: 300, y: 10, r: 0.7 },
    { x: 195, y: 8,  r: 0.6 },
    { x: 160, y: 30, r: 0.5 },
    { x: 240, y: 28, r: 0.7 },
  ];

  // Wisps
  const wisps = [
    { x: 170, y: 170, delay: 0.4, color: "#d0b870" },
    { x: 215, y: 155, delay: 0.48, color: "#e0d090" },
    { x: 190, y: 180, delay: 0.52, color: "#c8b060" },
    { x: 230, y: 175, delay: 0.58, color: "#d8c878" },
    { x: 185, y: 145, delay: 0.62, color: "#ddd090" },
    { x: 210, y: 190, delay: 0.68, color: "#d0b870" },
  ];

  // Ground mandala
  const mandalaP = sub(p, 0.4, 0.2);

  // Small ground details
  const leaves = [
    { x: 145, y: 228, rot: 25 },
    { x: 220, y: 232, rot: -40 },
    { x: 260, y: 226, rot: 65 },
    { x: 175, y: 235, rot: -15 },
  ];

  const stones = [
    { x: 150, y: 230, w: 6, h: 3 },
    { x: 240, y: 234, w: 5, h: 2.5 },
    { x: 195, y: 237, w: 4, h: 2 },
  ];

  return (
    <svg viewBox="0 0 400 250" overflow="hidden" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="moonGlow" radius={18} color="#d0b870" opacity={0.5} />
        <GlowFilter id="spiritGlow" radius={5} color="#d0b870" opacity={0.3} />
        <GlowFilter id="beamGlow" radius={4} color="#d0b870" opacity={0.15} />

        {/* Sky gradient */}
        <linearGradient id="sanctumSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(230, ${ambS}%, ${ambL + 4}%)`} />
          <stop offset="60%" stopColor={`hsl(240, ${ambS - 5}%, ${ambL}%)`} />
          <stop offset="100%" stopColor={`hsl(220, ${ambS + 5}%, ${ambL - 1}%)`} />
        </linearGradient>

        {/* Moon radial */}
        <radialGradient id="moonRadial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffbe8" stopOpacity={moonBright * 0.9} />
          <stop offset="30%" stopColor="#d0b870" stopOpacity={moonBright * 0.4} />
          <stop offset="70%" stopColor="#d0b870" stopOpacity={moonBright * 0.1} />
          <stop offset="100%" stopColor="#d0b870" stopOpacity={0} />
        </radialGradient>

        {/* Mandala fade gradient */}
        <radialGradient id="mandalaGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d0b870" stopOpacity={0.15 * mandalaP} />
          <stop offset="100%" stopColor="#d0b870" stopOpacity={0} />
        </radialGradient>

        {/* Gold ambient overlay */}
        <radialGradient id="goldAmbient" cx="50%" cy="15%" r="70%">
          <stop offset="0%" stopColor="#d0b870" stopOpacity={p * 0.06} />
          <stop offset="100%" stopColor="#d0b870" stopOpacity={0} />
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
      <rect width="400" height="250" fill="url(#sanctumSky)" />

      {/* ── Gold ambient wash ── */}
      <rect width="400" height="250" fill="url(#goldAmbient)" />

      <g className="bgLayer">
      {/* ── Stars ── */}
      {stars.map((s, i) => {
        const sp = sub(p, 0.05 + i * 0.03, 0.15);
        return (
          <g key={i} opacity={sp * 0.7}>
            <circle cx={s.x} cy={s.y} r={s.r * 3} fill="white" opacity={0.05} />
            <circle cx={s.x} cy={s.y} r={s.r} fill="white" opacity={0.6} />
          </g>
        );
      })}

      {/* ── Moon ── */}
      <circle cx={moonX} cy={moonY} r={60} fill="url(#moonRadial)" />
      <circle
        cx={moonX}
        cy={moonY}
        r={22}
        fill="#fffde8"
        opacity={moonBright * 0.15}
      />
      <circle
        cx={moonX}
        cy={moonY}
        r={14}
        fill="#fffef0"
        opacity={moonBright * 0.5}
        filter="url(#moonGlow)"
      />
      <circle
        cx={moonX}
        cy={moonY}
        r={10}
        fill="#fffff5"
        opacity={moonBright * 0.85}
      />

      {/* ── Moonbeams ── */}
      {beams.map((b, i) => {
        const bp = sub(p, b.delay, 0.2);
        const halfW = 12 + i * 3;
        return (
          <polygon
            key={i}
            points={`${b.x},${moonY + 14} ${b.x - halfW},240 ${b.x + halfW},240`}
            fill="#d0b870"
            opacity={bp * 0.06}
            filter="url(#beamGlow)"
          />
        );
      })}

      </g>

      <g className="midLayer">
      {/* ── Distant hills — hand-crafted ── */}
      <path d="M0 200 C30 196, 60 202, 90 198 C120 194, 150 200, 180 196 C210 192, 240 198, 270 194 C300 190, 330 196, 360 192 C380 190, 395 195, 400 193 L400 250 L0 250 Z"
        fill={`hsl(220, ${10 + p * 8}%, ${5 + p * 3}%)`} />

      {/* ── Left forest trees ── */}
      <ForestTree x={-10} y={240} height={190} variant={0} trunkWidth={12} canopyWidth={45} lean={3}
        color={`hsl(120, ${8 + p * 5}%, ${4 + p * 2}%)`} />
      <ForestTree x={30} y={245} height={210} variant={1} trunkWidth={10} canopyWidth={40} lean={2}
        color={`hsl(130, ${7 + p * 4}%, ${3 + p * 2}%)`} />
      <ForestTree x={65} y={242} height={180} variant={2} trunkWidth={9} canopyWidth={35} lean={4}
        color={`hsl(125, ${9 + p * 5}%, ${4 + p * 2}%)`} />
      <ForestTree x={95} y={240} height={160} variant={3} trunkWidth={8} canopyWidth={30} lean={5}
        color={`hsl(115, ${8 + p * 4}%, ${5 + p * 2}%)`} />
      <ForestTree x={118} y={243} height={145} variant={0} trunkWidth={7} canopyWidth={28} lean={4}
        color={`hsl(120, ${7 + p * 5}%, ${5 + p * 3}%)`} />

      {/* ── Right forest trees ── */}
      <ForestTree x={410} y={240} height={195} variant={2} trunkWidth={12} canopyWidth={44} lean={-3}
        color={`hsl(120, ${8 + p * 5}%, ${4 + p * 2}%)`} />
      <ForestTree x={375} y={244} height={205} variant={3} trunkWidth={10} canopyWidth={38} lean={-2}
        color={`hsl(128, ${7 + p * 4}%, ${3 + p * 2}%)`} />
      <ForestTree x={340} y={241} height={175} variant={1} trunkWidth={9} canopyWidth={34} lean={-4}
        color={`hsl(122, ${9 + p * 5}%, ${4 + p * 2}%)`} />
      <ForestTree x={310} y={242} height={155} variant={0} trunkWidth={8} canopyWidth={30} lean={-5}
        color={`hsl(118, ${8 + p * 4}%, ${5 + p * 2}%)`} />
      <ForestTree x={285} y={244} height={140} variant={2} trunkWidth={7} canopyWidth={27} lean={-4}
        color={`hsl(125, ${7 + p * 5}%, ${5 + p * 3}%)`} />

      {/* ── Clearing ground — hand-crafted ── */}
      <path d="M130 222 C150 218, 170 220, 200 218 C230 216, 250 220, 270 218 L270 250 L130 250 Z"
        fill={`hsl(100, ${12 + p * 10}%, ${6 + p * 5}%)`} />

      {/* ── Ground mandala ── */}
      {mandalaP > 0 && (
        <g opacity={mandalaP * 0.5}>
          {/* Mandala glow background */}
          <ellipse cx={200} cy={160} rx={40} ry={10} fill="url(#mandalaGrad)" />
          {/* Outer ring */}
          <ellipse
            cx={200} cy={160} rx={32} ry={8}
            fill="none" stroke="#d0b870" strokeWidth={0.6} opacity={0.4}
          />
          {/* Inner dashed ring */}
          <ellipse
            cx={200} cy={160} rx={22} ry={5.5}
            fill="none" stroke="#d0b870" strokeWidth={0.4}
            strokeDasharray="3 2" opacity={0.35}
          />
          {/* Compass markers */}
          <line x1={200} y1={160 - 8} x2={200} y2={160 - 12} stroke="#d0b870" strokeWidth={0.5} opacity={0.4} />
          <line x1={200} y1={160 + 8} x2={200} y2={160 + 12} stroke="#d0b870" strokeWidth={0.5} opacity={0.4} />
          <line x1={200 - 32} y1={160} x2={200 - 37} y2={160} stroke="#d0b870" strokeWidth={0.5} opacity={0.4} />
          <line x1={200 + 32} y1={160} x2={200 + 37} y2={160} stroke="#d0b870" strokeWidth={0.5} opacity={0.4} />
          {/* Center dot */}
          <circle cx={200} cy={160} r={1.5} fill="#d0b870" opacity={0.5} />
        </g>
      )}

      {/* ── Small stones ── */}
      {stones.map((s, i) => (
        <ellipse
          key={i}
          cx={s.x} cy={s.y} rx={s.w / 2} ry={s.h / 2}
          fill={`hsl(200, 5%, ${15 + p * 5}%)`}
          opacity={0.3 + p * 0.2}
        />
      ))}

      {/* ── Fallen leaves ── */}
      {leaves.map((l, i) => (
        <path
          key={i}
          d={`M${l.x} ${l.y}
              Q${l.x + 4} ${l.y - 2} ${l.x + 7} ${l.y}
              Q${l.x + 4} ${l.y + 1.5} ${l.x} ${l.y}`}
          fill={`hsl(35, ${30 + p * 15}%, ${15 + p * 8}%)`}
          opacity={0.3 + p * 0.15}
          transform={`rotate(${l.rot}, ${l.x + 3.5}, ${l.y})`}
        />
      ))}

      {/* ── Clearing grass tufts ── */}
      {[
        { x: 142, y: 224 }, { x: 160, y: 222 }, { x: 178, y: 220 },
        { x: 195, y: 219 }, { x: 212, y: 220 }, { x: 228, y: 222 },
        { x: 245, y: 224 }, { x: 260, y: 222 },
      ].map((g, i) => (
        <g key={`cg${i}`} opacity={0.3 + p * 0.4}>
          <line x1={g.x - 1} y1={g.y} x2={g.x - 3} y2={g.y - 5 * p}
            stroke={`hsl(100, ${18 + p * 15}%, ${10 + p * 8}%)`}
            strokeWidth={0.6} strokeLinecap="round" />
          <line x1={g.x + 1} y1={g.y} x2={g.x + 2} y2={g.y - 6 * p}
            stroke={`hsl(95, ${15 + p * 12}%, ${12 + p * 8}%)`}
            strokeWidth={0.6} strokeLinecap="round" />
        </g>
      ))}

      {/* ── Ground mist — organic wisps ── */}
      <path d="M135 225 C155 222, 180 224, 200 221 C220 224, 245 222, 265 225"
        fill="none" stroke="#b0a880" strokeWidth={4}
        strokeLinecap="round" opacity={(0.3 + p * 0.15) * 0.12} />

      </g>

      <g className="fgLayer">
      {/* ── Spirit wisps / fireflies — inlined ── */}
      {wisps.map((w, i) => {
        const wp = sub(p, w.delay, 0.12);
        if (wp <= 0) return null;
        const drift = Math.sin(p * Math.PI * 3 + i * 2.3) * 5;
        const bob = Math.cos(p * Math.PI * 4 + i * 1.7) * 3;
        const r = 1.8 + (i % 3) * 0.4;
        return (
          <g key={`wisp${i}`}>
            <circle cx={w.x + drift} cy={w.y + bob} r={r * 2.5}
              fill={w.color} opacity={wp * 0.04} />
            <circle cx={w.x + drift} cy={w.y + bob} r={r}
              fill={w.color} opacity={wp * 0.4} />
          </g>
        );
      })}

      {/* ── Spirit figures ── */}
      {spirits.map((s, i) => {
        const sp = sub(p, s.delay, 0.15);
        return sp > 0 ? (
          <SpiritFigure
            key={i}
            x={s.x}
            y={s.y}
            height={s.h}
            opacity={sp * 0.6}
            color="#d0b870"
          />
        ) : null;
      })}

      {/* ── Foreground grass edges ── */}
      {[125, 140, 158, 175, 192, 210, 228, 248, 265].map((x, i) => (
        <g key={`fg${i}`} opacity={0.3 + p * 0.4}>
          <line x1={x - 1} y1={245} x2={x - 3} y2={245 - 8 * p}
            stroke={`hsl(110, ${12 + p * 10}%, ${5 + p * 4}%)`}
            strokeWidth={0.8} strokeLinecap="round" />
          <line x1={x + 1} y1={245} x2={x + 2} y2={245 - 10 * p}
            stroke={`hsl(105, ${10 + p * 8}%, ${6 + p * 5}%)`}
            strokeWidth={0.8} strokeLinecap="round" />
          <line x1={x + 3} y1={245} x2={x + 5} y2={245 - 6 * p}
            stroke={`hsl(115, ${14 + p * 10}%, ${4 + p * 4}%)`}
            strokeWidth={0.7} strokeLinecap="round" />
        </g>
      ))}
      </g>

      {/* ── FIREFLIES — physics-based drifting particles ── */}
      {p > 0.25 && <ParticleField particles={fireflyParticles} opacity={0.3} />}
    </svg>
  );
}

export default memo(SanctumScene);
