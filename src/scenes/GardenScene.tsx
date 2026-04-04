import { memo } from "react";
import type { SceneProps } from "../types";
import { GlowFilter, MistFilter, TextureFilter } from "../svg/filters";
import { Hill, Cloud, Flower, Rain, GrassRow, TreeSilhouette } from "../svg/primitives";

/** Helper: clamp progress into a sub-range for staggered entry */
function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}

function GardenScene({ progress: p }: SceneProps) {
  // ── Sky transitions ──
  const skyH = 110 + p * 18;
  const skyS = 15 + p * 33;
  const skyL = 5 + p * 22;

  // ── Sun ──
  const sunY = 95 - p * 65;
  const sunGlow = p;

  // ── Rain fades in mid-progress, fades out ──
  const rainIntensity =
    p < 0.15 ? 0 : p < 0.35 ? (p - 0.15) / 0.2 : p < 0.6 ? 1 : Math.max(0, (0.75 - p) / 0.15);

  // ── Flowers stagger ──
  const flowers = [
    { x: 55,  stemH: 38, color: "#e87090", size: 9,  delay: 0.15 },
    { x: 105, stemH: 44, color: "#f0c050", size: 10, delay: 0.25 },
    { x: 155, stemH: 35, color: "#a070e0", size: 8,  delay: 0.35 },
    { x: 210, stemH: 42, color: "#e8a0c0", size: 9,  delay: 0.42 },
    { x: 260, stemH: 48, color: "#60c888", size: 11, delay: 0.52 },
    { x: 310, stemH: 36, color: "#f08050", size: 8,  delay: 0.6 },
    { x: 355, stemH: 40, color: "#70a0e8", size: 9,  delay: 0.7 },
  ];

  // ── Background trees silhouette — appear in mid-distance ──
  const treeSilhouettes = [
    { x: 25,  h: 68, s: 22 },
    { x: 72,  h: 80, s: 28 },
    { x: 130, h: 55, s: 20 },
    { x: 280, h: 62, s: 24 },
    { x: 340, h: 75, s: 26 },
    { x: 388, h: 58, s: 20 },
  ];

  // ── Fireflies / pollen motes — appear late ──
  const motes = [
    { x: 80,  y: 110, delay: 0.65 },
    { x: 190, y: 90,  delay: 0.72 },
    { x: 290, y: 105, delay: 0.78 },
    { x: 140, y: 130, delay: 0.82 },
    { x: 350, y: 95,  delay: 0.88 },
    { x: 60,  y: 145, delay: 0.92 },
  ];

  return (
    <svg viewBox="0 0 400 250" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        {/* Filters */}
        <GlowFilter id="sunGlow" radius={20} color="#f5e060" opacity={0.4} />
        <GlowFilter id="flowerGlow" radius={3} color="#f5e060" opacity={0.2} />
        <MistFilter id="groundMist" scale={0.012} opacity={0.25} />
        <TextureFilter id="groundTex" scale={0.06} intensity={0.1} seed={3} />

        {/* Sun radial gradient */}
        <radialGradient id="sunRadial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5e060" stopOpacity={sunGlow * 0.5} />
          <stop offset="40%" stopColor="#f5d030" stopOpacity={sunGlow * 0.2} />
          <stop offset="100%" stopColor="#f5e060" stopOpacity={0} />
        </radialGradient>

        {/* Sky gradient — vertical */}
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${skyH + 10}, ${skyS - 5}%, ${skyL + 8}%)`} />
          <stop offset="100%" stopColor={`hsl(${skyH}, ${skyS}%, ${skyL}%)`} />
        </linearGradient>
      </defs>

      {/* ── Sky ── */}
      <rect width="400" height="250" fill="url(#skyGrad)" />

      {/* ── Distant hills (background layer) ── */}
      <Hill y={185} height={25} color={`hsl(130, ${15 + p * 12}%, ${8 + p * 5}%)`} seed={0.3} />
      <Hill y={195} height={20} color={`hsl(125, ${18 + p * 15}%, ${9 + p * 6}%)`} seed={1.8} />

      {/* ── Background tree silhouettes ── */}
      {treeSilhouettes.map((t, i) => (
        <TreeSilhouette
          key={i}
          x={t.x}
          y={195}
          height={t.h * (0.3 + p * 0.7)}
          spread={t.s}
          color={`hsl(120, ${12 + p * 8}%, ${6 + p * 3}%)`}
          opacity={0.3 + p * 0.5}
        />
      ))}

      {/* ── Clouds — appear after 30% ── */}
      {p > 0.3 && (
        <>
          <Cloud x={75}  y={45} scale={1.1} opacity={sub(p, 0.3, 0.25) * 0.4} />
          <Cloud x={220} y={35} scale={0.8} opacity={sub(p, 0.38, 0.25) * 0.35} />
          <Cloud x={330} y={50} scale={0.9} opacity={sub(p, 0.45, 0.25) * 0.3} />
        </>
      )}

      {/* ── Sun ── */}
      <circle cx="340" cy={sunY} r={60} fill="url(#sunRadial)" />
      <circle
        cx="340"
        cy={sunY}
        r={18}
        fill="#f5d860"
        opacity={p * 0.9}
        filter={p > 0.3 ? "url(#sunGlow)" : undefined}
      />

      {/* ── Rain ── */}
      {rainIntensity > 0.05 && (
        <Rain intensity={rainIntensity} opacity={rainIntensity * 0.55} />
      )}

      {/* ── Ground (foreground) ── */}
      <Hill y={210} height={15} color={`hsl(120, ${22 + p * 25}%, ${9 + p * 10}%)`} seed={0.7} />
      <rect
        x={0} y={218} width={400} height={32}
        fill={`hsl(120, ${25 + p * 22}%, ${10 + p * 9}%)`}
        filter="url(#groundTex)"
      />

      {/* ── Ground mist — fades with progress (dormant garden has mist) ── */}
      <rect
        x={0} y={180} width={400} height={70}
        fill="white"
        opacity={(1 - p) * 0.08}
        filter="url(#groundMist)"
      />

      {/* ── Grass rows ── */}
      <GrassRow
        y={215}
        color={`hsl(120, ${35 + p * 20}%, ${18 + p * 14}%)`}
        count={40}
        maxHeight={16}
        progress={p}
      />
      <GrassRow
        y={222}
        color={`hsl(115, ${30 + p * 18}%, ${15 + p * 12}%)`}
        count={25}
        maxHeight={10}
        progress={p * 0.8}
      />

      {/* ── Flowers ── */}
      {flowers.map((f, i) => (
        <Flower
          key={i}
          x={f.x}
          y={218}
          stemHeight={f.stemH}
          petalColor={f.color}
          petalSize={f.size}
          progress={sub(p, f.delay, 0.25)}
        />
      ))}

      {/* ── Pollen motes / fireflies — appear late ── */}
      {motes.map((m, i) => {
        const mp = sub(p, m.delay, 0.1);
        return mp > 0 ? (
          <g key={i} opacity={mp * 0.6}>
            <circle cx={m.x} cy={m.y} r={6} fill="#f5e060" opacity={0.06} />
            <circle cx={m.x} cy={m.y} r={2} fill="#f5e890" opacity={0.4} />
            <circle cx={m.x} cy={m.y} r={0.8} fill="white" opacity={0.5} />
          </g>
        ) : null;
      })}

      {/* ── Foreground grass blades (closest layer, slight overlay) ── */}
      <GrassRow
        y={240}
        color={`hsl(118, ${28 + p * 22}%, ${13 + p * 10}%)`}
        count={15}
        maxHeight={20}
        progress={p}
      />
    </svg>
  );
}

export default memo(GardenScene);
