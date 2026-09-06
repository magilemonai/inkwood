import { lazy, Suspense } from "react";
import { isGlowEnabled } from "../glow";
import type { SceneManifest } from "../scenes/manifest";

const GlowCanvas = lazy(() => import("./GlowCanvas"));

/**
 * The Glow for surfaces that aren't a level scene (the intro, the outro).
 *
 * Same lazy three.js canvas as GlowLayer, but the manifest comes from the
 * caller and progress comes from `progressOf` instead of the game store,
 * so a time-driven surface can map its own clock onto the manifest's
 * 0–1 (e.g. which intro vignette is showing, or how far the outro
 * panorama has assembled). Mount it inside a `position: relative`
 * container that holds the surface's SVG; the canvas fills the container
 * and maps viewBox 400×250 onto it with the same slice math as the scenes.
 */
export default function GlowSurface({
  manifest,
  progressOf,
}: {
  manifest: SceneManifest;
  progressOf: () => number;
}) {
  if (!isGlowEnabled()) return null;
  return (
    <Suspense fallback={null}>
      <GlowCanvas manifest={manifest} progressOf={progressOf} />
    </Suspense>
  );
}
