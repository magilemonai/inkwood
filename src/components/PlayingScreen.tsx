import { useEffect, useRef, useState, useCallback } from "react";
import { useGameStore } from "../store";
import { LEVELS, getActIndex } from "../levels";
import SceneRenderer from "./SceneRenderer";
import ErrorBoundary from "./ErrorBoundary";
import { useCompletionTimer } from "../hooks/useCompletionTimer";
import { startAmbient, stopAmbient, playCompletionSweep, playTypeClick, toggleMute, isMuted } from "../audio";
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
  const [idleNudge, setIdleNudge] = useState(false);
  // Bump a counter when a keystroke is rejected so the expected
  // character flashes briefly. Using a counter (not a boolean) lets
  // repeated rejections retrigger the animation on every miss.
  const [rejectTick, setRejectTick] = useState(0);

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
      playCompletionSweep();
    }
  }, [isComplete, completing, startCompletion]);

  // ── Ambient audio — start/switch on level change ──
  const [audioMuted, setAudioMuted] = useState(isMuted);
  useEffect(() => {
    const actIdx = getActIndex(lvl);
    startAmbient(actIdx, lvl);
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

  // ── Idle nudge — if the player hasn't typed anything on a fresh
  //    prompt within 2.5s, escalate the pulse so the call to action
  //    is unmistakable. Set is done inside the timer; the cleanup
  //    resets the flag whenever typing starts or the prompt advances,
  //    so we never call setState synchronously in the effect body. ──
  useEffect(() => {
    if (typed.length !== 0 || completing) return;
    const timer = setTimeout(() => setIdleNudge(true), 2500);
    return () => {
      clearTimeout(timer);
      setIdleNudge(false);
    };
  }, [typed, completing, lvl, promptIdx]);


  // Track IME composition (Chinese/Japanese/Korean/etc.) — browsers fire
  // onChange during composition with intermediate values that would fail
  // our strict char-by-char validation. We wait for compositionend.
  const isComposingRef = useRef(false);

  const handleType = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isComposingRef.current) return;
    const newVal = e.target.value;
    const wasForward = newVal.length > typed.length;
    typeChar(newVal);
    const acceptedTyped = useGameStore.getState().typed;
    const acceptedForward = wasForward && acceptedTyped.length > typed.length;
    const acceptedBackward = !wasForward && acceptedTyped.length !== typed.length;
    // If the DOM input drifted from accepted state (partial paste, rejected
    // forward keystroke), force-sync so the field reflects truth.
    if (e.target.value !== acceptedTyped) {
      e.target.value = acceptedTyped;
    }
    if (acceptedForward) {
      playTypeClick();
      // Clear any stale rejection so correct keystrokes after a miss
      // don't inherit the red flash animation on every subsequent char.
      if (rejectTick > 0) setRejectTick(0);
    } else if (wasForward && !acceptedForward) {
      // Rejected forward keystroke — flash the expected character so the
      // player who isn't watching the cursor gets a cheap "try again" cue.
      setRejectTick((t) => t + 1);
    } else if (acceptedBackward && rejectTick > 0) {
      setRejectTick(0);
    }
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    // Re-run validation on the final composed value.
    handleType({ target: e.target } as unknown as React.ChangeEvent<HTMLInputElement>);
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
      {/* Scene fills entire viewport — wrapped in error boundary.
           The scene is decorative; screen readers should skip it and
           focus on the typing prompt below. */}
      <div className={s.sceneContainer} aria-hidden="true">
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
            aria-label={audioMuted ? "Unmute audio" : "Mute audio"}
            aria-pressed={audioMuted}
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

        {/* Prompt display — pulses on every phrase start; escalates after 2.5s idle.
             The idle caption is suppressed when the tap overlay is showing
             (the "click anywhere to type" text there already serves that purpose). */}
        <div
          className={`${s.promptBox} ${showPulse ? s.promptBoxPulsing : ""} ${showPulse && idleNudge && !showTapOverlay ? s.promptBoxIdleNudge : ""}`}
          style={{ border: `1px solid ${accent}25` }}
          onClick={focusInput}
          role="group"
          aria-label={`Incantation: ${target}`}
        >
          {showTapOverlay && (
            <div className={s.tapOverlay} onClick={focusInput}>
              {isTouchDevice ? "tap here to begin typing" : "click anywhere to type"}
            </div>
          )}

          {!showTapOverlay && target.split("").map((ch, i) => {
            const state = charStates[i];
            const isCursor = i === typed.length && !completing;
            // Apply the reject-flash class only to the expected (cursor)
            // character, and re-key it on rejectTick so CSS replays the
            // animation on every new miss.
            const flashReject = isCursor && rejectTick > 0;
            return (
              <span
                key={i}
                className={`${s.char} ${isCursor ? s.cursor : ""}`}
                // Re-mount the inner span on each rejection so the CSS
                // animation restarts. Outer span key stays stable (by i).
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
                  <span
                    key={flashReject ? `p-${rejectTick}` : "p"}
                    className={`${s.charPending} ${flashReject ? s.charRejectFlashInner : ""}`}
                  >
                    {ch}
                  </span>
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
              ? "well done"
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

        <input
          ref={inputRef}
          className={s.hiddenInput}
          type="text"
          value={typed}
          onChange={handleType}
          onCompositionStart={() => { isComposingRef.current = true; }}
          onCompositionEnd={handleCompositionEnd}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="done"
          aria-label="Type the incantation"
        />
      </div>
    </div>
  );
}
