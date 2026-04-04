import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter, MistFilter, SoftLightFilter } from "../svg/filters";
import { Hill, Wisp, GrassRow } from "../svg/primitives";

/** Helper: clamp progress into a sub-range for staggered entry */
function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

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
}: {
  x: number;
  y: number;
  height: number;
  trunkWidth: number;
  canopyWidth: number;
  lean?: number;
  opacity?: number;
  color?: string;
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
      {/* Canopy - multiple organic blobs */}
      <ellipse
        cx={x + lx}
        cy={topY + cw * 0.35}
        rx={cw * 0.6}
        ry={cw * 0.55}
        fill={color}
      />
      <ellipse
        cx={x + lx - cw * 0.25}
        cy={topY + cw * 0.15}
        rx={cw * 0.45}
        ry={cw * 0.4}
        fill={color}
      />
      <ellipse
        cx={x + lx + cw * 0.3}
        cy={topY + cw * 0.2}
        rx={cw * 0.4}
        ry={cw * 0.38}
        fill={color}
      />
      <ellipse
        cx={x + lx + cw * 0.05}
        cy={topY - cw * 0.05}
        rx={cw * 0.35}
        ry={cw * 0.32}
        fill={color}
      />
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

function SanctumScene({ progress: p }: SceneProps) {
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
    { x: 155, y: 210, h: 32, delay: 0.55 },
    { x: 180, y: 215, h: 28, delay: 0.6 },
    { x: 200, y: 208, h: 35, delay: 0.65 },
    { x: 220, y: 214, h: 30, delay: 0.7 },
    { x: 245, y: 211, h: 33, delay: 0.75 },
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
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="moonGlow" radius={18} color="#d0b870" opacity={0.5} />
        <GlowFilter id="spiritGlow" radius={5} color="#d0b870" opacity={0.3} />
        <GlowFilter id="beamGlow" radius={4} color="#d0b870" opacity={0.15} />
        <MistFilter id="groundMist" scale={0.01} opacity={0.35} />
        <SoftLightFilter id="ambientWash" color="#d0b870" elevation={25} intensity={0.3} />

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
      </defs>

      {/* ── Sky ── */}
      <rect width="400" height="250" fill="url(#sanctumSky)" />

      {/* ── Gold ambient wash ── */}
      <rect width="400" height="250" fill="url(#goldAmbient)" />

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

      {/* ── Distant hills ── */}
      <Hill y={200} height={15} color={`hsl(220, ${10 + p * 8}%, ${5 + p * 3}%)`} seed={0.5} />

      {/* ── Left forest trees ── */}
      <ForestTree x={-10} y={240} height={190} trunkWidth={12} canopyWidth={45} lean={3}
        color={`hsl(120, ${8 + p * 5}%, ${4 + p * 2}%)`} />
      <ForestTree x={30} y={245} height={210} trunkWidth={10} canopyWidth={40} lean={2}
        color={`hsl(130, ${7 + p * 4}%, ${3 + p * 2}%)`} />
      <ForestTree x={65} y={242} height={180} trunkWidth={9} canopyWidth={35} lean={4}
        color={`hsl(125, ${9 + p * 5}%, ${4 + p * 2}%)`} />
      <ForestTree x={95} y={240} height={160} trunkWidth={8} canopyWidth={30} lean={5}
        color={`hsl(115, ${8 + p * 4}%, ${5 + p * 2}%)`} />
      <ForestTree x={118} y={243} height={145} trunkWidth={7} canopyWidth={28} lean={4}
        color={`hsl(120, ${7 + p * 5}%, ${5 + p * 3}%)`} />

      {/* ── Right forest trees ── */}
      <ForestTree x={410} y={240} height={195} trunkWidth={12} canopyWidth={44} lean={-3}
        color={`hsl(120, ${8 + p * 5}%, ${4 + p * 2}%)`} />
      <ForestTree x={375} y={244} height={205} trunkWidth={10} canopyWidth={38} lean={-2}
        color={`hsl(128, ${7 + p * 4}%, ${3 + p * 2}%)`} />
      <ForestTree x={340} y={241} height={175} trunkWidth={9} canopyWidth={34} lean={-4}
        color={`hsl(122, ${9 + p * 5}%, ${4 + p * 2}%)`} />
      <ForestTree x={310} y={242} height={155} trunkWidth={8} canopyWidth={30} lean={-5}
        color={`hsl(118, ${8 + p * 4}%, ${5 + p * 2}%)`} />
      <ForestTree x={285} y={244} height={140} trunkWidth={7} canopyWidth={27} lean={-4}
        color={`hsl(125, ${7 + p * 5}%, ${5 + p * 3}%)`} />

      {/* ── Clearing ground ── */}
      <Hill y={220} height={8} color={`hsl(100, ${12 + p * 10}%, ${6 + p * 5}%)`} seed={2.1} />
      <rect x={130} y={220} width={140} height={30} fill={`hsl(100, ${12 + p * 10}%, ${6 + p * 5}%)`} rx={3} />

      {/* ── Ground mandala ── */}
      {mandalaP > 0 && (
        <g opacity={mandalaP * 0.5}>
          {/* Mandala glow background */}
          <ellipse cx={200} cy={225} rx={40} ry={10} fill="url(#mandalaGrad)" />
          {/* Outer ring */}
          <ellipse
            cx={200} cy={225} rx={32} ry={8}
            fill="none" stroke="#d0b870" strokeWidth={0.6} opacity={0.4}
          />
          {/* Inner dashed ring */}
          <ellipse
            cx={200} cy={225} rx={22} ry={5.5}
            fill="none" stroke="#d0b870" strokeWidth={0.4}
            strokeDasharray="3 2" opacity={0.35}
          />
          {/* Compass markers - N, S, E, W */}
          <line x1={200} y1={225 - 8} x2={200} y2={225 - 12} stroke="#d0b870" strokeWidth={0.5} opacity={0.4} />
          <line x1={200} y1={225 + 8} x2={200} y2={225 + 12} stroke="#d0b870" strokeWidth={0.5} opacity={0.4} />
          <line x1={200 - 32} y1={225} x2={200 - 37} y2={225} stroke="#d0b870" strokeWidth={0.5} opacity={0.4} />
          <line x1={200 + 32} y1={225} x2={200 + 37} y2={225} stroke="#d0b870" strokeWidth={0.5} opacity={0.4} />
          {/* Center dot */}
          <circle cx={200} cy={225} r={1.5} fill="#d0b870" opacity={0.5} />
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

      {/* ── Grass rows in clearing ── */}
      <GrassRow y={228} color={`hsl(100, ${18 + p * 15}%, ${10 + p * 8}%)`} count={15} maxHeight={8} progress={p} />
      <GrassRow y={235} color={`hsl(95, ${15 + p * 12}%, ${8 + p * 6}%)`} count={10} maxHeight={6} progress={p * 0.7} />

      {/* ── Ground mist ── */}
      <rect
        x={120} y={210} width={160} height={40}
        fill="#b0a880"
        opacity={(0.3 + p * 0.15) * 0.25}
        filter="url(#groundMist)"
        rx={5}
      />

      {/* ── Spirit wisps / fireflies ── */}
      {wisps.map((w, i) => {
        const wp = sub(p, w.delay, 0.12);
        return wp > 0 ? (
          <Wisp
            key={i}
            x={w.x + Math.sin(i * 2.3) * 5}
            y={w.y + Math.cos(i * 1.7) * 3}
            color={w.color}
            radius={1.8 + (i % 3) * 0.4}
            opacity={wp * 0.5}
          />
        ) : null;
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
      <GrassRow y={245} color={`hsl(110, ${12 + p * 10}%, ${5 + p * 4}%)`} count={20} maxHeight={14} progress={p} />
    </svg>
  );
}

export default memo(SanctumScene);
