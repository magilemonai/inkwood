import { useMemo } from "react";
import { useGameStore } from "../store";
import { LEVELS } from "../levels";
import { useParticles } from "../hooks/useParticles";
import ParticleField from "./ParticleField";
import { activeSeason, SEASON_PARTICLES, SEASON_BOUNDS } from "../seasons";

/**
 * Seasonal weather overlay — an SVG sharing the scene's viewBox and
 * slice behavior so particle coordinates align exactly with the world
 * beneath. Sits on top of the scene, under the typing UI, and never
 * intercepts input. Interior scenes render nothing.
 */
export default function SeasonalLayer() {
  const lvl = useGameStore((g) => g.lvl);
  const scene = LEVELS[lvl].scene;

  const season = activeSeason();
  const bounds = SEASON_BOUNDS[scene];
  const active = season !== null && bounds !== null;

  const config = useMemo(() => {
    const spec = SEASON_PARTICLES[season ?? "winter"];
    return {
      count: spec.count,
      bounds: bounds ?? { x: 0, y: 0, width: 400, height: 145 },
      colors: spec.colors,
      sizeRange: spec.sizeRange,
      speedRange: spec.speedRange,
      driftX: spec.driftX,
      driftY: spec.driftY,
      lifeRange: spec.lifeRange,
    };
  }, [season, bounds]);

  const particles = useParticles(config, active);

  if (!active) return null;
  const opacity = SEASON_PARTICLES[season].opacity;

  return (
    <svg
      viewBox="0 0 400 250"
      preserveAspectRatio="xMidYMid slice"
      overflow="hidden"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <ParticleField particles={particles} opacity={opacity} />
    </svg>
  );
}
