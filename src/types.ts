export interface Level {
  title: string;
  flavor: string;
  /** Canonical phrases — used for screenshots, critique, and fallback when
   *  pool sampling is disabled. */
  prompts: string[];
  /** Optional alternative phrasings per slot. On real playthroughs the
   *  store samples one entry per slot at level entry. Each alternative
   *  must target the same visual effect as the canonical prompt. */
  promptPool?: string[][];
  scene: SceneKey;
  accent: string;
  bg: string;
  winText: string;
}

export type SceneKey =
  | "garden"
  | "cottage"
  | "stars"
  | "well"
  | "bridge"
  | "library"
  | "stones"
  | "sanctum"
  | "tree"
  | "world";

export type Screen =
  | "intro"
  | "playing"
  | "levelWin"
  | "actTransition"
  | "outro"
  | "wander";

export type CharState = "correct" | "error" | "pending";

export interface SceneProps {
  progress: number;
  /** Inkwood 2: the words of the current phrase the player has finished
   *  typing, space-joined, in the phrase's own casing (e.g. "Orion Lyra").
   *  Changes only at word boundaries, so memo'd scenes re-render at most
   *  once per word. Lets a scene obey the words literally: the Stars draw
   *  the constellation just named. Optional; v1 scenes ignore it. */
  wordsDone?: string;
}
