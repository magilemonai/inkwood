import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter, TextureFilter, WaterFilter, MistFilter } from "../svg/filters";
import { Hill, TreeSilhouette, StoneBlock, Wisp, GrassRow } from "../svg/primitives";

/** Helper: clamp progress into a sub-range for staggered entry */
function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

/** Rune paths — small angular glyphs */
const RUNE_PATHS = [
  "M0 -4 L2 -1 L0 4 L-2 -1 Z",
  "M-3 -3 L3 -3 L0 4 Z",
  "M0 -4 L3 0 L0 4 L-3 0 Z",
  "M-2 -4 L2 -4 L2 0 L-2 4 L-2 0 Z",
  "M0 -4 L2 -2 L2 2 L0 4 L-2 2 L-2 -2 Z",
  "M-3 0 L0 -4 L3 0 M-2 1 L0 4 L2 1",
  "M-2 -4 L2 -4 M0 -4 L0 4 M-2 4 L2 4",
  "M-2 -3 L2 -1 L-2 1 L2 3",
];

/** Spirit fish shape */
function SpiritFish({
  x,
  y,
  scale = 1,
  flip = false,
  opacity = 0.5,
  color = "#50b8b8",
}: {
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  opacity?: number;
  color?: string;
}) {
  const sx = flip ? -scale : scale;
  return (
    <g transform={`translate(${x}, ${y}) scale(${sx}, ${scale})`} opacity={opacity}>
      <path
        d={`M-8 0 C-5 -3, 2 -4, 7 -1 C8 0, 8 0, 7 1 C2 4, -5 3, -8 0 Z`}
        fill={color}
        opacity={0.6}
      />
      <path
        d="M-9 0 L-12 -2.5 L-10.5 0 L-12 2.5 Z"
        fill={color}
        opacity={0.5}
      />
      <circle cx={4} cy={-0.5} r={0.6} fill="white" opacity={0.8} />
    </g>
  );
}

function WellScene({ progress: p }: SceneProps) {
  // ── Sky ──
  const skyH = 190 + p * 15;
  const skyS = 12 + p * 20;
  const skyL = 6 + p * 14;

  // ── Well dimensions ──
  const wellCx = 200;
  const wellTop = 148;
  const wellBottom = 195;
  const wellInnerLeft = 168;
  const wellInnerRight = 232;
  const wellOuterLeft = 158;
  const wellOuterRight = 242;

  // ── Water level rises with progress ──
  const waterMaxRise = 35;
  const waterLevel = wellBottom - waterMaxRise * p;

  // ── Bucket descends ──
  const bucketY = wellTop - 30 + p * 55;

  // ── Rune visibility (after 40%) ──
  const runeP = sub(p, 0.4, 0.3);

  // ── Spirit fish (after 70%) ──
  const fishP = sub(p, 0.7, 0.2);

  // ── Moss fading (starts visible, fades as well awakens) ──
  const mossOpacity = Math.max(0, 1 - p * 1.4);

  // ── Firefly wisps (late) ──
  const wisps = [
    { x: 52, y: 95, delay: 0.75 },
    { x: 340, y: 80, delay: 0.8 },
    { x: 90, y: 60, delay: 0.85 },
    { x: 310, y: 110, delay: 0.88 },
    { x: 150, y: 50, delay: 0.92 },
    { x: 260, y: 70, delay: 0.95 },
  ];

  // ── Rune positions on well stones ──
  const runes = [
    { x: 165, y: 160, path: 0 },
    { x: 175, y: 175, path: 1 },
    { x: 195, y: 155, path: 2 },
    { x: 215, y: 170, path: 3 },
    { x: 230, y: 158, path: 4 },
    { x: 225, y: 182, path: 5 },
    { x: 185, y: 188, path: 6 },
    { x: 205, y: 185, path: 7 },
  ];

  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        {/* Filters */}
        <GlowFilter id="runeGlow" radius={5} color="#50b8b8" opacity={0.7} />
        <GlowFilter id="fishGlow" radius={4} color="#50b8b8" opacity={0.4} />
        <GlowFilter id="wispGlow" radius={6} color="#50b8b8" opacity={0.5} />
        <TextureFilter id="stoneTex" scale={0.08} intensity={0.18} seed={3} />
        <TextureFilter id="woodTex" scale={0.12} intensity={0.12} seed={9} />
        <WaterFilter id="wellWater" scale={0.025} strength={6} seed={14} />
        <MistFilter id="clearingMist" scale={0.01} opacity={0.2} />

        {/* Sky gradient */}
        <linearGradient id="wellSkyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${skyH + 15}, ${skyS}%, ${skyL + 6}%)`} />
          <stop offset="100%" stopColor={`hsl(${skyH}, ${skyS + 5}%, ${skyL}%)`} />
        </linearGradient>

        {/* Water gradient — darker at depth, lighter at surface */}
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3aafaf" stopOpacity={0.7} />
          <stop offset="30%" stopColor="#50b8b8" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#1a6868" stopOpacity={0.9} />
        </linearGradient>

        {/* Water surface highlight */}
        <linearGradient id="waterSurface" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#80e0e0" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#50b8b8" stopOpacity={0} />
        </linearGradient>

        {/* Well interior darkness */}
        <linearGradient id="wellInterior" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0a0a" />
          <stop offset="100%" stopColor="#050808" />
        </linearGradient>

        {/* Clip for water inside well */}
        <clipPath id="wellClip">
          <rect x={wellInnerLeft} y={wellTop} width={wellInnerRight - wellInnerLeft} height={wellBottom - wellTop + 5} />
        </clipPath>
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
      <rect width="400" height="250" fill="url(#wellSkyGrad)" />

      <g className="bgLayer">
      {/* ── Distant hills ── */}
      <Hill y={170} height={22} color={`hsl(160, ${12 + p * 10}%, ${7 + p * 4}%)`} seed={0.5} />
      <Hill y={180} height={18} color={`hsl(155, ${15 + p * 12}%, ${8 + p * 5}%)`} seed={2.1} />

      {/* ── Distant tree silhouettes ── */}
      <TreeSilhouette x={20} y={175} height={55} spread={22} color={`hsl(160, 10%, ${6 + p * 3}%)`} opacity={0.35 + p * 0.3} />
      <TreeSilhouette x={65} y={178} height={65} spread={26} color={`hsl(155, 12%, ${5 + p * 3}%)`} opacity={0.3 + p * 0.35} />
      <TreeSilhouette x={110} y={175} height={48} spread={20} color={`hsl(160, 10%, ${7 + p * 3}%)`} opacity={0.35 + p * 0.25} />
      <TreeSilhouette x={290} y={176} height={58} spread={24} color={`hsl(158, 11%, ${6 + p * 3}%)`} opacity={0.3 + p * 0.3} />
      <TreeSilhouette x={340} y={178} height={70} spread={28} color={`hsl(155, 13%, ${5 + p * 3}%)`} opacity={0.35 + p * 0.35} />
      <TreeSilhouette x={385} y={175} height={50} spread={20} color={`hsl(160, 10%, ${7 + p * 3}%)`} opacity={0.3 + p * 0.25} />

      </g>

      <g className="midLayer">
      {/* ── Mid-ground hills (clearing) ── */}
      <Hill y={195} height={14} color={`hsl(140, ${18 + p * 20}%, ${9 + p * 8}%)`} seed={1.2} />

      {/* ── Ground ── */}
      <Hill y={210} height={10} color={`hsl(135, ${22 + p * 22}%, ${10 + p * 9}%)`} seed={0.8} />
      <rect x={0} y={215} width={400} height={35} fill={`hsl(135, ${25 + p * 20}%, ${11 + p * 8}%)`} />

      {/* ── Well structure ── */}
      {/* Well interior (dark void) */}
      <rect x={wellInnerLeft} y={wellTop} width={wellInnerRight - wellInnerLeft} height={wellBottom - wellTop} fill="url(#wellInterior)" />

      {/* Water inside well */}
      {p > 0.02 && (
        <g clipPath="url(#wellClip)">
          {/* Deep water layer */}
          <rect
            x={wellInnerLeft}
            y={waterLevel}
            width={wellInnerRight - wellInnerLeft}
            height={wellBottom - waterLevel + 5}
            fill="url(#waterGrad)"
            filter="url(#wellWater)"
            opacity={0.85}
          />
          {/* Surface highlight */}
          <rect
            x={wellInnerLeft}
            y={waterLevel}
            width={wellInnerRight - wellInnerLeft}
            height={6}
            fill="url(#waterSurface)"
            opacity={0.6 + p * 0.3}
          />
          {/* Subtle surface ripple line */}
          <path
            d={`M${wellInnerLeft} ${waterLevel + 1}
                Q${wellInnerLeft + 16} ${waterLevel - 0.5},
                 ${wellCx} ${waterLevel + 1.5}
                Q${wellInnerRight - 16} ${waterLevel + 0.3},
                 ${wellInnerRight} ${waterLevel + 1}`}
            fill="none"
            stroke="#80e8e8"
            strokeWidth={0.8}
            opacity={0.3 + p * 0.4}
          />

          {/* Spirit fish */}
          {fishP > 0 && (
            <g opacity={fishP * 0.7} filter="url(#fishGlow)">
              <SpiritFish x={wellCx - 15} y={waterLevel + 10} scale={0.9} opacity={fishP * 0.6} />
              <SpiritFish x={wellCx + 12} y={waterLevel + 18} scale={0.7} flip opacity={fishP * 0.5} />
              <SpiritFish x={wellCx - 5} y={waterLevel + 25} scale={0.6} opacity={fishP * 0.4} />
            </g>
          )}
        </g>
      )}

      {/* Well stones — left wall */}
      <g filter="url(#stoneTex)">
        <StoneBlock x={wellOuterLeft} y={wellTop - 2} width={14} height={12} color="#3a3832" seed={1} roughness={2} />
        <StoneBlock x={wellOuterLeft - 1} y={wellTop + 10} width={15} height={13} color="#33312e" seed={2} roughness={2.5} />
        <StoneBlock x={wellOuterLeft} y={wellTop + 23} width={14} height={12} color="#383630" seed={3} roughness={2} />
        <StoneBlock x={wellOuterLeft - 1} y={wellTop + 35} width={15} height={13} color="#353330" seed={4} roughness={2.5} />
        {/* Right wall */}
        <StoneBlock x={wellInnerRight} y={wellTop - 2} width={14} height={12} color="#3a3832" seed={5} roughness={2} />
        <StoneBlock x={wellInnerRight - 1} y={wellTop + 10} width={15} height={13} color="#33312e" seed={6} roughness={2.5} />
        <StoneBlock x={wellInnerRight} y={wellTop + 23} width={14} height={12} color="#383630" seed={7} roughness={2} />
        <StoneBlock x={wellInnerRight - 1} y={wellTop + 35} width={15} height={13} color="#353330" seed={8} roughness={2.5} />
        {/* Front face stones — bottom row */}
        <StoneBlock x={wellOuterLeft + 2} y={wellBottom - 8} width={20} height={10} color="#35332e" seed={9} roughness={2} />
        <StoneBlock x={wellOuterLeft + 22} y={wellBottom - 9} width={22} height={11} color="#383630" seed={10} roughness={2.5} />
        <StoneBlock x={wellCx - 2} y={wellBottom - 8} width={20} height={10} color="#32302c" seed={11} roughness={2} />
        <StoneBlock x={wellCx + 18} y={wellBottom - 9} width={22} height={11} color="#363430" seed={12} roughness={2.5} />
        {/* Front face — second row */}
        <StoneBlock x={wellOuterLeft + 5} y={wellBottom - 19} width={18} height={11} color="#3a3832" seed={13} roughness={2} />
        <StoneBlock x={wellOuterLeft + 23} y={wellBottom - 20} width={20} height={12} color="#353330" seed={14} roughness={2.5} />
        <StoneBlock x={wellCx + 1} y={wellBottom - 19} width={19} height={11} color="#383630" seed={15} roughness={2} />
        <StoneBlock x={wellCx + 20} y={wellBottom - 20} width={18} height={12} color="#33312e" seed={16} roughness={2.5} />
        {/* Front face — top row */}
        <StoneBlock x={wellOuterLeft + 8} y={wellBottom - 30} width={19} height={11} color="#3c3a35" seed={17} roughness={2} />
        <StoneBlock x={wellCx - 5} y={wellBottom - 31} width={21} height={12} color="#383630" seed={18} roughness={2.5} />
        <StoneBlock x={wellCx + 16} y={wellBottom - 30} width={18} height={11} color="#35332e" seed={19} roughness={2} />
        {/* Rim stones */}
        <StoneBlock x={wellOuterLeft - 3} y={wellTop - 6} width={wellOuterRight - wellOuterLeft + 6} height={7} color="#424038" seed={20} roughness={1.5} />
      </g>

      {/* ── Moss patches on well stones (fade as well awakens) ── */}
      {mossOpacity > 0.05 && (
        <g opacity={mossOpacity}>
          <ellipse cx={wellOuterLeft + 5} cy={wellTop + 8} rx={5} ry={3} fill="#2a5a28" opacity={0.6} />
          <ellipse cx={wellInnerRight + 8} cy={wellTop + 20} rx={6} ry={3.5} fill="#1e4a1c" opacity={0.5} />
          <ellipse cx={wellCx + 10} cy={wellBottom - 14} rx={7} ry={3} fill="#2a5a28" opacity={0.45} />
          <ellipse cx={wellOuterLeft + 20} cy={wellBottom - 24} rx={5} ry={2.5} fill="#1e5020" opacity={0.5} />
          <ellipse cx={wellCx - 8} cy={wellBottom - 5} rx={6} ry={2.5} fill="#225522" opacity={0.4} />
        </g>
      )}

      {/* ── Glowing runes on well stones ── */}
      {runeP > 0 && (
        <g filter="url(#runeGlow)" opacity={runeP}>
          {runes.map((r, i) => (
            <g key={i} opacity={sub(p, 0.4 + i * 0.04, 0.15)}>
              <path
                d={RUNE_PATHS[r.path]}
                transform={`translate(${r.x}, ${r.y}) scale(0.8)`}
                fill="none"
                stroke="#50b8b8"
                strokeWidth={1.2}
                strokeLinecap="round"
              />
            </g>
          ))}
        </g>
      )}

      {/* ── Wooden well frame ── */}
      {/* Left post */}
      <g filter="url(#woodTex)">
        <path
          d={`M${wellOuterLeft + 8} ${wellTop - 5}
              L${wellOuterLeft + 6} ${wellTop - 60}
              L${wellOuterLeft + 12} ${wellTop - 61}
              L${wellOuterLeft + 14} ${wellTop - 5} Z`}
          fill="#4a3828"
        />
        {/* Right post */}
        <path
          d={`M${wellOuterRight - 8} ${wellTop - 5}
              L${wellOuterRight - 6} ${wellTop - 60}
              L${wellOuterRight - 12} ${wellTop - 61}
              L${wellOuterRight - 14} ${wellTop - 5} Z`}
          fill="#4a3828"
        />
        {/* Crossbar */}
        <path
          d={`M${wellOuterLeft + 4} ${wellTop - 58}
              L${wellOuterLeft + 4} ${wellTop - 63}
              L${wellOuterRight - 4} ${wellTop - 63}
              L${wellOuterRight - 4} ${wellTop - 58} Z`}
          fill="#523e2a"
        />
        {/* Small roof */}
        <path
          d={`M${wellOuterLeft - 2} ${wellTop - 63}
              L${wellCx} ${wellTop - 78}
              L${wellOuterRight + 2} ${wellTop - 63} Z`}
          fill="#3a2818"
        />
        {/* Roof underside shadow */}
        <path
          d={`M${wellOuterLeft + 2} ${wellTop - 63}
              L${wellCx} ${wellTop - 74}
              L${wellOuterRight - 2} ${wellTop - 63} Z`}
          fill="#2a1c10"
          opacity={0.4}
        />
        {/* Roof ridge detail */}
        <path
          d={`M${wellCx - 20} ${wellTop - 72}
              L${wellCx} ${wellTop - 78}
              L${wellCx + 20} ${wellTop - 72}`}
          fill="none"
          stroke="#2a1c10"
          strokeWidth={0.8}
          opacity={0.5}
        />
      </g>

      {/* ── Rope and bucket ── */}
      {/* Rope from crossbar */}
      <path
        d={`M${wellCx} ${wellTop - 60}
            Q${wellCx + 2} ${(wellTop - 60 + bucketY) * 0.5},
             ${wellCx} ${bucketY - 5}`}
        fill="none"
        stroke="#8a7a5a"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      {/* Rope texture dashes */}
      <path
        d={`M${wellCx} ${wellTop - 60}
            Q${wellCx + 2} ${(wellTop - 60 + bucketY) * 0.5},
             ${wellCx} ${bucketY - 5}`}
        fill="none"
        stroke="#6a5a3a"
        strokeWidth={0.5}
        strokeDasharray="2 3"
        strokeLinecap="round"
      />
      {/* Bucket */}
      <g>
        {/* Bucket body */}
        <path
          d={`M${wellCx - 7} ${bucketY - 5}
              L${wellCx - 9} ${bucketY + 8}
              Q${wellCx} ${bucketY + 10},
               ${wellCx + 9} ${bucketY + 8}
              L${wellCx + 7} ${bucketY - 5} Z`}
          fill="#5a4830"
          stroke="#3a2818"
          strokeWidth={0.6}
        />
        {/* Bucket bands */}
        <line x1={wellCx - 8} y1={bucketY} x2={wellCx + 8} y2={bucketY} stroke="#6a5a40" strokeWidth={0.8} />
        <line x1={wellCx - 8.5} y1={bucketY + 5} x2={wellCx + 8.5} y2={bucketY + 5} stroke="#6a5a40" strokeWidth={0.8} />
        {/* Bucket handle */}
        <path
          d={`M${wellCx - 5} ${bucketY - 5}
              Q${wellCx} ${bucketY - 10},
               ${wellCx + 5} ${bucketY - 5}`}
          fill="none"
          stroke="#6a5a40"
          strokeWidth={1}
        />
      </g>

      {/* ── Ground vegetation around well base ── */}
      <GrassRow
        y={210}
        color={`hsl(130, ${30 + p * 20}%, ${16 + p * 10}%)`}
        count={35}
        maxHeight={14}
        progress={0.4 + p * 0.6}
      />

      {/* Small ferns around well base */}
      {[
        { x: 140, y: 208, s: 1 },
        { x: 155, y: 212, s: 0.8 },
        { x: 245, y: 210, s: 0.9 },
        { x: 260, y: 213, s: 0.75 },
      ].map((f, i) => (
        <g key={i} opacity={0.5 + p * 0.4}>
          <path
            d={`M${f.x} ${f.y}
                Q${f.x - 6 * f.s} ${f.y - 10 * f.s},
                 ${f.x - 12 * f.s} ${f.y - 6 * f.s}`}
            fill="none"
            stroke={`hsl(125, ${35 + p * 15}%, ${20 + p * 10}%)`}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <path
            d={`M${f.x} ${f.y}
                Q${f.x + 5 * f.s} ${f.y - 11 * f.s},
                 ${f.x + 11 * f.s} ${f.y - 8 * f.s}`}
            fill="none"
            stroke={`hsl(130, ${32 + p * 15}%, ${18 + p * 10}%)`}
            strokeWidth={1.3}
            strokeLinecap="round"
          />
          {/* Small frond leaves */}
          {[-1, 1].map((dir) => (
            <path
              key={dir}
              d={`M${f.x + dir * 4 * f.s} ${f.y - 5 * f.s}
                  Q${f.x + dir * 8 * f.s} ${f.y - 9 * f.s},
                   ${f.x + dir * 6 * f.s} ${f.y - 4 * f.s}`}
              fill={`hsl(128, ${30 + p * 15}%, ${22 + p * 8}%)`}
              opacity={0.6}
            />
          ))}
        </g>
      ))}

      {/* ── Second grass layer ── */}
      <GrassRow
        y={218}
        color={`hsl(125, ${28 + p * 18}%, ${14 + p * 10}%)`}
        count={20}
        maxHeight={10}
        progress={0.3 + p * 0.7}
      />

      {/* ── Clearing mist ── */}
      <rect
        x={0}
        y={170}
        width={400}
        height={80}
        fill="white"
        opacity={(1 - p * 0.7) * 0.06}
        filter="url(#clearingMist)"
      />

      {/* ── Subtle mist around well base ── */}
      <ellipse
        cx={wellCx}
        cy={210}
        rx={60}
        ry={12}
        fill="#90b8b8"
        opacity={(1 - p * 0.5) * 0.08}
        filter="url(#clearingMist)"
      />

      </g>

      <g className="fgLayer">
      {/* ── Firefly wisps ── */}
      {wisps.map((w, i) => {
        const wp = sub(p, w.delay, 0.08);
        return wp > 0 ? (
          <Wisp
            key={i}
            x={w.x}
            y={w.y}
            color="#50b8b8"
            radius={2}
            opacity={wp * 0.55}
          />
        ) : null;
      })}

      {/* ── Foreground grass ── */}
      <GrassRow
        y={240}
        color={`hsl(130, ${26 + p * 20}%, ${12 + p * 8}%)`}
        count={12}
        maxHeight={18}
        progress={0.3 + p * 0.7}
      />
      </g>

      {/* Atmospheric particles — water droplets and mist */}
      {Array.from({ length: 40 }).map((_, i) => {
        const px = (i * 47 + 13) % 400;
        const baseY = (i * 71 + 29) % 220 + 15;
        const drift = Math.sin(p * Math.PI * 2 + i * 0.7) * 8;
        const py = baseY - p * 30 * ((i % 5) / 5);
        const size = 0.5 + (i % 4) * 0.3;
        const opacity = (0.08 + (i % 3) * 0.06) * (0.3 + p * 0.7);
        return (
          <circle key={`p${i}`} cx={px + drift} cy={py} r={size}
            fill="#60c8c8" opacity={opacity} />
        );
      })}
    </svg>
  );
}

export default memo(WellScene);
