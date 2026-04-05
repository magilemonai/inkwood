/**
 * Inkwood Audio — Web Audio API synthesis
 *
 * No audio files. Everything is synthesized:
 * - Ambient pads per act (layered detuned oscillators + filter)
 * - Completion chime on phrase finish
 * - Progress-reactive harmonic shifts
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientNodes: OscillatorNode[] = [];
let ambientGain: GainNode | null = null;
let lfo: OscillatorNode | null = null;
let lfoGain: GainNode | null = null;
let currentAct = -1;
let muted = false;

// Save mute preference
const MUTE_KEY = "inkwood-mute";
try {
  muted = localStorage.getItem(MUTE_KEY) === "1";
} catch { /* ignore */ }

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

// ── Act ambient definitions ──────────────────────────────
// Each act has a root note, chord intervals, filter freq, and character

interface ActAmbient {
  /** Root frequency in Hz */
  root: number;
  /** Intervals as frequency ratios (from root) */
  ratios: number[];
  /** Oscillator type for each voice */
  types: OscillatorType[];
  /** Low-pass filter cutoff */
  filterFreq: number;
  /** LFO speed (Hz) — slower = more meditative */
  lfoRate: number;
  /** Overall volume */
  volume: number;
}

const ACT_AMBIENTS: ActAmbient[] = [
  // Act I: Awakening — warm, gentle, nature-like
  // Key of C major: C3, E3, G3, C4 (root, major 3rd, 5th, octave)
  {
    root: 130.81,
    ratios: [1, 1.25, 1.5, 2],
    types: ["sine", "sine", "triangle", "sine"],
    filterFreq: 400,
    lfoRate: 0.08,
    volume: 0.06,
  },
  // Act II: Discovery — mysterious, deeper, minor
  // Key of A minor: A2, C3, E3, A3
  {
    root: 110,
    ratios: [1, 1.2, 1.5, 2],
    types: ["sine", "triangle", "sine", "sine"],
    filterFreq: 350,
    lfoRate: 0.06,
    volume: 0.06,
  },
  // Act III: The Nexus — mystical, shimmering
  // Key of D: D3, F#3, A3, D4
  {
    root: 146.83,
    ratios: [1, 1.26, 1.5, 2],
    types: ["sine", "sine", "sine", "triangle"],
    filterFreq: 500,
    lfoRate: 0.1,
    volume: 0.055,
  },
  // Act IV: Restoration — grand, warm, full
  // Key of G major: G2, B2, D3, G3
  {
    root: 98,
    ratios: [1, 1.25, 1.5, 2, 3],
    types: ["sine", "sine", "triangle", "sine", "sine"],
    filterFreq: 450,
    lfoRate: 0.07,
    volume: 0.06,
  },
];

// ── Ambient pad ──────────────────────────────────────────

export function startAmbient(actIndex: number) {
  if (actIndex === currentAct) return;
  stopAmbient();
  currentAct = actIndex;

  const ac = getCtx();
  const def = ACT_AMBIENTS[actIndex] ?? ACT_AMBIENTS[0];

  // Create gain for this ambient group
  ambientGain = ac.createGain();
  ambientGain.gain.value = 0;

  // Low-pass filter for warmth
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = def.filterFreq;
  filter.Q.value = 0.7;

  // LFO for gentle volume modulation
  lfo = ac.createOscillator();
  lfoGain = ac.createGain();
  lfo.type = "sine";
  lfo.frequency.value = def.lfoRate;
  lfoGain.gain.value = def.volume * 0.3; // modulation depth
  lfo.connect(lfoGain);
  lfoGain.connect(ambientGain.gain);
  lfo.start();

  // Create oscillator voices
  ambientNodes = def.ratios.map((ratio, i) => {
    const osc = ac.createOscillator();
    osc.type = def.types[i] ?? "sine";
    osc.frequency.value = def.root * ratio;
    // Slight detune for richness (each voice slightly different)
    osc.detune.value = (i - def.ratios.length / 2) * 3;
    osc.connect(filter);
    osc.start();
    return osc;
  });

  filter.connect(ambientGain);
  ambientGain.connect(masterGain!);

  // Fade in over 3 seconds
  ambientGain.gain.setValueAtTime(0, ac.currentTime);
  ambientGain.gain.linearRampToValueAtTime(def.volume, ac.currentTime + 3);
}

export function stopAmbient() {
  if (!ctx || ambientNodes.length === 0) return;

  const ac = ctx;
  const fadeTime = 2;

  // Fade out
  if (ambientGain) {
    ambientGain.gain.setValueAtTime(ambientGain.gain.value, ac.currentTime);
    ambientGain.gain.linearRampToValueAtTime(0, ac.currentTime + fadeTime);
  }

  // Stop after fade
  const nodes = [...ambientNodes];
  const oldLfo = lfo;
  const oldAmbientGain = ambientGain;
  const oldLfoGain = lfoGain;

  setTimeout(() => {
    nodes.forEach((n) => { try { n.stop(); n.disconnect(); } catch { /* already stopped */ } });
    try { oldLfo?.stop(); oldLfo?.disconnect(); } catch { /* ignore */ }
    try { oldLfoGain?.disconnect(); } catch { /* ignore */ }
    try { oldAmbientGain?.disconnect(); } catch { /* ignore */ }
  }, fadeTime * 1000 + 100);

  ambientNodes = [];
  lfo = null;
  lfoGain = null;
  ambientGain = null;
  currentAct = -1;
}

// ── Completion chime ─────────────────────────────────────

export function playChime(accentHex?: string) {
  const ac = getCtx();

  // Parse accent color to determine chime character
  // Default to a warm bell tone
  const baseFreq = 523.25; // C5
  const harmonics = [1, 2, 3, 5.04]; // bell-like partial series
  const gains = [0.5, 0.25, 0.12, 0.06];

  const chimeGain = ac.createGain();
  chimeGain.gain.value = 0;
  chimeGain.connect(masterGain!);

  // Quick attack, slow decay
  const now = ac.currentTime;
  chimeGain.gain.setValueAtTime(0, now);
  chimeGain.gain.linearRampToValueAtTime(0.08, now + 0.02);
  chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

  harmonics.forEach((ratio, i) => {
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = baseFreq * ratio;
    // Slight randomness for naturalness
    osc.detune.value = (Math.random() - 0.5) * 4;

    const partialGain = ac.createGain();
    partialGain.gain.value = gains[i] ?? 0.1;
    osc.connect(partialGain);
    partialGain.connect(chimeGain);

    osc.start(now);
    osc.stop(now + 3);
  });

  // Cleanup
  setTimeout(() => {
    try { chimeGain.disconnect(); } catch { /* ignore */ }
  }, 3500);
}

// ── Typing sound — very subtle click ─────────────────────

let lastTypeTime = 0;

export function playTypeClick() {
  const ac = getCtx();
  const now = ac.currentTime;

  // Throttle to avoid overwhelming on fast typing
  if (now - lastTypeTime < 0.03) return;
  lastTypeTime = now;

  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 800 + Math.random() * 200;

  const clickGain = ac.createGain();
  clickGain.gain.setValueAtTime(0.015, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(clickGain);
  clickGain.connect(masterGain!);
  osc.start(now);
  osc.stop(now + 0.06);

  setTimeout(() => {
    try { clickGain.disconnect(); } catch { /* ignore */ }
  }, 200);
}

// ── Mute toggle ──────────────────────────────────────────

export function toggleMute(): boolean {
  muted = !muted;
  try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch { /* ignore */ }
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : 1;
  }
  return muted;
}

export function isMuted(): boolean {
  return muted;
}

// ── Cleanup ──────────────────────────────────────────────

export function disposeAudio() {
  stopAmbient();
  if (ctx) {
    ctx.close();
    ctx = null;
    masterGain = null;
  }
}
