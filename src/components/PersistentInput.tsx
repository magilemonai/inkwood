import { useEffect } from "react";
import { useGameStore } from "../store";
import { useInput } from "../contexts/InputContext";
import { playTypeClick } from "../audio";
import s from "../styles/PlayingScreen.module.css";

/**
 * Singleton input element that stays mounted for the lifetime of the
 * app. iOS WebKit only opens the on-screen keyboard when .focus() runs
 * inside a user gesture handler — so we keep one input alive forever
 * and let gesture-driven buttons (Begin, Continue, level cards) focus
 * it directly. That focus call survives the React tree swap when
 * screens change, so the keyboard never has to reopen between levels.
 *
 * The input is positioned off-screen via .hiddenInput; the visible
 * "prompt box" is rendered by PlayingScreen reading `typed` from the
 * store.
 */
export default function PersistentInput() {
  const { inputRef, setInputFocused, blurInput, setRejectTick } = useInput();
  const screen = useGameStore((g) => g.screen);
  const typed = useGameStore((g) => g.typed);
  const typeChar = useGameStore((g) => g.typeChar);

  // Dismiss the keyboard whenever we leave the playing screen. Focus
  // is gesture-driven on the way back in — never automatic — so iOS
  // can't show the keyboard during intros, level wins, transitions,
  // or the outro.
  useEffect(() => {
    if (screen !== "playing") {
      blurInput();
    }
  }, [screen, blurInput]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const prevTyped = typed;
    const wasForward = newVal.length > prevTyped.length;
    typeChar(newVal);
    const acceptedTyped = useGameStore.getState().typed;
    const acceptedForward = wasForward && acceptedTyped.length > prevTyped.length;
    const acceptedBackward = !wasForward && acceptedTyped.length !== prevTyped.length;
    if (acceptedForward) {
      playTypeClick();
      setRejectTick(0);
    } else if (wasForward && !acceptedForward) {
      setRejectTick((t) => t + 1);
    } else if (acceptedBackward) {
      setRejectTick(0);
    }
  };

  return (
    <input
      ref={inputRef}
      className={s.hiddenInput}
      type="text"
      value={typed}
      onChange={handleChange}
      onFocus={() => setInputFocused(true)}
      onBlur={() => setInputFocused(false)}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      enterKeyHint="done"
      inputMode="text"
      name="phrase"
      aria-label="Type the incantation"
    />
  );
}
