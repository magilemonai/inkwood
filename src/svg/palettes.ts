/**
 * Color palettes per scene. Each palette defines layered colors
 * that shift from "dormant" (progress=0) to "alive" (progress=1).
 */

export interface ScenePalette {
  skyDormant: string;
  skyAlive: string;
  groundDormant: string;
  groundAlive: string;
  midtoneDormant: string;
  midtoneAlive: string;
  accent: string;
  glow: string;
}

export const palettes: Record<string, ScenePalette> = {
  garden: {
    skyDormant: "hsl(110, 20%, 7%)",
    skyAlive: "hsl(125, 48%, 27%)",
    groundDormant: "hsl(120, 28%, 11%)",
    groundAlive: "hsl(120, 48%, 20%)",
    midtoneDormant: "hsl(120, 15%, 9%)",
    midtoneAlive: "hsl(120, 35%, 18%)",
    accent: "#6bbf6b",
    glow: "#f5e060",
  },
  cottage: {
    skyDormant: "hsl(30, 13%, 4%)",
    skyAlive: "hsl(30, 18%, 13%)",
    groundDormant: "hsl(25, 28%, 7%)",
    groundAlive: "hsl(25, 28%, 15%)",
    midtoneDormant: "hsl(30, 18%, 5%)",
    midtoneAlive: "hsl(30, 28%, 14%)",
    accent: "#e89a30",
    glow: "#f5c040",
  },
  stars: {
    skyDormant: "hsl(232, 38%, 3%)",
    skyAlive: "hsl(232, 38%, 9%)",
    groundDormant: "hsl(232, 20%, 3%)",
    groundAlive: "hsl(232, 20%, 5%)",
    midtoneDormant: "hsl(240, 28%, 5%)",
    midtoneAlive: "hsl(240, 28%, 10%)",
    accent: "#9090f8",
    glow: "#c8d4f0",
  },
};

/** Linearly interpolate between two HSL color strings */
export function lerpColor(from: string, to: string, t: number): string {
  // For simplicity, we use CSS color-mix
  const clamped = Math.max(0, Math.min(1, t));
  return `color-mix(in srgb, ${from} ${Math.round((1 - clamped) * 100)}%, ${to})`;
}
