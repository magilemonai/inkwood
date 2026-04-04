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

  const { accent } = level;
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
    <div className={s.container} onClick={focusInput}>
      {/* Scene fills entire viewport */}
      <div className={s.sceneContainer}>
        <SceneComp progress={levelProgress} />
      </div>

      {/* Header floats on top */}
      <div className={s.header}>
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

      {/* Typing area docked at bottom with gradient overlay */}
      <div className={s.typingArea}>
        {/* Progress bar */}
        <div className={s.progressTrack} style={{ marginBottom: "0.75rem" }}>
          <div
            className={s.progressFill}
            style={{ width: `${levelProgress * 100}%`, background: accent }}
          />
        </div>

        <p className={s.flavor}>{level.flavor}</p>

        {/* Prompt display */}
        <div
          className={s.promptBox}
          style={{ border: `1px solid ${accent}30` }}
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
              color: isComplete ? accent : hasError ? "#c06060" : "#807868",
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
