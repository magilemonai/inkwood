/**
 * The progress the world is currently SHOWING, as opposed to the store's
 * exact progress (which jumps with every accepted keystroke).
 *
 * Under the Feel gate, PlayingScreen tweens the displayed progress toward
 * the store's value over a few hundred milliseconds so each letter moves
 * the world continuously instead of snapping it. Anything that draws the
 * world (the scene, the light layer) should read this, so art and light
 * move together. Null when no tween is running the display (classic
 * game, reduced motion, or no playing screen mounted): read the store.
 */

let value: number | null = null;

export function setDisplayProgress(v: number | null) {
  value = v;
}

export function getDisplayProgress(): number | null {
  return value;
}
