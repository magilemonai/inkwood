import type { Level } from "./types";

/**
 * Inkwood 2 — the rewritten story. Served by levels.ts when the ?v2 gate
 * is on; the v1.5 table stays untouched beside it.
 *
 * THE FRAME: you are the new scribe. The one before you wrote this
 * forest awake once, then went quiet, and the world went dormant. Their
 * journal (found in the Cottage) holds the incantations, half finished.
 * You finish them. In the Great Tree you learn where the old scribes go
 * when the writing is done. The last line is yours.
 *
 * TWO VOICES, no new surfaces:
 *   - `flavor` is the journal: the previous scribe, first person, one
 *     sentence, in italics above the prompt box.
 *   - `winText` is the world answering: what you see happen.
 * The prompts stay the player's own incantations, imperatives the world
 * obeys, each mapped to one visible transformation.
 *
 * Same scene keys, accents, and backgrounds as v1 so the art is shared.
 * Titles unchanged (screenshot.mjs finds levels by title).
 */

export const LEVELS_V2: Level[] = [
  // ── Act I: Kindling ──
  {
    title: "The Sleeping Garden",
    flavor: "Begin with the roots, and the rest will remember on its own.",
    prompts: ["wake now, sleeping roots", "bloom, every waiting flower"],
    promptPool: [
      ["wake now, sleeping roots", "rise up, dreaming roots"],
      ["bloom, every waiting flower", "open, patient petals"],
    ],
    scene: "garden",
    accent: "#6bbf6b",
    bg: "#080e08",
    winText: "Color returns. Under the roots, something turns toward the light.",
  },
  {
    title: "The Dark Cottage",
    flavor: "Light the candles first, for nothing is read in the dark.",
    prompts: ["little candle, burn bright", "fill every room with warmth"],
    promptPool: [
      ["little candle, burn bright", "wake, small flames"],
      ["fill every room with warmth", "warm the walls again"],
    ],
    scene: "cottage",
    accent: "#e89a30",
    bg: "#0d0905",
    winText: "Warmth fills the room. On the shelf, a journal falls open in a hand that is not yours.",
  },
  {
    title: "The Night Sky",
    flavor: "I named them one by one, and one by one they answered.",
    // Four constellations. The scene draws each figure the moment its
    // name is finished (SceneProps.wordsDone), so the pool only permutes
    // the same four names: the shapes are always all there by the end.
    prompts: ["Orion Lyra Cygnus Cassiopeia", "burn again with ancient fire"],
    promptPool: [
      ["Orion Lyra Cygnus Cassiopeia", "Cassiopeia Cygnus Orion Lyra", "Lyra Orion Cassiopeia Cygnus"],
      ["burn again with ancient fire", "rekindle the old light"],
    ],
    scene: "stars",
    accent: "#9090f8",
    bg: "#03030e",
    winText: "The constellations burn. Their pattern is deliberate: a map to something below.",
  },
  // ── Act II: The Old Paths ──
  {
    title: "The Dry Well",
    flavor: "The stones still remember the sound of water.",
    prompts: ["deep water, remember your name", "rise and carry the old songs home"],
    promptPool: [
      ["deep water, remember your name", "hidden spring, remember"],
      ["rise and carry the old songs home", "bring the drowned melodies back"],
    ],
    scene: "well",
    accent: "#50b8b8",
    bg: "#040a0a",
    winText: "The water rises. Runes surface on the wet stone, pulsing like a heartbeat.",
  },
  {
    title: "The Forgotten Bridge",
    flavor: "The crossing would not answer me; perhaps it waits for another voice.",
    prompts: ["stone, recall the crossing", "spirits, walk the old paths"],
    promptPool: [
      ["stone, recall the crossing", "stone, remember the way"],
      ["spirits, walk the old paths", "travelers, walk again"],
    ],
    scene: "bridge",
    accent: "#7aaa6a",
    bg: "#060a06",
    winText: "Spirit-lanterns flicker. Footprints in the moss. Not yours.",
  },
  {
    title: "The Whispering Library",
    flavor: "Every book here is a voice that stopped mid-sentence.",
    prompts: ["open, sleeping pages", "every voice, rise and speak as one"],
    promptPool: [
      ["open, sleeping pages", "wake, forgotten pages"],
      ["every voice, rise and speak as one", "speak together, every silent book"],
    ],
    scene: "library",
    accent: "#c088b0",
    bg: "#0a0608",
    winText: "The books speak in chorus. One burns brighter than the rest, written in the journal's hand.",
  },
  // ── Act III: The Listening ──
  {
    title: "The Spirit Stones",
    flavor: "They kept a promise once, and will again, for anyone who remembers it.",
    prompts: ["stand tall again, guardians of old", "remember what was promised"],
    promptPool: [
      ["stand tall again, guardians of old", "rise, keepers of the ring"],
      ["remember what was promised", "hold the ancient vow"],
    ],
    scene: "stones",
    accent: "#88a8c8",
    bg: "#050608",
    winText: "Light races between the stones. Conduits, all of them.",
  },
  {
    title: "The Moonlit Sanctum",
    flavor: "Here the old ones sat in council, and here I was not yet known.",
    // The ancient ones are the elder trees. Naming them is the summoning,
    // as it was for the stars.
    prompts: ["moonlight, pour into the circle", "Oak, Alder, Yew, take your seats"],
    promptPool: [
      ["moonlight, pour into the circle", "silver light, find the clearing"],
      ["Oak, Alder, Yew, take your seats", "Rowan, Ash, Elm, take your seats"],
    ],
    scene: "sanctum",
    accent: "#d0b870",
    bg: "#08080a",
    winText: "A figure turns toward you and inclines its head. You are recognized.",
  },
  {
    title: "The Great Tree",
    flavor: "I understand now where the old scribes go when the writing is done.",
    prompts: ["roots deeper than memory", "branches wider than sky", "awaken, heart of all things"],
    promptPool: [
      ["roots deeper than memory", "roots older than words"],
      ["branches wider than sky", "limbs reaching past the stars"],
      ["awaken, heart of all things", "wake, the heart of the world"],
    ],
    scene: "tree",
    accent: "#b8c8a8",
    bg: "#060806",
    winText: "The heart wakes. Inside it, small lights, one for every scribe who wrote this forest awake.",
  },
  // ── Act IV: The Last Line ──
  {
    title: "The Waking World",
    flavor: "The last line is yours.",
    prompts: ["garden bloom, hearth burn bright", "stars remember, spirits sing", "the forest remembers"],
    promptPool: [
      ["garden bloom, hearth burn bright", "garden wake, cottage glow"],
      ["stars remember, spirits sing", "let stars burn, let spirits speak"],
      ["the forest remembers", "the forest remembers itself"],
    ],
    scene: "world",
    accent: "#d8c890",
    bg: "#060808",
    winText: "All one.",
  },
];

export const ACT_LABELS_V2 = ["Kindling", "The Old Paths", "The Listening", "The Last Line"];

/** Journal pages shown on the act cards, keyed by the level just
 *  completed (2, 5, 8). The previous scribe's hand. */
export const JOURNAL_PAGES_V2: Record<number, string> = {
  2: "Roots, candles, stars. That was the easy part. The map points to water, and the water is gone.",
  5: "Water, crossing, words. The forest speaks now, but not to me. Something in the stones is listening for a different name.",
  8: "So this is where the pen goes. Not lost. Rooted. Whoever reads this: finish the line, then leave one word of your own.",
};
