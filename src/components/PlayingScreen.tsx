import { useEffect, useRef } from "react";
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

  const { accent, bg } = level;
  const charStates = getCharStates(typed, target);
  const hasError = charStates.some((s) => s === "error");

  // ── Completion timer (strict-mode safe) ──
  useEffect(() => {
    if (!isComplete || completingRef.current) return;
    completingRef.current = true;
    startCompletion();
    setTimeout(() => {
      advancePrompt();
      completingRef.current = false;
    }, 700);
  }, [isComplete, promptIdx, lvl, startCompletion, advancePrompt]);

  // ── Focus management ──
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [lvl, promptIdx]);

  const handleType = (e: React.ChangeEvent<HTMLInputElement>) => {
    typeChar(e.target.value);
  };

  const focusInput = () => inputRef.current?.focus();

  const SceneComp = getSceneComponent(level.scene);

  return (
    <div className={s.container} style={{ background: bg }} onClick={focusInput}>
      {/* Header */}
      <div className={s.header} style={{ borderBottom: `1px solid ${accent}18` }}>
        <span className={s.headerLogo} style={{ color: accent, opacity: 0.6 }}>
          INKWOOD
        </span>
        <span className={s.headerTitle}>{level.title}</span>
        <span className={s.headerDots}>
          {LEVELS.map((l, i) => (
            <span
              key={i}
              style={{
                color: i < lvl ? l.accent : i === lvl ? accent : "#1a1a1a",
              }}
            >
              {i <= lvl ? "\u25C6" : "\u25C7"}
            </span>
          ))}
        </span>
      </div>

      {/* Scene */}
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

      {/* Typing area */}
      <div className={s.typingArea} style={{ borderTop: `1px solid ${accent}18` }}>
        <p className={s.flavor}>{level.flavor}</p>

        {/* Prompt display */}
        <div
          className={s.promptBox}
          style={{ border: `1px solid ${accent}20` }}
          onClick={focusInput}
        >
          {target.split("").map((ch, i) => {
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
                        : "#2e3e2e",
                  borderLeft: isCursor ? `2px solid ${accent}` : "none",
                }}
              >
                {ch}
              </span>
            );
          })}
          {typed.length >= target.length && !completing && (
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
              color: isComplete ? accent : hasError ? "#884040" : "#3a4a3a",
            }}
          >
            {isComplete
              ? "\u2713 well done"
              : hasError
                ? "backspace to correct"
                : "type the phrase above"}
          </span>
          <span>
            phrase {promptIdx + 1} of {totalPrompts}
          </span>
        </div>

        {/* Hidden input */}
        <input
          ref={inputRef}
          className={s.hiddenInput}
          value={typed}
          onChange={handleType}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
