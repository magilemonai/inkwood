import type { Level } from "./types";

export const LEVELS: Level[] = [
  // ── Act I: Awakening ──
  {
    title: "The Sleeping Garden",
    flavor:
      "Frost clings to every petal. Breathe life back into the garden.",
    prompts: ["green returns to sleeping roots", "bloom now, every waiting flower"],
    scene: "garden",
    accent: "#6bbf6b",
    bg: "#080e08",
    winText: "Color returns. Something stirs beneath the roots.",
  },
  {
    title: "The Dark Cottage",
    flavor:
      "The hearth is cold and every candle dark. Call the warmth home.",
    prompts: ["little candle burn bright", "amber glow fills every room"],
    scene: "cottage",
    accent: "#e89a30",
    bg: "#0d0905",
    winText: "Warmth fills the rooms. A journal falls open — symbols you almost recognize.",
  },
  {
    title: "The Night Sky",
    flavor:
      "The stars have gone to sleep. Speak their names to wake them.",
    prompts: ["Orion Vega Sirius Lyra", "the sky blooms with ancient fire"],
    scene: "stars",
    accent: "#9090f8",
    bg: "#03030e",
    winText: "The constellations burn. Their patterns are deliberate. A map to something below.",
  },
  // ── Act II: Discovery ──
  {
    title: "The Dry Well",
    flavor: "The stones still remember the sound of water.",
    prompts: [
      "deep water remember your name",
      "rise and carry the old songs home",
    ],
    scene: "well",
    accent: "#50b8b8",
    bg: "#040a0a",
    winText: "Runes surface on the stones, pulsing like a heartbeat.",
  },
  {
    title: "The Forgotten Bridge",
    flavor: "The path it joined once linked two sacred places.",
    prompts: [
      "moss and stone recall the crossing",
      "where old paths meet spirits still walk",
    ],
    scene: "bridge",
    accent: "#7aaa6a",
    bg: "#060a06",
    winText: "Spirit-lanterns flicker. Footprints in the moss — not yours.",
  },
  {
    title: "The Whispering Library",
    flavor: "Every page holds a sleeping voice.",
    prompts: [
      "open the pages let wisdom rise",
      "every old word finds its voice again",
    ],
    scene: "library",
    accent: "#c088b0",
    bg: "#0a0608",
    winText: "The books whisper in chorus. One tome glows brighter than the rest.",
  },
  // ── Act III: The Nexus ──
  {
    title: "The Spirit Stones",
    flavor: "They once guided great powers along hidden paths.",
    prompts: [
      "stand tall again guardians of old",
      "the circle remembers what was promised",
    ],
    scene: "stones",
    accent: "#88a8c8",
    bg: "#050608",
    winText: "Light races between the stones. Not monuments — conduits.",
  },
  {
    title: "The Moonlit Sanctum",
    flavor: "Moonlight pools like water where the spirits once gathered.",
    prompts: [
      "moonlight gathers where spirits convene",
      "the ancient ones return to their seats",
    ],
    scene: "sanctum",
    accent: "#d0b870",
    bg: "#08080a",
    winText: "A figure turns toward you and inclines its head. You are recognized.",
  },
  {
    title: "The Great Tree",
    flavor: "Its roots are the ley lines. Its branches hold the sky.",
    prompts: [
      "roots deeper than memory",
      "branches wider than sky",
      "nexus of all living things awaken",
    ],
    scene: "tree",
    accent: "#b8c8a8",
    bg: "#060806",
    winText: "The nexus breathes.",
  },
  // ── Act IV: Restoration ──
  {
    title: "The Waking World",
    flavor: "Speak the final words.",
    prompts: [
      "the garden blooms the hearth burns bright",
      "every star remembers every spirit sings",
      "the ancient order is restored",
    ],
    scene: "world",
    accent: "#d8c890",
    bg: "#060808",
    winText: "All one.",
  },
];

export const ACT_LABELS = ["Awakening", "Discovery", "The Nexus", "Restoration"];
export const ACT_RANGES: [number, number][] = [[0, 2], [3, 5], [6, 8], [9, 9]];

export function getActIndex(lvl: number): number {
  return ACT_RANGES.findIndex(([a, b]) => lvl >= a && lvl <= b);
}

export function getActLabel(lvl: number): string {
  const idx = getActIndex(lvl);
  return `ACT ${idx + 1}`;
}
