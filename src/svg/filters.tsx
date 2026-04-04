/**
 * Reusable SVG filter definitions.
 * Include <SceneFilters /> inside your <svg><defs>...</defs></svg> to use them.
 * Reference via filter="url(#filterName)" on any SVG element.
 */

/** Soft glow — use on light sources, runes, spirit elements */
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
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
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

/** Atmospheric mist/fog — procedural turbulence cloud */
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

/** Stone/wood texture — high-frequency noise overlay */
export function TextureFilter({
  id = "texture",
  scale = 0.08,
  intensity = 0.15,
  seed = 1,
}: {
  id?: string;
  scale?: number;
  intensity?: number;
  seed?: number;
}) {
  return (
    <filter id={id} x="0%" y="0%" width="100%" height="100%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency={scale}
        numOctaves={3}
        seed={seed}
        result="noise"
      />
      <feColorMatrix
        in="noise"
        type="saturate"
        values="0"
        result="gray"
      />
      <feComponentTransfer in="gray" result="fadedNoise">
        <feFuncA type="linear" slope={intensity} intercept={0} />
      </feComponentTransfer>
      <feBlend in="SourceGraphic" in2="fadedNoise" mode="overlay" />
    </filter>
  );
}

/** Water ripple — displacement via turbulence */
export function WaterFilter({
  id = "water",
  scale = 0.02,
  strength = 8,
  seed = 7,
}: {
  id?: string;
  scale?: number;
  strength?: number;
  seed?: number;
}) {
  return (
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence
        type="turbulence"
        baseFrequency={`${scale} ${scale * 3}`}
        numOctaves={2}
        seed={seed}
        result="ripple"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="ripple"
        scale={strength}
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  );
}

/** Soft light wash — diffuse lighting effect */
export function SoftLightFilter({
  id = "softLight",
  color = "#fff8e0",
  elevation = 30,
  intensity = 0.8,
}: {
  id?: string;
  color?: string;
  elevation?: number;
  intensity?: number;
}) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feDiffuseLighting
        in="SourceGraphic"
        lightingColor={color}
        surfaceScale={2}
        diffuseConstant={intensity}
        result="light"
      >
        <feDistantLight azimuth={225} elevation={elevation} />
      </feDiffuseLighting>
      <feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1={0} k2={1} k3={0.3} k4={0} />
    </filter>
  );
}

/** Inner shadow — gives depth to shapes */
export function InnerShadowFilter({
  id = "innerShadow",
  dx = 0,
  dy = 2,
  blur = 4,
  color = "#000000",
  opacity = 0.4,
}: {
  id?: string;
  dx?: number;
  dy?: number;
  blur?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      {/* Invert the alpha to get inside */}
      <feComponentTransfer in="SourceAlpha">
        <feFuncA type="table" tableValues="1 0" />
      </feComponentTransfer>
      <feOffset dx={dx} dy={dy} result="offsetInverse" />
      <feGaussianBlur in="offsetInverse" stdDeviation={blur} result="blurred" />
      <feFlood floodColor={color} floodOpacity={opacity} result="shadowColor" />
      <feComposite in="shadowColor" in2="blurred" operator="in" result="shadow" />
      <feComposite in="shadow" in2="SourceAlpha" operator="in" result="clipped" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="clipped" />
      </feMerge>
    </filter>
  );
}
