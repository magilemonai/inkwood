import { useEffect, useRef, useState, useCallback, memo } from "react";
import { useGameStore } from "../store";
import { LEVELS, getActIndex } from "../levels";
import SceneRenderer from "./SceneRenderer";
import ErrorBoundary from "./ErrorBoundary";
import { useCompletionTimer } from "../hooks/useCompletionTimer";
import { startAmbient, playCompletionSweep, playTypeClick, toggleMute, isMuted } from "../audio";
import type { CharState } from "../types";
import s from "../styles/PlayingScreen.module.css";

function getCharStates(typed: string, target: string): CharState[] {
  return target.split("").map((ch, i) => {
    if (i >= typed.length) return "pending";
    return typed[i] === ch ? "correct" : "error";
  });
}

function quantize(n: number): number {
  return Math.round(n * 100) / 100;
}

const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

// ── HeaderBar — subscribes only to lvl + accent so it doesn't re-render per keystroke ──
const HeaderBar = memo(function HeaderBar() {
  const lvl = useGameStore((g) => g.lvl);
  const level = LEVELS[lvl];
  const accent = level.accent;
  const [audioMuted, setAudioMuted] = useState(isMuted);

  return (
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
          aria-label={audioMuted ? "Unmute" : "Mute"}
          title={audioMuted ? "Unmute" : "Mute"}
        >
          {audioMuted ? "✉" : "♫"}
        </button>
      </span>
      <span className={s.headerTitle}>{level.title}</span>
      <span className={s.headerDots} aria-hidden="true">
        {LEVELS.map((l, i) => (
          <span
            key={i}
            style={{
              color: i < lvl ? l.accent : i === lvl ? accent : "#333",
            }}
          >
            {i <= lvl ? "◆" : "◇"}
          </span>
        ))}
      </span>
    </div>
  );
});

// ── ProgressBar — subscribes to quantized progress, not raw typed ──
const ProgressBar = memo(function ProgressBar({ accent }: { accent: string }) {
  const progress = useGameStore((g) => quantize(g.levelProgress()));
  return (
    <div className={s.progressTrack} style={{ marginBottom: "0.6rem" }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
      <div
        className={s.progressFill}
        style={{ width: `${progress * 100}%`, background: accent }}
      />
    </div>
  );
});

export default function PlayingScreen() {
  // Narrow selectors — only re-renders when these specific slices change.
  const lvl = useGameStore((g) => g.lvl);
  const promptIdx = useGameStore((g) => g.promptIdx);
  const typed = useGameStore((g) => g.typed);
  const completing = useGameStore((g) => g.completing);
  const target = useGameStore((g) => g.target());
  const totalPrompts = useGameStore((g) => g.totalPrompts());
  const isComplete = useGameStore((g) => g.isComplete());

  // Level info — derives from lvl only.
  const level = LEVELS[lvl];
  const { accent, flavor } = level;

  // Scene progress — separately quantized for memo'd scene.
  const levelProgress = useGameStore((g) => quantize(g.levelProgress()));

  // Actions come from the store getter and are stable references.
  const typeChar = useGameStore((g) => g.typeChar);
  const startCompletion = useGameStore((g) => g.startCompletion);
  const advancePrompt = useGameStore((g) => g.advancePrompt);

  const inputRef = useRef<HTMLInputElement>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [idleNudge, setIdleNudge] = useState(false);
  const [rejectTick, setRejectTick] = useState(0);

  const charStates = getCharStates(typed, target);
  const hasError = charStates.some((st) => st === "error");

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

  // ── Ambient audio — start/crossfade on level change ──
  // No teardown on unmount: the engine crossfades between voices on
  // subsequent startAmbient calls, so level→level (and level→levelWin
  // →level) transitions don't stop-and-restart the bed.
  useEffect(() => {
    const actIdx = getActIndex(lvl);
    startAmbient(actIdx, lvl);
  }, [lvl]);

  // ── Focus management ──
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      setInputFocused(document.activeElement === inputRef.current);
    }, 80);
    return () => clearTimeout(timer);
  }, [lvl, promptIdx]);

  // ── Idle nudge ──
  useEffect(() => {
    if (typed.length !== 0 || completing) return;
    const timer = setTimeout(() => setIdleNudge(true), 2500);
    return () => {
      clearTimeout(timer);
      setIdleNudge(false);
    };
  }, [typed, completing, lvl, promptIdx]);


  const handleType = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const wasForward = newVal.length > typed.length;
    typeChar(newVal);
    const acceptedTyped = useGameStore.getState().typed;
    const acceptedForward = wasForward && acceptedTyped.length > typed.length;
    const acceptedBackward = !wasForward && acceptedTyped.length !== typed.length;
    if (acceptedForward) {
      playTypeClick();
      if (rejectTick > 0) setRejectTick(0);
    } else if (wasForward && !acceptedForward) {
      setRejectTick((t) => t + 1);
    } else if (acceptedBackward && rejectTick > 0) {
      setRejectTick(0);
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
    setInputFocused(true);
  };

  const showTapOverlay = !inputFocused && typed.length === 0;
  const showPulse = typed.length === 0 && !completing;
  const showBreathRing = completing;

  return (
    <div className={s.container} onClick={focusInput}>
      <div
        className={s.sceneContainer}
        role="img"
        aria-label={`${level.title} — ${levelProgress === 0 ? "dormant, waiting" : levelProgress < 1 ? "awakening" : "fully alive"}`}
      >
        <ErrorBoundary>
          <SceneRenderer sceneKey={level.scene} progress={levelProgress} />
        </ErrorBoundary>
      </div>

      <HeaderBar />

      <div className={s.typingArea}>
        <ProgressBar accent={accent} />

        <p className={s.flavor}>{flavor}</p>

        <div
          className={`${s.promptBox} ${showPulse ? s.promptBoxPulsing : ""} ${showPulse && idleNudge && !showTapOverlay ? s.promptBoxIdleNudge : ""} ${showBreathRing ? s.promptBoxBreathing : ""}`}
          style={{ border: `1px solid ${accent}25`, "--breath-color": accent } as React.CSSProperties}
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
            const flashReject = isCursor && rejectTick > 0;
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
