/// <reference types="vite/client" />
import type { ComponentType } from "react";
import type { SceneKey, SceneProps } from "../../types";

/**
 * Inkwood 2 scene overrides, auto-registered by filename.
 *
 * Drop `src/scenes/v2/<sceneKey>.tsx` (default-exporting a memo'd
 * `({ progress }) => <svg>`) and SceneRenderer picks it up under the
 * ?v2 gate. No shared registry file to edit, so parallel scene work
 * never conflicts. Scenes without an override fall through to v1.
 */
const modules = import.meta.glob<{ default: ComponentType<SceneProps> }>("./*.tsx", { eager: true });

export const V2_SCENES: Partial<Record<SceneKey, ComponentType<SceneProps>>> = {};
for (const [path, mod] of Object.entries(modules)) {
  const key = path.replace(/^\.\//, "").replace(/\.tsx$/, "") as SceneKey;
  V2_SCENES[key] = mod.default;
}
