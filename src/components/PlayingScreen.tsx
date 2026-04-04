import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store";
import { LEVELS } from "../levels";
import { getSceneComponent } from "../scenes";
import type { CharState } from "../types";
import s from "../styles/PlayingScreen.module.css";

function getCharStates(typed: string, target: string): CharState[] {
  return target.split("").map((ch, i) => {
    if (i >= typed.length) return "pending";
    return typed[i] === ch ? "correct" : "error";
  });
}

export default function PlayingScreen() {
  const {
    lvl,
    promptIdx,
    typed,
    completing,
    typeChar,
    startCompletion,
    advancePrompt,
  } = useGameStore();

  const level = useGameStore((g) => g.level());
  const target = useGameStore((g) => g.target());
  const totalPrompts = useGameStore((g) => g.totalPrompts());
  const levelProgress = useGameStore((g) => g.levelProgress());
  const isComplete = useGameStore((g) => g.isComplete());

  const inputRef = useRef<HTMLInputElement>(null);
  const completingRef = useRef(false);
  const [inputFocused, setInputFocused] = useState(false);

  const { accent, bg } = level;
  const charStates = getCharStates(typed, target);
  const hasError = charStates.some((st) => st === "error");

  // ── Completion timer (strict-mode safe) ──
  useEffect(() => {
    if (!isComplete || completingRef.current) return;
    completingRef.current = true;
    startCompletion();
    setTimeout(() => {
      advancePrompt();
      completingRef.current = false;
    }, 1500);
  }, [isComplete, promptIdx, lvl, startCompletion, advancePrompt]);

  // ── Focus management — attempt programmatic focus, but don't rely on it ──
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      setInputFocused(document.activeElement === inputRef.current);
    }, 80);
    return () => clearTimeout(timer);
  }, [lvl, promptIdx]);

  const handleType = (e: React.ChangeEvent<HTMLInputElement>) => {
    typeChar(e.target.value);
  };

  // Real user gesture → focus (critical for mobile)
  const focusInput = () => {
    inputRef.current?.focus();
    setInputFocused(true);
  };

  const SceneComp = getSceneComponent(level.scene);

  // Show tap overlay when input isn't focused and nothing typed yet
  const showTapOverlay = !inputFocused && typed.length === 0;

  return (
    <div className={s.container} style={{ background: bg }} onClick={focusInput}>
      {/* Header */}
      <div className={s.header} style={{ borderBottom: `1px solid ${accent}15` }}>
        <span className={s.headerLogo} style={{ color: accent, opacity: 0.7 }}>
          INKWOOD
        </span>
        <span className={s.headerTitle}>{level.title}</span>
        <span className={s.headerDots}>
          {LEVELS.map((l, i) => (
            <span
              key={i}
              style={{
                color: i < lvl ? l.accent : i === lvl ? accent : "#333",
              }}
            >
              {i <= lvl ? "\u25C6" : "\u25C7"}
            </span>
          ))}
        </span>
      </div>

      {/* Scene — fills remaining space */}
      <div className={s.sceneContainer}>
        <SceneComp progress={levelProgress} />
      </div>

      {/* Progress bar */}
      <div className={s.progressTrack}>
        <div
          className={s.progressFill}
          style={{ width: `${levelProgress * 100}%`, background: accent }}
        />
      </div>

      {/* Typing area — fixed at bottom */}
      <div className={s.typingArea} style={{ borderTop: `1px solid ${accent}15` }}>
        <p className={s.flavor}>{level.flavor}</p>

        {/* Prompt display — pulses golden until user types */}
        <div
          className={`${s.promptBox} ${typed.length === 0 && promptIdx === 0 && !completing ? s.promptBoxPulsing : ""}`}
          style={{ border: `1px solid ${accent}25` }}
          onClick={focusInput}
        >
          {/* Mobile tap overlay */}
          {showTapOverlay && (
            <div className={s.tapOverlay} onClick={focusInput}>
              tap here to begin typing
            </div>
          )}

          {!showTapOverlay && target.split("").map((ch, i) => {
            const state = charStates[i];
            const isCursor = i === typed.length && !completing;
            return (
              <span
                key={i}
                className={`${s.char} ${isCursor ? s.cursor : ""}`}
                style={{
                  color:
                    state === "correct"
                      ? accent
                      : state === "error"
                        ? "#e05050"
                        : undefined,
                  borderLeft: isCursor ? `2px solid ${accent}` : "none",
                }}
              >
                {state === "pending" ? (
                  <span className={s.charPending}>{ch}</span>
                ) : (
                  ch
                )}
              </span>
            );
          })}
          {!showTapOverlay && typed.length >= target.length && !completing && (
            <span
              className={s.endCursor}
              style={{ borderLeft: `2px solid ${accent}` }}
            >
              {" "}
            </span>
          )}
        </div>

        {/* Sub-info */}
        <div className={s.subInfo}>
          <span
            style={{
              color: isComplete ? accent : hasError ? "#c06060" : "#908878",
            }}
          >
            {isComplete
              ? "\u2713 well done"
              : hasError
                ? "backspace to correct"
                : showTapOverlay
                  ? ""
                  : "type the phrase above"}
          </span>
          <span>
            phrase {promptIdx + 1} of {totalPrompts}
          </span>
        </div>

        {/* Hidden input — positioned inside the prompt box area for mobile focus */}
        <input
          ref={inputRef}
          className={s.hiddenInput}
          value={typed}
          onChange={handleType}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
