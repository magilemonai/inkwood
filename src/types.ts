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
}
