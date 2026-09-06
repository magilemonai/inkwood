import { lazy, Suspense } from "react";
import type { SceneKey } from "../types";
import { isGlowEnabled } from "../glow";
import { isV2Enabled } from "../v2";
import { SCENE_MANIFESTS } from "../scenes/manifest";
import { V2_SCENES } from "../scenes/v2";

// The three.js canvas is its own chunk. It is only requested when the
// gate is on AND the current scene declares a manifest, so players on
// the classic game never download it.
const GlowCanvas = lazy(() => import("./GlowCanvas"));

/**
 * Mounts the Glow canvas over the scene when the gate is on and the
 * scene has a light manifest. Renders nothing otherwise.
 *
 * Manifests are authored against the Inkwood 2 art. When a scene has
 * been redrawn for v2 but the v2 gate is off (plain ?glow on the v1
 * scene), the coordinates wouldn't match, so the layer stays off there.
 */
export default function GlowLayer({ scene }: { scene: SceneKey }) {
  if (!isGlowEnabled()) return null;
  const manifest = SCENE_MANIFESTS[scene];
  if (!manifest) return null;
  if (!isV2Enabled() && V2_SCENES[scene]) return null;
  return (
    <Suspense fallback={null}>
      <GlowCanvas key={scene} manifest={manifest} />
    </Suspense>
  );
}
