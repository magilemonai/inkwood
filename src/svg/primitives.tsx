/**
 * Reusable SVG shape primitives.
 *
 * Only `Star` is currently in use (by StarScene). The other shapes
 * (Hill, TreeSilhouette, Cloud, Flower, Rain, GrassRow, Wisp,
 * StoneBlock) were removed during the v13 dead-code cleanup — each
 * scene now hand-crafts its own organic bezier art per SCENE_ART_GUIDE.
 */

/** Star with glow halo */
export function Star({
  x,
  y,
  radius = 2,
  opacity = 1,
  color = "white",
  glowRadius = 8,
}: {
  x: number;
  y: number;
  radius?: number;
  opacity?: number;
  color?: string;
  glowRadius?: number;
}) {
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={glowRadius} fill={color} opacity={0.06} />
      <circle cx={x} cy={y} r={radius * 1.8} fill={color} opacity={0.15} />
      <circle cx={x} cy={y} r={radius} fill={color} />
    </g>
  );
}
