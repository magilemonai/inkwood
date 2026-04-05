import { useEffect, useRef, useState, useCallback } from "react";
import { useGameStore } from "../store";
import { LEVELS, getActIndex } from "../levels";
import SceneRenderer from "./SceneRenderer";
import ErrorBoundary from "./ErrorBoundary";
import { useCompletionTimer } from "../hooks/useCompletionTimer";
import { startAmbient, stopAmbient, playChime, playTypeClick, toggleMute, isMuted } from "../audio";
import type { CharState } from "../types";
import s from "../styles/PlayingScreen.module.css";

function getCharStates(typed: string, target: string): CharState[] {
  return target.split("").map((ch, i) => {
    if (i >= typed.length) return "pending";
    return typed[i] === ch ? "correct" : "error";
  });
}

/** Quantize to 0.01 so React.memo on scenes actually prevents re-renders */
function quantize(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Detect touch device for context-aware hints */
const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

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
  const rawProgress = useGameStore((g) => g.levelProgress());
  const isComplete = useGameStore((g) => g.isComplete());

  const inputRef = useRef<HTMLInputElement>(null);
  const [inputFocused, setInputFocused] = useState(false);

  const { accent } = level;
  const charStates = getCharStates(typed, target);
  const hasError = charStates.some((st) => st === "error");

  // Quantize progress for effective React.memo on scenes
  const levelProgress = quantize(rawProgress);

  // ── Completion timer (extracted to hook) ──
  const handleComplete = useCallback(() => {
    startCompletion();
    advancePrompt();
  }, [startCompletion, advancePrompt]);

  useCompletionTimer(isComplete, handleComplete, 1500, [promptIdx, lvl]);

  // ── Start completion state immediately (for UI feedback) ──
  useEffect(() => {
    if (isComplete && !completing) {
      startCompletion();
      playChime(level.accent);
    }
  }, [isComplete, completing, startCompletion, level.accent]);

  // ── Ambient audio — start/switch on level change ──
  const [audioMuted, setAudioMuted] = useState(isMuted);
  useEffect(() => {
    const actIdx = getActIndex(lvl);
    startAmbient(actIdx);
    return () => { stopAmbient(); };
  }, [lvl]);

  // ── Focus management ──
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      setInputFocused(document.activeElement === inputRef.current);
    }, 80);
    return () => clearTimeout(timer);
  }, [lvl, promptIdx]);

  const handleType = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    if (newVal.length > typed.length) playTypeClick();
    typeChar(newVal);
  };

  const focusInput = () => {
    inputRef.current?.focus();
    setInputFocused(true);
  };

  const showTapOverlay = !inputFocused && typed.length === 0;

  // Golden pulse: active at the start of EVERY phrase until first character typed
  const showPulse = typed.length === 0 && !completing;

  return (
    <div className={s.container} onClick={focusInput}>
      {/* Scene fills entire viewport — wrapped in error boundary */}
      <div className={s.sceneContainer}>
        <ErrorBoundary>
          <SceneRenderer sceneKey={level.scene} progress={levelProgress} />
        </ErrorBoundary>
      </div>

      {/* Header floats on top */}
      <div className={s.header}>
        <span className={s.headerLogo} style={{ color: accent, opacity: 0.7 }}>
          INKWOOD
          <button
            onClick={(e) => { e.stopPropagation(); setAudioMuted(toggleMute()); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: accent, opacity: 0.4, fontSize: "0.6em", marginLeft: "0.5em",
              fontFamily: "monospace", padding: 0,
            }}
            title={audioMuted ? "Unmute" : "Mute"}
          >
            {audioMuted ? "\u2709" : "\u266B"}
          </button>
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

      {/* Typing area — overlaid at bottom */}
      <div className={s.typingArea}>
        {/* Progress bar */}
        <div className={s.progressTrack} style={{ marginBottom: "0.6rem" }}>
          <div
            className={s.progressFill}
            style={{ width: `${levelProgress * 100}%`, background: accent }}
          />
        </div>

        <p className={s.flavor}>{level.flavor}</p>

        {/* Prompt display — pulses on every phrase start */}
        <div
          className={`${s.promptBox} ${showPulse ? s.promptBoxPulsing : ""}`}
          style={{ border: `1px solid ${accent}25` }}
          onClick={focusInput}
        >
          {showTapOverlay && (
            <div className={s.tapOverlay} onClick={focusInput}>
              {isTouchDevice ? "tap here to begin typing" : "click anywhere to type"}
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

        {/* Hidden input */}
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
