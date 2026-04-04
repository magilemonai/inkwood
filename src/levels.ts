import type { Level } from "./types";

export const LEVELS: Level[] = [
  // ── Act I: Awakening ──
  {
    title: "The Sleeping Garden",
    flavor:
      "Frost clings to every petal. Breathe life back into the garden.",
    prompts: ["warm summer rain", "roots reach deep, leaves touch light"],
    scene: "garden",
    accent: "#6bbf6b",
    bg: "#080e08",
    winText:
      "Color returns to the earth. You feel something stir beneath the roots — older than the garden, deeper than the soil.",
  },
  {
    title: "The Dark Cottage",
    flavor:
      "The hearth is cold and every candle dark. Call the warmth home.",
    prompts: ["little candle burn bright", "amber glow fills every room"],
    scene: "cottage",
    accent: "#e89a30",
    bg: "#0d0905",
    winText:
      "Warmth fills the forgotten rooms. On the shelf, a leather journal falls open — its pages covered in symbols you almost recognize.",
  },
  {
    title: "The Night Sky",
    flavor:
      "The stars have gone to sleep. Speak their names to wake them.",
    prompts: ["Orion Vega Sirius Lyra", "the sky blooms with ancient fire"],
    scene: "stars",
    accent: "#9090f8",
    bg: "#03030e",
    winText:
      "The constellations burn again. Their patterns trace lines across the dark — not random, but deliberate. A map, perhaps, to something below.",
  },
  // ── Act II: Discovery ──
  {
    title: "The Dry Well",
    flavor:
      "An ancient spring, long silent. The stones still remember the sound of water.",
    prompts: [
      "deep water remember your name",
      "rise and carry the old songs home",
    ],
    scene: "well",
    accent: "#50b8b8",
    bg: "#040a0a",
    winText:
      "Water fills the well and glowing runes surface on the stones. They pulse gently, like a heartbeat. This well was no ordinary spring.",
  },
  {
    title: "The Forgotten Bridge",
    flavor:
      "A crossing lost to mist and moss. The path it joined once linked two sacred places.",
    prompts: [
      "moss and stone recall the crossing",
      "where old paths meet spirits still walk",
    ],
    scene: "bridge",
    accent: "#7aaa6a",
    bg: "#060a06",
    winText:
      "The bridge stands whole again. Spirit-lanterns flicker along its rails, and for a moment you see footprints in the moss — not yours.",
  },
  {
    title: "The Whispering Library",
    flavor:
      "Below the earth, a chamber of crystallized knowledge. Every page holds a sleeping voice.",
    prompts: [
      "open the pages let wisdom rise",
      "every old word finds its voice again",
    ],
    scene: "library",
    accent: "#c088b0",
    bg: "#0a0608",
    winText:
      "The books drift upward, whispering in chorus. Among them, a single tome glows brighter — the Chronicle of the Nexus, its title reads.",
  },
  // ── Act III: The Nexus ──
  {
    title: "The Spirit Stones",
    flavor:
      "A ring of ancient markers, cold and dark. They once guided great powers along hidden paths.",
    prompts: [
      "stand tall again guardians of old",
      "the circle remembers what was promised",
    ],
    scene: "stones",
    accent: "#88a8c8",
    bg: "#050608",
    winText:
      "Light races between the stones in lines of pale fire. The ley lines are waking. You understand now — these are not monuments. They are conduits.",
  },
  {
    title: "The Moonlit Sanctum",
    flavor:
      "A clearing where moonlight pools like water. The spirits once gathered here in council.",
    prompts: [
      "moonlight gathers where spirits convene",
      "the ancient ones return to their seats",
    ],
    scene: "sanctum",
    accent: "#d0b870",
    bg: "#08080a",
    winText:
      "Translucent figures stand in the moonlight, tall and gentle. One turns toward you and inclines its head. You are recognized.",
  },
  {
    title: "The Great Tree",
    flavor:
      "The nexus of all living things. Its roots are the ley lines, its branches hold the sky.",
    prompts: [
      "roots deeper than memory",
      "branches wider than sky",
      "nexus of all living things awaken",
    ],
    scene: "tree",
    accent: "#b8c8a8",
    bg: "#060806",
    winText:
      "The Great Tree blazes with gentle light. Energy flows through its roots to every corner of the land. The nexus breathes again.",
  },
  // ── Act IV: Restoration ──
  {
    title: "The Waking World",
    flavor:
      "All things connected, all things alive. Speak the final words and restore the ancient order.",
    prompts: [
      "the garden blooms the hearth burns bright",
      "every star remembers every spirit sings",
      "the ancient order is restored",
    ],
    scene: "world",
    accent: "#d8c890",
    bg: "#060808",
    winText:
      "Light flows between every place you have touched. Garden, cottage, sky, well, bridge, library, stones, sanctum, tree — all one. The ancient order holds.",
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
