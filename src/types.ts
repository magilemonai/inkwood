export interface Level {
  title: string;
  flavor: string;
  prompts: string[];
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

export type Screen = "title" | "playing" | "levelWin" | "gameWin";

export type CharState = "correct" | "error" | "pending";

export interface SceneProps {
  progress: number;
}
