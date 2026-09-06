import { lazy, Suspense } from "react";
import type { SceneKey } from "../types";
import { isGlowEnabled } from "../glow";
import { SCENE_MANIFESTS } from "../scenes/manifest";

// The three.js canvas is its own chunk. It is only requested when the
// gate is on AND the current scene declares a manifest, so players on
// the classic game never download it.
const GlowCanvas = lazy(() => import("./GlowCanvas"));

/**
 * Mounts the Glow canvas over the scene when the gate is on and the
 * scene has a light manifest. Renders nothing otherwise.
 */
export default function GlowLayer({ scene }: { scene: SceneKey }) {
  if (!isGlowEnabled()) return null;
  const manifest = SCENE_MANIFESTS[scene];
  if (!manifest) return null;
  return (
    <Suspense fallback={null}>
      <GlowCanvas key={scene} manifest={manifest} />
    </Suspense>
  );
}
