import { useGameStore } from "../store";
import { LEVELS } from "../levels";
import { isV2Enabled, switchEdition, type ReturnMarker } from "../v2";
import s from "../styles/EditionToggle.module.css";

/**
 * The pinned edition switch: Classic | Inkwood 2, on every screen.
 *
 * Switching reloads into the other edition at the player's place: the
 * same level and phrase while playing, the next level from a win or act
 * card, the outro or Wander if that is where they were, the title
 * otherwise. Phrases are re-sampled for the edition on arrival.
 */
export default function EditionToggle() {
  const screen = useGameStore((g) => g.screen);
  const lvl = useGameStore((g) => g.lvl);
  const promptIdx = useGameStore((g) => g.promptIdx);
  const v2 = isV2Enabled();

  const go = (on: boolean) => {
    if (on === v2) return;
    let marker: ReturnMarker;
    switch (screen) {
      case "playing":
        marker = { screen: "playing", lvl, promptIdx };
        break;
      case "levelWin":
      case "actTransition":
        marker = { screen: "playing", lvl: Math.min(lvl + 1, LEVELS.length - 1), promptIdx: 0 };
        break;
      case "outro":
        marker = { screen: "outro" };
        break;
      case "wander":
        marker = { screen: "wander" };
        break;
      default:
        marker = { screen: "intro" };
    }
    switchEdition(on, marker);
  };

  return (
    <div className={s.pill} role="group" aria-label="Edition: Classic or Inkwood 2">
      <button
        className={`${s.opt} ${!v2 ? s.active : ""}`}
        onClick={(e) => { e.stopPropagation(); go(false); }}
        aria-pressed={!v2}
        title="Inkwood Classic (April 2026)"
      >
        Classic
      </button>
      <span className={s.sep} aria-hidden="true">·</span>
      <button
        className={`${s.opt} ${v2 ? s.active : ""}`}
        onClick={(e) => { e.stopPropagation(); go(true); }}
        aria-pressed={v2}
        title="Inkwood 2 (September 2026)"
      >
        Inkwood 2
      </button>
    </div>
  );
}
