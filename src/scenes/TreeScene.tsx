import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter, TextureFilter, MistFilter } from "../svg/filters";
import { Hill, Wisp, GrassRow } from "../svg/primitives";

/** Helper: clamp progress into a sub-range for staggered entry */
function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

function TreeScene({ progress: p }: SceneProps) {
  // ── Background warmth ──
  const bgL = 4 + p * 5;
  const bgS = 10 + p * 12;

  // ── Roots — 6 major roots spreading outward ──
  const roots = [
    { cx1: -25, cy1: 8,  cx2: -55, cy2: 18, ex: -100, ey: 30, tw: 6, delay: 0 },
    { cx1: -15, cy1: 12, cx2: -35, cy2: 22, ex: -60,  ey: 35, tw: 5, delay: 0.04 },
    { cx1: -8,  cy1: 15, cx2: -18, cy2: 28, ex: -30,  ey: 38, tw: 4, delay: 0.07 },
    { cx1: 8,   cy1: 15, cx2: 18,  cy2: 28, ex: 30,   ey: 38, tw: 4, delay: 0.1 },
    { cx1: 15,  cy1: 12, cx2: 35,  cy2: 22, ex: 60,   ey: 35, tw: 5, delay: 0.13 },
    { cx1: 25,  cy1: 8,  cx2: 55,  cy2: 18, ex: 100,  ey: 30, tw: 6, delay: 0.16 },
  ];

  // ── Branches — 5 major branches ──
  const branches = [
    { cx1: -15, cy1: -15, cx2: -50, cy2: -40, ex: -90, ey: -55, tw: 5, delay: 0.2 },
    { cx1: -10, cy1: -20, cx2: -30, cy2: -50, ex: -55, ey: -72, tw: 4, delay: 0.26 },
    { cx1: 0,   cy1: -22, cx2: 0,   cy2: -55, ex: 0,   ey: -80, tw: 4.5, delay: 0.3 },
    { cx1: 10,  cy1: -20, cx2: 30,  cy2: -50, ex: 55,  ey: -72, tw: 4, delay: 0.34 },
    { cx1: 15,  cy1: -15, cx2: 50,  cy2: -40, ex: 90,  ey: -55, tw: 5, delay: 0.38 },
  ];

  // ── Leaf clusters at branch endpoints ──
  const leafClusters = [
    { x: 110, y: 50,  rx: 35, ry: 22, delay: 0.3 },
    { x: 145, y: 28,  rx: 30, ry: 20, delay: 0.36 },
    { x: 200, y: 18,  rx: 35, ry: 24, delay: 0.38 },
    { x: 255, y: 28,  rx: 30, ry: 20, delay: 0.42 },
    { x: 290, y: 50,  rx: 35, ry: 22, delay: 0.45 },
    // Secondary/overlapping canopy
    { x: 130, y: 38,  rx: 22, ry: 16, delay: 0.4 },
    { x: 175, y: 20,  rx: 26, ry: 18, delay: 0.43 },
    { x: 225, y: 20,  rx: 26, ry: 18, delay: 0.46 },
    { x: 270, y: 38,  rx: 22, ry: 16, delay: 0.48 },
  ];

  // ── Spirit lights in canopy ──
  const spiritLights = [
    { x: 105, y: 48,  r: 2.8, delay: 0.55, color: "#d8e8c8" },
    { x: 150, y: 30,  r: 2.2, delay: 0.6,  color: "#c8e0b8" },
    { x: 195, y: 18,  r: 3.0, delay: 0.63, color: "#e0f0d0" },
    { x: 240, y: 25,  r: 2.5, delay: 0.67, color: "#d0e8c0" },
    { x: 285, y: 45,  r: 2.6, delay: 0.71, color: "#d8e8c8" },
    { x: 135, y: 42,  r: 1.8, delay: 0.75, color: "#c0d8b0" },
    { x: 260, y: 35,  r: 2.0, delay: 0.78, color: "#d0e0c0" },
    { x: 175, y: 24,  r: 1.5, delay: 0.82, color: "#e0f0d8" },
    { x: 220, y: 22,  r: 1.6, delay: 0.85, color: "#cce0b8" },
  ];

  // ── Stars ──
  const stars = [
    { x: 30,  y: 15, r: 0.8 },
    { x: 65,  y: 22, r: 1.0 },
    { x: 340, y: 18, r: 0.9 },
    { x: 370, y: 28, r: 0.7 },
    { x: 380, y: 10, r: 0.6 },
    { x: 20,  y: 35, r: 0.5 },
    { x: 50,  y: 8,  r: 0.7 },
    { x: 355, y: 40, r: 0.5 },
  ];

  // Trunk center and dimensions
  const trunkCX = 200;
  const trunkBaseY = 210;
  const trunkTopY = 100;
  const trunkBaseW = 28;
  const trunkTopW = 12;

  // Energy flow progress
  const energyTrunkP = sub(p, 0.45, 0.25);
  const energyRootP = sub(p, 0.5, 0.3);
  const crownP = sub(p, 0.85, 0.15);

  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <GlowFilter id="treeGlow" radius={12} color="#b8c8a8" opacity={0.4} />
        <GlowFilter id="leyGlow" radius={4} color="#c8e8b0" opacity={0.5} />
        <GlowFilter id="spiritGlow" radius={6} color="#d8e8c8" opacity={0.3} />
        <TextureFilter id="barkTex" scale={0.1} intensity={0.2} seed={5} />
        <MistFilter id="groundMist" scale={0.012} opacity={0.3} />

        {/* Sky gradient */}
        <linearGradient id="treeSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(140, ${bgS}%, ${bgL + 3}%)`} />
          <stop offset="60%" stopColor={`hsl(130, ${bgS - 3}%, ${bgL}%)`} />
          <stop offset="100%" stopColor={`hsl(120, ${bgS + 2}%, ${bgL + 1}%)`} />
        </linearGradient>

        {/* Crown radial glow */}
        <radialGradient id="crownGlow" cx="50%" cy="20%" r="45%">
          <stop offset="0%" stopColor="#e0f0d0" stopOpacity={crownP * 0.25} />
          <stop offset="40%" stopColor="#b8c8a8" stopOpacity={crownP * 0.12} />
          <stop offset="100%" stopColor="#b8c8a8" stopOpacity={0} />
        </radialGradient>

        {/* Green ambient overlay */}
        <radialGradient id="greenAmbient" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#b8c8a8" stopOpacity={p * 0.08} />
          <stop offset="100%" stopColor="#b8c8a8" stopOpacity={0} />
        </radialGradient>

        {/* Trunk bark gradient */}
        <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a1a0c" />
          <stop offset="30%" stopColor="#3a2a18" />
          <stop offset="70%" stopColor="#3a2a18" />
          <stop offset="100%" stopColor="#2a1a0c" />
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

      {/* ── Sky ── */}
      <rect width="400" height="250" fill="url(#treeSky)" />

      {/* ── Green ambient wash ── */}
      <rect width="400" height="250" fill="url(#greenAmbient)" />

      <g className="bgLayer">
      {/* ── Stars ── */}
      {stars.map((s, i) => {
        const sp = sub(p, 0.02 + i * 0.04, 0.15);
        return (
          <g key={i} opacity={sp * 0.5}>
            <circle cx={s.x} cy={s.y} r={s.r * 3} fill="white" opacity={0.05} />
            <circle cx={s.x} cy={s.y} r={s.r} fill="white" opacity={0.5} />
          </g>
        );
      })}

      {/* ── Distant hills ── */}
      <Hill y={225} height={12} color={`hsl(130, ${8 + p * 8}%, ${5 + p * 3}%)`} seed={0.4} />
      <Hill y={230} height={10} color={`hsl(125, ${10 + p * 10}%, ${6 + p * 4}%)`} seed={1.6} />

      {/* ── Ground base ── */}
      <Hill y={218} height={10} color={`hsl(120, ${15 + p * 15}%, ${7 + p * 6}%)`} seed={2.3} />
      <rect x={0} y={225} width={400} height={25} fill={`hsl(120, ${18 + p * 15}%, ${8 + p * 6}%)`} />

      </g>

      <g className="midLayer">
      {/* ── Root glow on ground ── */}
      <ellipse
        cx={200} cy={232} rx={160 * (0.3 + p * 0.7)} ry={14}
        fill="#b8c8a8" opacity={p * 0.06}
      />

      {/* ── Roots — thick bezier curves ── */}
      {roots.map((r, i) => {
        const rp = sub(p, r.delay, 0.2);
        const ox = trunkCX;
        const oy = trunkBaseY;
        // Interpolate endpoint based on progress
        const endX = ox + r.ex * rp;
        const endY = oy + r.ey * rp;
        const c1x = ox + r.cx1 * rp;
        const c1y = oy + r.cy1 * rp;
        const c2x = ox + r.cx2 * rp;
        const c2y = oy + r.cy2 * rp;
        return (
          <g key={`root-${i}`}>
            {/* Root body */}
            <path
              d={`M${ox - 3} ${oy}
                  C${c1x - 2} ${c1y}, ${c2x - 1} ${c2y}, ${endX} ${endY}
                  L${endX + 1} ${endY + 2}
                  C${c2x + 2} ${c2y + 2}, ${c1x + 3} ${c1y + 2}, ${ox + 3} ${oy}
                  Z`}
              fill={`hsl(25, ${30 + p * 10}%, ${14 + p * 4}%)`}
              opacity={rp > 0 ? 0.9 : 0}
            />
            {/* Thicker outer shape for gnarled look */}
            <path
              d={`M${ox} ${oy} C${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`}
              fill="none"
              stroke={`hsl(25, ${28 + p * 8}%, ${12 + p * 3}%)`}
              strokeWidth={r.tw}
              strokeLinecap="round"
              opacity={rp > 0 ? 1 : 0}
            />
            {/* Ley line energy through roots */}
            {energyRootP > 0 && rp > 0.5 && (() => {
              const rootLen = Math.sqrt((endX - ox) ** 2 + (endY - oy) ** 2) * 1.4;
              return (
                <path
                  d={`M${ox} ${oy} C${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`}
                  fill="none"
                  stroke="#c8e8b0"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeDasharray={rootLen}
                  strokeDashoffset={rootLen * (1 - energyRootP)}
                  opacity={energyRootP * 0.35}
                  filter="url(#leyGlow)"
                />
              );
            })()}
          </g>
        );
      })}

      {/* ── Trunk — organic bezier shape ── */}
      <path
        d={`M${trunkCX - trunkBaseW} ${trunkBaseY}
            C${trunkCX - trunkBaseW + 2} ${trunkBaseY - 30},
             ${trunkCX - trunkBaseW + 8} ${trunkBaseY - 60},
             ${trunkCX - trunkBaseW + 5} ${trunkBaseY - 80}
            C${trunkCX - trunkTopW - 5} ${trunkTopY + 20},
             ${trunkCX - trunkTopW - 2} ${trunkTopY + 8},
             ${trunkCX - trunkTopW} ${trunkTopY}
            L${trunkCX + trunkTopW} ${trunkTopY}
            C${trunkCX + trunkTopW + 2} ${trunkTopY + 8},
             ${trunkCX + trunkTopW + 5} ${trunkTopY + 20},
             ${trunkCX + trunkBaseW - 5} ${trunkBaseY - 80}
            C${trunkCX + trunkBaseW - 8} ${trunkBaseY - 60},
             ${trunkCX + trunkBaseW - 2} ${trunkBaseY - 30},
             ${trunkCX + trunkBaseW} ${trunkBaseY}
            Z`}
        fill="url(#trunkGrad)"
        filter="url(#barkTex)"
      />
      {/* Trunk bark detail lines */}
      {[0.2, 0.35, 0.5, 0.65, 0.8].map((t, i) => {
        const ty = trunkBaseY - (trunkBaseY - trunkTopY) * t;
        const w = trunkBaseW - (trunkBaseW - trunkTopW) * t;
        return (
          <path
            key={`bark-${i}`}
            d={`M${trunkCX - w * 0.6} ${ty}
                Q${trunkCX - w * 0.2} ${ty - 3 + i * 0.5},
                 ${trunkCX + w * 0.1} ${ty + 1}
                Q${trunkCX + w * 0.4} ${ty + 2},
                 ${trunkCX + w * 0.7} ${ty - 1}`}
            fill="none"
            stroke="#1a0e06"
            strokeWidth={0.6}
            opacity={0.25}
          />
        );
      })}

      {/* ── Trunk gnarled bulges ── */}
      <ellipse cx={trunkCX - 18} cy={170} rx={8} ry={12}
        fill="#30200e" opacity={0.4} />
      <ellipse cx={trunkCX + 15} cy={145} rx={6} ry={10}
        fill="#30200e" opacity={0.35} />

      {/* ── Energy flow up the trunk ── */}
      {energyTrunkP > 0 && (() => {
        const trunkLen = (trunkBaseY - trunkTopY) * 1.3;
        return (
          <g>
            <path
              d={`M${trunkCX - 5} ${trunkBaseY}
                  C${trunkCX - 6} ${trunkBaseY - 40},
                   ${trunkCX - 3} ${trunkBaseY - 80},
                   ${trunkCX - 4} ${trunkTopY}`}
              fill="none"
              stroke="#c8e8b0"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray={trunkLen}
              strokeDashoffset={trunkLen * (1 - energyTrunkP)}
              opacity={energyTrunkP * 0.35}
              filter="url(#leyGlow)"
            />
            <path
              d={`M${trunkCX + 5} ${trunkBaseY}
                  C${trunkCX + 4} ${trunkBaseY - 35},
                   ${trunkCX + 6} ${trunkBaseY - 75},
                   ${trunkCX + 3} ${trunkTopY}`}
              fill="none"
              stroke="#b8dca0"
              strokeWidth={1}
              strokeLinecap="round"
              strokeDasharray={trunkLen}
              strokeDashoffset={trunkLen * (1 - energyTrunkP)}
              opacity={energyTrunkP * 0.25}
              filter="url(#leyGlow)"
            />
          </g>
        );
      })()}

      {/* ── Branches — bezier curves ── */}
      {branches.map((b, i) => {
        const bp = sub(p, b.delay, 0.2);
        if (bp <= 0) return null;
        const ox = trunkCX;
        const oy = trunkTopY;
        const endX = ox + b.ex * bp;
        const endY = oy + b.ey * bp;
        const c1x = ox + b.cx1 * bp;
        const c1y = oy + b.cy1 * bp;
        const c2x = ox + b.cx2 * bp;
        const c2y = oy + b.cy2 * bp;
        return (
          <g key={`branch-${i}`}>
            <path
              d={`M${ox} ${oy} C${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`}
              fill="none"
              stroke="#3a2a18"
              strokeWidth={b.tw}
              strokeLinecap="round"
            />
            {/* Thinner secondary line for dimension */}
            <path
              d={`M${ox} ${oy} C${c1x + 1} ${c1y - 1}, ${c2x + 1} ${c2y - 1}, ${endX + 1} ${endY - 1}`}
              fill="none"
              stroke="#2a1a0c"
              strokeWidth={b.tw * 0.4}
              strokeLinecap="round"
              opacity={0.4}
            />
          </g>
        );
      })}

      {/* ── Leaf canopy — overlapping organic ellipses ── */}
      {leafClusters.map((l, i) => {
        const lp = sub(p, l.delay, 0.2);
        if (lp <= 0) return null;
        const scale = lp;
        return (
          <g key={`leaf-${i}`}>
            <ellipse
              cx={l.x} cy={l.y}
              rx={l.rx * scale} ry={l.ry * scale}
              fill={`hsl(${120 + (i % 3) * 5}, ${25 + p * 18}%, ${12 + p * 10}%)`}
              opacity={lp * 0.8}
            />
            {/* Highlight on top */}
            <ellipse
              cx={l.x - l.rx * 0.1} cy={l.y - l.ry * 0.2}
              rx={l.rx * scale * 0.6} ry={l.ry * scale * 0.4}
              fill={`hsl(${125 + (i % 3) * 5}, ${30 + p * 15}%, ${16 + p * 12}%)`}
              opacity={lp * 0.4}
            />
          </g>
        );
      })}

      </g>

      <g className="fgLayer">
      {/* ── Spirit lights in canopy ── */}
      {spiritLights.map((s, i) => {
        const sp = sub(p, s.delay, 0.12);
        if (sp <= 0) return null;
        return (
          <Wisp
            key={`spirit-${i}`}
            x={s.x}
            y={s.y}
            color={s.color}
            radius={s.r * sp}
            opacity={sp * 0.6}
          />
        );
      })}

      {/* ── Crown glow — radiance at high progress ── */}
      {crownP > 0 && (
        <g>
          <ellipse
            cx={200} cy={25}
            rx={90 * crownP} ry={40 * crownP}
            fill="#b8c8a8" opacity={crownP * 0.08}
          />
          <ellipse
            cx={200} cy={30}
            rx={65 * crownP} ry={28 * crownP}
            fill="#d8e8c8" opacity={crownP * 0.06}
          />
          <rect
            width="400" height="250"
            fill="url(#crownGlow)"
            opacity={crownP}
          />
        </g>
      )}

      {/* ── Ground grass ── */}
      <GrassRow
        y={222}
        color={`hsl(120, ${25 + p * 18}%, ${12 + p * 10}%)`}
        count={35}
        maxHeight={14}
        progress={p}
      />
      <GrassRow
        y={230}
        color={`hsl(115, ${20 + p * 15}%, ${10 + p * 8}%)`}
        count={25}
        maxHeight={10}
        progress={p * 0.8}
      />

      {/* ── Ground mist at base ── */}
      <rect
        x={40} y={210} width={320} height={40}
        fill="#a0b890"
        opacity={(0.2 + p * 0.1) * 0.3}
        filter="url(#groundMist)"
        rx={6}
      />

      {/* ── Foreground grass ── */}
      <GrassRow
        y={242}
        color={`hsl(118, ${18 + p * 14}%, ${8 + p * 6}%)`}
        count={18}
        maxHeight={18}
        progress={p}
      />
      </g>

      {/* Atmospheric particles — leaf particles, spirit lights, pollen */}
      {Array.from({ length: 40 }).map((_, i) => {
        const px = (i * 47 + 13) % 400;
        const baseY = (i * 71 + 29) % 220 + 15;
        const drift = Math.sin(p * Math.PI * 2 + i * 0.7) * 8;
        const py = baseY - p * 30 * ((i % 5) / 5);
        const size = 0.5 + (i % 4) * 0.3;
        const opacity = (0.08 + (i % 3) * 0.06) * (0.3 + p * 0.7);
        return (
          <circle key={`p${i}`} cx={px + drift} cy={py} r={size}
            fill={i % 5 === 0 ? "#d8e8c8" : "#90b890"} opacity={opacity} />
        );
      })}
    </svg>
  );
}

export default memo(TreeScene);
