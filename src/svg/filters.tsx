/**
 * Reusable SVG filter definitions.
 * Include inside your <svg><defs>...</defs></svg> to use them.
 * Reference via filter="url(#filterName)" on any SVG element.
 */

/** Soft glow — use on light sources, runes, spirit elements.
 *
 *  The filter region is deliberately oversized (5× the object bounding box,
 *  centered) so large stdDeviation blurs don't clip at the filter edge —
 *  clipped halos rendered as visible rectangular boxes behind flames, the
 *  moon disc, and small runes in earlier builds. Safe default for blur
 *  radii up to ~1.5× the element's short side. */
export function GlowFilter({
  id = "glow",
  radius = 6,
  color,
  opacity = 0.6,
}: {
  id?: string;
  radius?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <filter id={id} x="-200%" y="-200%" width="500%" height="500%">
      <feGaussianBlur in="SourceGraphic" stdDeviation={radius} result="blur" />
      {color && (
        <feFlood floodColor={color} floodOpacity={opacity} result="color" />
      )}
      {color && (
        <feComposite in="color" in2="blur" operator="in" result="colorBlur" />
      )}
      <feMerge>
        <feMergeNode in={color ? "colorBlur" : "blur"} />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

/** Atmospheric mist/fog — procedural turbulence cloud. Used by Stars horizon. */
export function MistFilter({
  id = "mist",
  scale = 0.015,
  opacity = 0.3,
}: {
  id?: string;
  scale?: number;
  opacity?: number;
}) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency={scale}
        numOctaves={4}
        seed={42}
        result="noise"
      />
      <feColorMatrix
        in="noise"
        type="saturate"
        values="0"
        result="grayNoise"
      />
      <feComponentTransfer in="grayNoise" result="fadedNoise">
        <feFuncA type="linear" slope={opacity} intercept={0} />
      </feComponentTransfer>
      <feComposite in="fadedNoise" in2="SourceGraphic" operator="in" />
    </filter>
  );
}
