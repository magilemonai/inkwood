import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter, TextureFilter, MistFilter } from "../svg/filters";
import { TreeSilhouette, StoneBlock, Wisp, GrassRow } from "../svg/primitives";

/** Helper: clamp progress into a sub-range for staggered entry */
function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

/** Spirit lantern on a post */
function Lantern({
  x,
  y,
  lit,
  glow,
}: {
  x: number;
  y: number;
  lit: number;
  glow: string;
}) {
  return (
    <g>
      {/* Lantern body */}
      <path
        d={`M${x - 3} ${y} L${x - 2.5} ${y + 7} L${x + 2.5} ${y + 7} L${x + 3} ${y} Z`}
        fill="#3a3530"
        stroke="#2a2520"
        strokeWidth={0.4}
      />
      {/* Lantern cap */}
      <path
        d={`M${x - 3.5} ${y} L${x} ${y - 3} L${x + 3.5} ${y} Z`}
        fill="#3a3530"
      />
      {/* Light glow inside */}
      {lit > 0 && (
        <g opacity={lit} filter={`url(#${glow})`}>
          <ellipse cx={x} cy={y + 3.5} rx={2} ry={3} fill="#e8c858" opacity={0.7} />
          <ellipse cx={x} cy={y + 3.5} rx={1} ry={2} fill="#f5e080" opacity={0.9} />
        </g>
      )}
      {/* Hanging hook */}
      <path
        d={`M${x} ${y - 3} L${x} ${y - 5}`}
        stroke="#3a3530"
        strokeWidth={0.8}
        strokeLinecap="round"
      />
    </g>
  );
}

/** Celtic-knot-inspired carving paths */
const CARVING_PATHS = [
  "M-4 0 C-2 -3, 2 -3, 4 0 C2 3, -2 3, -4 0 M-2 -2 C0 0, 0 0, 2 -2 M-2 2 C0 0, 0 0, 2 2",
  "M-3 -3 L3 -3 L3 3 L-3 3 Z M-1.5 -1.5 L1.5 -1.5 L1.5 1.5 L-1.5 1.5 Z",
  "M0 -4 L2 0 L0 4 L-2 0 Z M-3 0 L0 -2 L3 0 L0 2 Z",
  "M-4 -1 C-2 -3, 2 3, 4 1 M-4 1 C-2 3, 2 -3, 4 -1",
  "M-3 -3 Q0 -1, 3 -3 M-3 0 Q0 2, 3 0 M-3 3 Q0 5, 3 3",
];

function BridgeScene({ progress: p }: SceneProps) {
  // ── Sky ──
  const skyH = 210 + p * 15;
  const skyS = 10 + p * 18;
  const skyL = 5 + p * 12;

  // ── Bridge geometry ──
  const bridgeY = 120; // walkway surface Y
  const bridgeLeft = 80;
  const bridgeRight = 320;
  const archDepth = 55;
  const bridgeCx = 200;

  // ── Cliff positions ──
  const leftCliffRight = 95;
  const rightCliffLeft = 305;

  // ── Carving glow (after 35%) ──
  const carvingP = sub(p, 0.35, 0.3);

  // ── Lantern lighting — sequential ──
  const lanternPositions = [
    { x: 120, postY: bridgeY - 2, delay: 0.2 },
    { x: 160, postY: bridgeY - 3, delay: 0.35 },
    { x: 200, postY: bridgeY - 4, delay: 0.5 },
    { x: 240, postY: bridgeY - 3, delay: 0.6 },
    { x: 280, postY: bridgeY - 2, delay: 0.72 },
  ];

  // ── Ghostly footprints (after 85%) ──
  const footprintP = sub(p, 0.85, 0.12);

  // ── Moss fading ──
  const mossOpacity = Math.max(0, 1 - p * 1.3);

  // ── Spirit light trail (high progress) ──
  const trailP = sub(p, 0.75, 0.2);

  // ── Carving positions along bridge stones ──
  const carvings = [
    { x: 125, y: 128, path: 0 },
    { x: 155, y: 130, path: 1 },
    { x: 185, y: 132, path: 2 },
    { x: 215, y: 132, path: 3 },
    { x: 245, y: 130, path: 4 },
    { x: 275, y: 128, path: 0 },
  ];

  // Compute arch Y for a given X
  function archY(x: number): number {
    const t = (x - bridgeLeft) / (bridgeRight - bridgeLeft);
    return bridgeY + archDepth * Math.sin(t * Math.PI);
  }

  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        {/* Filters */}
        <GlowFilter id="carvingGlow" radius={4} color="#7aaa6a" opacity={0.6} />
        <GlowFilter id="lanternGlow" radius={8} color="#e8c858" opacity={0.5} />
        <GlowFilter id="trailGlow" radius={6} color="#7aaa6a" opacity={0.4} />
        <GlowFilter id="footGlow" radius={3} color="#7aaa6a" opacity={0.3} />
        <TextureFilter id="cliffTex" scale={0.07} intensity={0.2} seed={5} />
        <TextureFilter id="bridgeTex" scale={0.09} intensity={0.15} seed={11} />
        <MistFilter id="chasmMist" scale={0.008} opacity={0.35} />
        <MistFilter id="thinMist" scale={0.012} opacity={0.18} />

        {/* Sky gradient */}
        <linearGradient id="bridgeSkyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${skyH + 10}, ${skyS}%, ${skyL + 5}%)`} />
          <stop offset="100%" stopColor={`hsl(${skyH}, ${skyS + 5}%, ${skyL}%)`} />
        </linearGradient>

        {/* Chasm depth gradient */}
        <linearGradient id="chasmGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0c08" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#020303" stopOpacity={0.95} />
        </linearGradient>

        {/* Mist layers gradient */}
        <linearGradient id="mistFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity={0.02} />
          <stop offset="40%" stopColor="white" stopOpacity={0.06} />
          <stop offset="100%" stopColor="white" stopOpacity={0.15} />
        </linearGradient>
      </defs>

      {/* ── Sky ── */}
      <rect width="400" height="250" fill="url(#bridgeSkyGrad)" />

      {/* ── Distant mountain peaks ── */}
      <path
        d="M0 130 L30 75 L55 95 L90 55 L120 90 L150 60 L185 85 L200 70
           L220 85 L250 50 L280 80 L310 60 L345 90 L370 70 L400 100 L400 150 L0 150 Z"
        fill={`hsl(220, ${8 + p * 5}%, ${6 + p * 3}%)`}
        opacity={0.3 + p * 0.2}
      />
      {/* Secondary peaks */}
      <path
        d="M0 140 L40 100 L70 115 L110 80 L145 105 L180 90 L210 100
           L250 75 L290 100 L320 85 L360 110 L400 95 L400 160 L0 160 Z"
        fill={`hsl(215, ${10 + p * 5}%, ${7 + p * 3}%)`}
        opacity={0.35 + p * 0.2}
      />

      {/* ── Background trees on cliff edges ── */}
      <TreeSilhouette x={15} y={128} height={50} spread={18} color={`hsl(150, 10%, ${6 + p * 2}%)`} opacity={0.3 + p * 0.2} />
      <TreeSilhouette x={45} y={125} height={60} spread={22} color={`hsl(145, 12%, ${5 + p * 2}%)`} opacity={0.35 + p * 0.25} />
      <TreeSilhouette x={70} y={122} height={45} spread={18} color={`hsl(150, 10%, ${7 + p * 2}%)`} opacity={0.3 + p * 0.2} />
      <TreeSilhouette x={330} y={125} height={55} spread={20} color={`hsl(148, 11%, ${6 + p * 2}%)`} opacity={0.3 + p * 0.25} />
      <TreeSilhouette x={360} y={122} height={48} spread={18} color={`hsl(150, 10%, ${7 + p * 2}%)`} opacity={0.35 + p * 0.2} />
      <TreeSilhouette x={390} y={126} height={58} spread={22} color={`hsl(145, 12%, ${5 + p * 2}%)`} opacity={0.3 + p * 0.2} />

      {/* ── Chasm void ── */}
      <rect x={leftCliffRight - 5} y={bridgeY} width={rightCliffLeft - leftCliffRight + 10} height={130} fill="url(#chasmGrad)" />

      {/* ── Left cliff face ── */}
      <g filter="url(#cliffTex)">
        {/* Main cliff body */}
        <path
          d={`M0 105 L${leftCliffRight - 5} 112 L${leftCliffRight + 5} 118
              L${leftCliffRight + 2} 250 L0 250 Z`}
          fill="#2a2824"
        />
        {/* Cliff stone layers */}
        <StoneBlock x={0} y={110} width={50} height={18} color="#302e28" seed={1} roughness={3} />
        <StoneBlock x={45} y={112} width={40} height={16} color="#2c2a24" seed={2} roughness={3} />
        <StoneBlock x={5} y={128} width={45} height={20} color="#282622" seed={3} roughness={3.5} />
        <StoneBlock x={48} y={126} width={42} height={18} color="#322e28" seed={4} roughness={3} />
        <StoneBlock x={0} y={148} width={55} height={22} color="#2a2824" seed={5} roughness={3.5} />
        <StoneBlock x={50} y={145} width={45} height={20} color="#302c26" seed={6} roughness={3} />
        <StoneBlock x={10} y={170} width={50} height={25} color="#262420" seed={7} roughness={3.5} />
        <StoneBlock x={55} y={168} width={40} height={22} color="#2c2a24" seed={8} roughness={3} />
        <StoneBlock x={0} y={195} width={60} height={28} color="#242220" seed={9} roughness={4} />
        <StoneBlock x={55} y={192} width={42} height={25} color="#282622" seed={10} roughness={3.5} />
        <StoneBlock x={0} y={222} width={55} height={28} color="#201e1c" seed={11} roughness={4} />
        <StoneBlock x={50} y={218} width={48} height={32} color="#262420" seed={12} roughness={3.5} />
      </g>

      {/* ── Right cliff face ── */}
      <g filter="url(#cliffTex)">
        <path
          d={`M${rightCliffLeft - 2} 118 L${rightCliffLeft + 5} 112 L400 105
              L400 250 L${rightCliffLeft - 5} 250 Z`}
          fill="#2a2824"
        />
        <StoneBlock x={rightCliffLeft} y={110} width={45} height={18} color="#302e28" seed={13} roughness={3} />
        <StoneBlock x={rightCliffLeft + 40} y={112} width={55} height={16} color="#2c2a24" seed={14} roughness={3} />
        <StoneBlock x={rightCliffLeft - 2} y={128} width={48} height={20} color="#282622" seed={15} roughness={3.5} />
        <StoneBlock x={rightCliffLeft + 42} y={126} width={53} height={18} color="#322e28" seed={16} roughness={3} />
        <StoneBlock x={rightCliffLeft} y={148} width={50} height={22} color="#2a2824" seed={17} roughness={3.5} />
        <StoneBlock x={rightCliffLeft + 45} y={145} width={50} height={20} color="#302c26" seed={18} roughness={3} />
        <StoneBlock x={rightCliffLeft - 3} y={170} width={52} height={25} color="#262420" seed={19} roughness={3.5} />
        <StoneBlock x={rightCliffLeft + 44} y={168} width={51} height={22} color="#2c2a24" seed={20} roughness={3} />
        <StoneBlock x={rightCliffLeft} y={195} width={55} height={28} color="#242220" seed={21} roughness={4} />
        <StoneBlock x={rightCliffLeft + 48} y={192} width={47} height={25} color="#282622" seed={22} roughness={3.5} />
        <StoneBlock x={rightCliffLeft - 2} y={222} width={52} height={28} color="#201e1c" seed={23} roughness={4} />
        <StoneBlock x={rightCliffLeft + 46} y={218} width={49} height={32} color="#262420" seed={24} roughness={3.5} />
      </g>

      {/* ── Bridge arch structure ── */}
      <g filter="url(#bridgeTex)">
        {/* Arch underside — bezier curve */}
        <path
          d={`M${bridgeLeft} ${bridgeY + 8}
              C${bridgeLeft + 40} ${bridgeY + 10},
               ${bridgeCx - 40} ${bridgeY + archDepth + 5},
               ${bridgeCx} ${bridgeY + archDepth + 5}
              C${bridgeCx + 40} ${bridgeY + archDepth + 5},
               ${bridgeRight - 40} ${bridgeY + 10},
               ${bridgeRight} ${bridgeY + 8}
              L${bridgeRight} ${bridgeY + 14}
              C${bridgeRight - 40} ${bridgeY + 16},
               ${bridgeCx + 40} ${bridgeY + archDepth + 12},
               ${bridgeCx} ${bridgeY + archDepth + 12}
              C${bridgeCx - 40} ${bridgeY + archDepth + 12},
               ${bridgeLeft + 40} ${bridgeY + 16},
               ${bridgeLeft} ${bridgeY + 14} Z`}
          fill="#302c26"
          opacity={0.8}
        />

        {/* Arch keystone blocks along the curve */}
        {Array.from({ length: 16 }).map((_, i) => {
          const t = (i + 0.5) / 16;
          const ax = bridgeLeft + t * (bridgeRight - bridgeLeft);
          const ay = archY(ax);
          const bw = 14 + (i % 3) * 2;
          const bh = 10 + (i % 2) * 2;
          return (
            <StoneBlock
              key={i}
              x={ax - bw / 2}
              y={ay - bh / 2}
              width={bw}
              height={bh}
              color={i % 3 === 0 ? "#383530" : i % 3 === 1 ? "#302c28" : "#353228"}
              seed={30 + i}
              roughness={2}
            />
          );
        })}

        {/* Bridge walkway surface */}
        <rect x={bridgeLeft} y={bridgeY - 6} width={bridgeRight - bridgeLeft} height={14} fill="#3a3632" rx={1} />

        {/* Paving stones on walkway */}
        {Array.from({ length: 12 }).map((_, i) => {
          const px = bridgeLeft + 5 + i * 20;
          return (
            <StoneBlock
              key={`pave-${i}`}
              x={px}
              y={bridgeY - 5}
              width={18}
              height={12}
              color={i % 2 === 0 ? "#3e3a34" : "#34302c"}
              seed={50 + i}
              roughness={1.5}
            />
          );
        })}

        {/* Bridge side wall / parapet base */}
        <rect x={bridgeLeft} y={bridgeY - 10} width={bridgeRight - bridgeLeft} height={5} fill="#343028" rx={0.5} />
      </g>

      {/* ── Railing posts ── */}
      {[105, 145, 185, 225, 265, 300].map((px, i) => (
        <g key={`post-${i}`}>
          <rect
            x={px - 2}
            y={bridgeY - 24}
            width={4}
            height={15}
            fill="#3a3630"
            rx={0.5}
          />
          {/* Post cap */}
          <rect
            x={px - 3}
            y={bridgeY - 26}
            width={6}
            height={3}
            fill="#3e3a34"
            rx={0.5}
          />
        </g>
      ))}

      {/* Rail connecting posts */}
      <path
        d="M103 -22 L108 -22 L148 -23 L188 -24 L228 -24 L268 -23 L303 -22"
        transform={`translate(0, ${bridgeY})`}
        fill="none"
        stroke="#3a3630"
        strokeWidth={2.5}
        strokeLinecap="round"
      />

      {/* ── Moss on bridge (fades as it awakens) ── */}
      {mossOpacity > 0.05 && (
        <g opacity={mossOpacity}>
          <ellipse cx={130} cy={bridgeY} rx={8} ry={3} fill="#2a5a28" opacity={0.5} />
          <ellipse cx={175} cy={bridgeY - 2} rx={10} ry={3.5} fill="#1e4a1c" opacity={0.4} />
          <ellipse cx={220} cy={bridgeY + 1} rx={7} ry={3} fill="#2a5a28" opacity={0.45} />
          <ellipse cx={260} cy={bridgeY - 1} rx={9} ry={3} fill="#225522" opacity={0.4} />
          <ellipse cx={110} cy={bridgeY - 14} rx={5} ry={2} fill="#1e5020" opacity={0.35} />
          <ellipse cx={280} cy={bridgeY - 14} rx={6} ry={2.5} fill="#2a5a28" opacity={0.35} />
        </g>
      )}

      {/* ── Glowing carvings on bridge stones ── */}
      {carvingP > 0 && (
        <g filter="url(#carvingGlow)" opacity={carvingP}>
          {carvings.map((c, i) => (
            <g key={i} opacity={sub(p, 0.35 + i * 0.05, 0.15)}>
              <path
                d={CARVING_PATHS[c.path]}
                transform={`translate(${c.x}, ${c.y}) scale(0.9)`}
                fill="none"
                stroke="#7aaa6a"
                strokeWidth={0.9}
                strokeLinecap="round"
              />
            </g>
          ))}
        </g>
      )}

      {/* ── Spirit lanterns ── */}
      {lanternPositions.map((l, i) => (
        <Lantern
          key={i}
          x={l.x}
          y={bridgeY - 30}
          lit={sub(p, l.delay, 0.15)}
          glow="lanternGlow"
        />
      ))}

      {/* ── Ghostly footprints on bridge surface ── */}
      {footprintP > 0 && (
        <g opacity={footprintP * 0.45} filter="url(#footGlow)">
          {[140, 165, 190, 215, 240, 265].map((fx, i) => (
            <g key={i} opacity={sub(p, 0.85 + i * 0.015, 0.05)}>
              {/* Left foot */}
              <ellipse
                cx={fx - 2}
                cy={bridgeY + 1}
                rx={2.2}
                ry={3.5}
                fill="none"
                stroke="#7aaa6a"
                strokeWidth={0.6}
                transform={`rotate(${i % 2 === 0 ? -8 : 8}, ${fx - 2}, ${bridgeY + 1})`}
              />
              {/* Right foot */}
              <ellipse
                cx={fx + 4}
                cy={bridgeY - 1}
                rx={2.2}
                ry={3.5}
                fill="none"
                stroke="#7aaa6a"
                strokeWidth={0.6}
                transform={`rotate(${i % 2 === 0 ? 8 : -8}, ${fx + 4}, ${bridgeY - 1})`}
              />
            </g>
          ))}
        </g>
      )}

      {/* ── Spirit light trail along bridge ── */}
      {trailP > 0 && (
        <g opacity={trailP * 0.35} filter="url(#trailGlow)">
          <path
            d={`M${bridgeLeft + 15} ${bridgeY - 2}
                Q${bridgeCx - 40} ${bridgeY - 4},
                 ${bridgeCx} ${bridgeY - 3}
                Q${bridgeCx + 40} ${bridgeY - 2},
                 ${bridgeRight - 15} ${bridgeY - 2}`}
            fill="none"
            stroke="#7aaa6a"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="4 8"
            opacity={0.6}
          />
          {/* Light particles along trail */}
          {[0.15, 0.3, 0.5, 0.65, 0.8].map((t, i) => {
            const tx = bridgeLeft + t * (bridgeRight - bridgeLeft);
            return (
              <Wisp
                key={i}
                x={tx}
                y={bridgeY - 3}
                color="#7aaa6a"
                radius={1.5}
                opacity={trailP * 0.4}
              />
            );
          })}
        </g>
      )}

      {/* ── Chasm mist layers — denser at bottom, thinner upward ── */}
      {/* Dense bottom mist */}
      <rect
        x={leftCliffRight - 10}
        y={200}
        width={rightCliffLeft - leftCliffRight + 20}
        height={50}
        fill="white"
        opacity={0.1 + (1 - p * 0.3) * 0.06}
        filter="url(#chasmMist)"
      />
      {/* Mid mist */}
      <rect
        x={leftCliffRight - 5}
        y={165}
        width={rightCliffLeft - leftCliffRight + 10}
        height={45}
        fill="white"
        opacity={0.06 + (1 - p * 0.3) * 0.04}
        filter="url(#chasmMist)"
      />
      {/* Upper thin mist */}
      <rect
        x={leftCliffRight}
        y={bridgeY + 15}
        width={rightCliffLeft - leftCliffRight}
        height={40}
        fill="white"
        opacity={0.03 + (1 - p * 0.4) * 0.02}
        filter="url(#thinMist)"
      />

      {/* ── Cliff top grass ── */}
      <GrassRow
        y={118}
        color={`hsl(140, ${25 + p * 15}%, ${14 + p * 8}%)`}
        count={12}
        maxHeight={10}
        progress={0.4 + p * 0.6}
      />

      {/* ── Foreground cliff vegetation ── */}
      <GrassRow
        y={115}
        color={`hsl(135, ${20 + p * 15}%, ${12 + p * 8}%)`}
        count={8}
        maxHeight={8}
        progress={0.3 + p * 0.7}
      />
    </svg>
  );
}

export default memo(BridgeScene);
