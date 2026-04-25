import type { Level } from "./types";

/**
 * Each level declares both a canonical `prompts` array (the 5/5-rated
 * phrases used in screenshots, critique, and the default run) and an
 * optional `promptPool` — a list of alternative phrasings per slot that
 * preserve the same visual intent. On every fresh playthrough the store
 * samples one phrase per slot for replay variety. `?canonical` in the URL
 * forces the canonical prompts (used for deterministic screenshots).
 *
 * Rule for pool entries: each alternative MUST be a command with the same
 * visual target as the canonical. If Garden slot 1 makes flowers bloom,
 * every alternative in that slot MUST also command flowers to bloom.
 */

export const LEVELS: Level[] = [
  // ── Act I: Awakening ──
  {
    title: "The Sleeping Garden",
    flavor: "Breathe life back into the garden.",
    prompts: ["wake now, sleeping roots", "bloom, every waiting flower"],
    promptPool: [
      ["wake now, sleeping roots", "rise up, dreaming roots", "stir, buried roots"],
      ["bloom, every waiting flower", "open, patient petals", "unfold, every sleeping blossom"],
    ],
    scene: "garden",
    accent: "#6bbf6b",
    bg: "#080e08",
    winText: "Color returns. Something stirs beneath the roots.",
  },
  {
    title: "The Dark Cottage",
    flavor: "Call the warmth home.",
    prompts: ["little candle, burn bright", "fill every room with warmth"],
    promptPool: [
      ["little candle, burn bright", "wake, small flames", "kindle, every lonely wick"],
      ["fill every room with warmth", "warm the walls again", "hearth, come home to us"],
    ],
    scene: "cottage",
    accent: "#e89a30",
    bg: "#0d0905",
    winText: "Warmth fills the rooms. A journal falls open — symbols you almost recognize.",
  },
  {
    title: "The Night Sky",
    flavor: "Speak their names to wake them.",
    prompts: ["Orion Vega Sirius Lyra", "burn again with ancient fire"],
    promptPool: [
      ["Orion Vega Sirius Lyra", "Polaris Altair Deneb Rigel", "Arcturus Procyon Capella Vega"],
      ["burn again with ancient fire", "rekindle the old light", "shine as you did before"],
    ],
    scene: "stars",
    accent: "#9090f8",
    bg: "#03030e",
    winText: "The constellations burn. Their patterns are deliberate. A map to something below.",
  },
  // ── Act II: Discovery ──
  {
    title: "The Dry Well",
    flavor: "The stones still remember the sound of water.",
    prompts: ["deep water, remember your name", "rise and carry the old songs home"],
    promptPool: [
      ["deep water, remember your name", "old water, find your way up", "hidden spring, remember"],
      ["rise and carry the old songs home", "carry the old music to the light", "bring the drowned melodies back"],
    ],
    scene: "well",
    accent: "#50b8b8",
    bg: "#040a0a",
    winText: "Runes surface on the stones, pulsing like a heartbeat.",
  },
  {
    title: "The Forgotten Bridge",
    flavor: "The path once linked two sacred places.",
    prompts: ["stone, recall the crossing", "spirits, walk the old paths"],
    promptPool: [
      ["stone, recall the crossing", "stone, remember the way", "stones, rebuild the path"],
      ["spirits, walk the old paths", "travelers, walk again", "let the long-gone cross once more"],
    ],
    scene: "bridge",
    accent: "#7aaa6a",
    bg: "#060a06",
    winText: "Spirit-lanterns flicker. Footprints in the moss — not yours.",
  },
  {
    title: "The Whispering Library",
    flavor: "Every page holds a sleeping voice.",
    prompts: ["open, sleeping pages", "speak again, forgotten words"],
    promptPool: [
      ["open, sleeping pages", "wake, forgotten pages", "unfold, every silent book"],
      ["speak again, forgotten words", "utter the lost verses", "let the old words sing"],
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
    prompts: ["stand tall again, guardians of old", "remember what was promised"],
    promptPool: [
      ["stand tall again, guardians of old", "rise, keepers of the ring", "awaken, old guardians"],
      ["remember what was promised", "hold the ancient vow", "keep the old covenant"],
    ],
    scene: "stones",
    accent: "#88a8c8",
    bg: "#050608",
    winText: "Light races between the stones. Not monuments — conduits.",
  },
  {
    title: "The Moonlit Sanctum",
    flavor: "Moonlight pools where the spirits once gathered.",
    prompts: ["moonlight, gather where spirits convene", "return to your seats, ancient ones"],
    promptPool: [
      ["moonlight, gather where spirits convene", "moon, pour into the clearing", "silver light, find the circle"],
      ["return to your seats, ancient ones", "take your places again, elders", "come back to the grove, old ones"],
    ],
    scene: "sanctum",
    accent: "#d0b870",
    bg: "#08080a",
    winText: "A figure turns toward you and inclines its head. You are recognized.",
  },
  {
    title: "The Great Tree",
    flavor: "Its roots are the ley lines. Its branches hold the sky.",
    prompts: ["roots deeper than memory", "branches wider than sky", "awaken, heart of all things"],
    promptPool: [
      ["roots deeper than memory", "roots beyond remembering", "roots older than words"],
      ["branches wider than sky", "branches broader than night", "limbs reaching past the stars"],
      ["awaken, heart of all things", "wake, the heart of the world", "beat, heart at the center"],
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
    prompts: ["garden bloom, hearth burn bright", "stars remember, spirits sing", "the ancient order is restored"],
    promptPool: [
      ["garden bloom, hearth burn bright", "garden wake, cottage glow", "every garden bloom, every hearth burn"],
      ["stars remember, spirits sing", "let stars burn, let spirits speak", "stars remember; spirits return"],
      ["the ancient order is restored", "the old pattern is whole again", "the world remembers itself"],
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

/**
 * Sample a concrete prompt array for a level. When shuffle is off (or
 * the level has no pool), returns the canonical prompts array unchanged.
 * When shuffle is on, picks one phrase per slot uniformly from that
 * slot's alternatives.
 */
export function samplePrompts(lvl: number, shuffle: boolean): string[] {
  const level = LEVELS[lvl];
  if (!shuffle || !level.promptPool) return [...level.prompts];
  return level.promptPool.map((slot) => slot[Math.floor(Math.random() * slot.length)]);
}

/** Respect ?canonical in the URL for deterministic screenshots, and
 *  hold canonical prompts on the first playthrough so a new player meets
 *  the 5/5-rated phrasing. Once they've completed the game once, replays
 *  sample from the pool for variety. The completion flag is the same
 *  localStorage key the store writes — kept loose-coupled here so
 *  samplePrompts callers don't need to thread it through. */
export function shouldShufflePrompts(): boolean {
  if (typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).has("canonical")) return false;
  try {
    if (localStorage.getItem("inkwood-completed") !== "1") return false;
  } catch { /* ignore */ }
  return true;
}
