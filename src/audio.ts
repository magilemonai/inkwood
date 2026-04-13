/**
 * Inkwood Audio — Web Audio API synthesis
 *
 * No audio files. Everything is synthesized:
 * - Ambient pads per act with per-scene tonal variation
 * - Subtle filter sweep on phrase completion (no chime)
 * - Intro drone that builds from silence
 * - Very quiet type clicks
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientNodes: OscillatorNode[] = [];
let ambientGain: GainNode | null = null;
let ambientFilter: BiquadFilterNode | null = null;
let lfo: OscillatorNode | null = null;
let lfoGain: GainNode | null = null;
let currentAct = -1;
let currentScene = -1;
let muted = false;

// Nature texture state
let textureSource: AudioBufferSourceNode | null = null;
let textureGain: GainNode | null = null;

// Intro drone state
let introNodes: OscillatorNode[] = [];
let introGain: GainNode | null = null;

const MUTE_KEY = "inkwood-mute";
try {
  muted = localStorage.getItem(MUTE_KEY) === "1";
} catch { /* ignore */ }

// ── HARD VOLUME CAP ──
// All audio goes through masterGain which is capped at 0.15.
// Individual voices are further attenuated. This prevents
// any combination of sounds from hurting the listener.
const MASTER_VOLUME = 0.15;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : MASTER_VOLUME;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

/**
 * Preload the AudioContext on the first user gesture (any click,
 * keydown, or touch). Browsers require a gesture to unlock audio; by
 * pre-creating + resuming the context early we eliminate the
 * first-phrase-completion stutter that otherwise happens when the
 * context is constructed mid-gameplay.
 *
 * Idempotent — running more than once is a no-op. The listeners
 * unregister themselves after the first gesture.
 */
let audioPreloadArmed = false;
export function armAudioPreload() {
  if (audioPreloadArmed || typeof window === "undefined") return;
  audioPreloadArmed = true;

  const prime = () => {
    // Create + resume the AudioContext; any subsequent audio calls
    // reuse the same instance.
    try { getCtx(); } catch { /* AudioContext may not be available */ }
    window.removeEventListener("pointerdown", prime);
    window.removeEventListener("keydown", prime);
    window.removeEventListener("touchstart", prime);
  };

  window.addEventListener("pointerdown", prime, { once: true });
  window.addEventListener("keydown", prime, { once: true });
  window.addEventListener("touchstart", prime, { once: true });
}

// ── Act + scene ambient definitions ──────────────────────

interface ActAmbient {
  root: number;
  ratios: number[];
  types: OscillatorType[];
  filterFreq: number;
  lfoRate: number;
  volume: number;
}

// Per-scene filter offsets — each scene within an act shifts the
// low-pass cutoff and adds a subtle frequency detune to feel different
const SCENE_OFFSETS: { filterShift: number; detuneShift: number }[] = [
  { filterShift: 0,   detuneShift: 0 },    // 0: Garden
  { filterShift: -30, detuneShift: -5 },    // 1: Cottage (warmer, lower)
  { filterShift: 40,  detuneShift: 8 },     // 2: Stars (brighter)
  { filterShift: -50, detuneShift: -3 },    // 3: Well (darker, deeper)
  { filterShift: -20, detuneShift: 2 },     // 4: Bridge (slightly warmer)
  { filterShift: 20,  detuneShift: -8 },    // 5: Library (mysterious)
  { filterShift: -10, detuneShift: 5 },     // 6: Stones (airy)
  { filterShift: 30,  detuneShift: -2 },    // 7: Sanctum (shimmery)
  { filterShift: 50,  detuneShift: 10 },    // 8: Tree (bright, open)
  { filterShift: 60,  detuneShift: 12 },    // 9: World (fullest, warmest)
];

const ACT_AMBIENTS: ActAmbient[] = [
  // Act I: Awakening — warm, gentle, C major
  {
    root: 130.81,
    ratios: [1, 1.25, 1.5, 2],
    types: ["sine", "sine", "triangle", "sine"],
    filterFreq: 280,
    lfoRate: 0.06,
    volume: 0.012,
  },
  // Act II: Discovery — darker, minor, lower
  {
    root: 82.41,  // E2 — much lower than Act I
    ratios: [1, 1.2, 1.5, 2, 2.4],
    types: ["sine", "triangle", "sine", "sine", "triangle"],
    filterFreq: 200,  // darker filter
    lfoRate: 0.04,    // slower breathing
    volume: 0.013,
  },
  // Act III: The Nexus — mystical shimmer, perfect fifth
  {
    root: 146.83,  // D3
    ratios: [1, 1.335, 1.5, 2, 3],  // includes a shimmery 9th
    types: ["sine", "sine", "sine", "triangle", "sine"],
    filterFreq: 400,  // brighter
    lfoRate: 0.08,    // faster shimmer
    volume: 0.011,
  },
  // Act IV: Restoration — grand, full
  {
    root: 98,
    ratios: [1, 1.25, 1.5, 2, 3],
    types: ["sine", "sine", "triangle", "sine", "sine"],
    filterFreq: 320,
    lfoRate: 0.05,
    volume: 0.012,
  },
];

// ── Intro drone ──────────────────────────────────────────

export function startIntroDrone() {
  stopIntroDrone();
  const ac = getCtx();

  introGain = ac.createGain();
  introGain.gain.value = 0;

  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 200;
  filter.Q.value = 0.5;

  // Very low, very quiet drone — builds from nothing
  const freqs = [65.41, 98]; // C2, G2
  introNodes = freqs.map((f) => {
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    osc.connect(filter);
    osc.start();
    return osc;
  });

  filter.connect(introGain);
  introGain.connect(masterGain!);

  // Fade in very slowly over 8 seconds to barely audible
  const now = ac.currentTime;
  introGain.gain.setValueAtTime(0, now);
  introGain.gain.linearRampToValueAtTime(0.008, now + 8);
}

export function stopIntroDrone() {
  if (!ctx || introNodes.length === 0) return;
  const ac = ctx;

  if (introGain) {
    introGain.gain.setValueAtTime(introGain.gain.value, ac.currentTime);
    introGain.gain.linearRampToValueAtTime(0, ac.currentTime + 1.5);
  }

  const nodes = [...introNodes];
  const oldGain = introGain;
  setTimeout(() => {
    nodes.forEach((n) => { try { n.stop(); n.disconnect(); } catch { /* */ } });
    try { oldGain?.disconnect(); } catch { /* */ }
  }, 2000);

  introNodes = [];
  introGain = null;
}

// ── Ambient pad ──────────────────────────────────────────

export function startAmbient(actIndex: number, sceneIndex: number = 0) {
  // If same act, just shift the filter for scene variation
  if (actIndex === currentAct && sceneIndex !== currentScene) {
    currentScene = sceneIndex;
    shiftForScene(sceneIndex);
    startTexture(sceneIndex);
    return;
  }

  stopAmbient();
  stopIntroDrone(); // stop intro drone when gameplay starts
  currentAct = actIndex;
  currentScene = sceneIndex;

  const ac = getCtx();
  const def = ACT_AMBIENTS[actIndex] ?? ACT_AMBIENTS[0];
  const sceneOff = SCENE_OFFSETS[sceneIndex] ?? SCENE_OFFSETS[0];

  ambientGain = ac.createGain();
  ambientGain.gain.value = 0;

  ambientFilter = ac.createBiquadFilter();
  ambientFilter.type = "lowpass";
  ambientFilter.frequency.value = def.filterFreq + sceneOff.filterShift;
  ambientFilter.Q.value = 0.7;

  // LFO for gentle volume breathing
  lfo = ac.createOscillator();
  lfoGain = ac.createGain();
  lfo.type = "sine";
  lfo.frequency.value = def.lfoRate;
  lfoGain.gain.value = def.volume * 0.25;
  lfo.connect(lfoGain);
  lfoGain.connect(ambientGain.gain);
  lfo.start();

  ambientNodes = def.ratios.map((ratio, i) => {
    const osc = ac.createOscillator();
    osc.type = def.types[i] ?? "sine";
    osc.frequency.value = def.root * ratio;
    osc.detune.value = (i - def.ratios.length / 2) * 3 + sceneOff.detuneShift;
    osc.connect(ambientFilter!);
    osc.start();
    return osc;
  });

  ambientFilter.connect(ambientGain);
  ambientGain.connect(masterGain!);

  // Fade in over 3 seconds
  ambientGain.gain.setValueAtTime(0, ac.currentTime);
  ambientGain.gain.linearRampToValueAtTime(def.volume, ac.currentTime + 3);

  // Start nature texture layer
  startTexture(sceneIndex);
}

/** Shift filter and detune for scene variation within same act */
function shiftForScene(sceneIndex: number) {
  if (!ctx || !ambientFilter) return;
  const ac = ctx;
  const actDef = ACT_AMBIENTS[currentAct] ?? ACT_AMBIENTS[0];
  const sceneOff = SCENE_OFFSETS[sceneIndex] ?? SCENE_OFFSETS[0];

  // Smooth transition over 2 seconds
  ambientFilter.frequency.setValueAtTime(ambientFilter.frequency.value, ac.currentTime);
  ambientFilter.frequency.linearRampToValueAtTime(
    actDef.filterFreq + sceneOff.filterShift,
    ac.currentTime + 2
  );

  // Shift oscillator detune
  ambientNodes.forEach((osc, i) => {
    const baseDet = (i - ambientNodes.length / 2) * 3;
    osc.detune.setValueAtTime(osc.detune.value, ac.currentTime);
    osc.detune.linearRampToValueAtTime(baseDet + sceneOff.detuneShift, ac.currentTime + 2);
  });
}

export function stopAmbient() {
  stopTexture();
  if (!ctx || ambientNodes.length === 0) return;
  const ac = ctx;

  if (ambientGain) {
    ambientGain.gain.setValueAtTime(ambientGain.gain.value, ac.currentTime);
    ambientGain.gain.linearRampToValueAtTime(0, ac.currentTime + 2);
  }

  const nodes = [...ambientNodes];
  const oldLfo = lfo;
  const oldGain = ambientGain;
  const oldLfoGain = lfoGain;
  const oldFilter = ambientFilter;

  setTimeout(() => {
    nodes.forEach((n) => { try { n.stop(); n.disconnect(); } catch { /* */ } });
    try { oldLfo?.stop(); oldLfo?.disconnect(); } catch { /* */ }
    try { oldLfoGain?.disconnect(); } catch { /* */ }
    try { oldFilter?.disconnect(); } catch { /* */ }
    try { oldGain?.disconnect(); } catch { /* */ }
  }, 2500);

  ambientNodes = [];
  lfo = null;
  lfoGain = null;
  ambientGain = null;
  ambientFilter = null;
  currentAct = -1;
  currentScene = -1;
}

// ── Nature texture layer ─────────────────────────────────
// Synthesized ambient textures: noise through bandpass = wind,
// filtered noise = water, etc. Layered on top of tonal pad.

// Per-scene texture configs
const SCENE_TEXTURES: { filterFreq: number; filterQ: number; volume: number; type: "wind" | "water" | "deep" | "none" }[] = [
  { filterFreq: 800,  filterQ: 0.3, volume: 0.004, type: "wind" },   // Garden — soft breeze
  { filterFreq: 400,  filterQ: 0.5, volume: 0.003, type: "deep" },   // Cottage — low crackle
  { filterFreq: 1200, filterQ: 0.2, volume: 0.002, type: "wind" },   // Stars — high thin wind
  { filterFreq: 600,  filterQ: 0.8, volume: 0.005, type: "water" },  // Well — water drip
  { filterFreq: 500,  filterQ: 0.3, volume: 0.004, type: "wind" },   // Bridge — wind gusts
  { filterFreq: 300,  filterQ: 0.6, volume: 0.003, type: "deep" },   // Library — deep reverb
  { filterFreq: 700,  filterQ: 0.3, volume: 0.004, type: "wind" },   // Stones — moor wind
  { filterFreq: 2000, filterQ: 0.4, volume: 0.003, type: "wind" },   // Sanctum — night air
  { filterFreq: 250,  filterQ: 0.5, volume: 0.004, type: "deep" },   // Tree — earth hum
  { filterFreq: 600,  filterQ: 0.3, volume: 0.005, type: "wind" },   // World — open wind
];

function createNoiseBuffer(ac: AudioContext, seconds: number): AudioBuffer {
  const sampleRate = ac.sampleRate;
  const length = sampleRate * seconds;
  const buffer = ac.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function startTexture(sceneIndex: number) {
  stopTexture();
  const ac = getCtx();
  const config = SCENE_TEXTURES[sceneIndex] ?? SCENE_TEXTURES[0];
  if (config.type === "none") return;

  const noiseBuffer = createNoiseBuffer(ac, 4);

  textureSource = ac.createBufferSource();
  textureSource.buffer = noiseBuffer;
  textureSource.loop = true;

  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = config.filterFreq;
  filter.Q.value = config.filterQ;

  textureGain = ac.createGain();
  textureGain.gain.value = 0;

  textureSource.connect(filter);
  filter.connect(textureGain);
  textureGain.connect(masterGain!);

  textureSource.start();

  // Fade in over 4s
  textureGain.gain.setValueAtTime(0, ac.currentTime);
  textureGain.gain.linearRampToValueAtTime(config.volume, ac.currentTime + 4);
}

function stopTexture() {
  if (!ctx) return;
  const ac = ctx;

  if (textureGain) {
    textureGain.gain.setValueAtTime(textureGain.gain.value, ac.currentTime);
    textureGain.gain.linearRampToValueAtTime(0, ac.currentTime + 2);
  }

  const oldSource = textureSource;
  const oldGain = textureGain;
  setTimeout(() => {
    try { oldSource?.stop(); oldSource?.disconnect(); } catch { /* */ }
    try { oldGain?.disconnect(); } catch { /* */ }
  }, 2500);

  textureSource = null;
  textureGain = null;
}

// ── Phrase completion — subtle filter sweep ──────────────
// Instead of a doorbell chime, briefly open the low-pass filter
// wider, creating a momentary brightening of the ambient sound.
// This feels like the world "breathing in" after each incantation.

export function playCompletionSweep() {
  if (!ctx || !ambientFilter || !ambientGain) return;
  const ac = ctx;
  const now = ac.currentTime;
  const actDef = ACT_AMBIENTS[currentAct] ?? ACT_AMBIENTS[0];
  const sceneOff = SCENE_OFFSETS[currentScene] ?? SCENE_OFFSETS[0];
  const baseFreq = actDef.filterFreq + sceneOff.filterShift;

  // Brief filter sweep up then back down
  ambientFilter.frequency.cancelScheduledValues(now);
  ambientFilter.frequency.setValueAtTime(baseFreq, now);
  ambientFilter.frequency.linearRampToValueAtTime(baseFreq + 200, now + 0.3);
  ambientFilter.frequency.linearRampToValueAtTime(baseFreq, now + 2.0);

  // Subtle volume swell
  const currentVol = ambientGain.gain.value;
  ambientGain.gain.cancelScheduledValues(now);
  ambientGain.gain.setValueAtTime(currentVol, now);
  ambientGain.gain.linearRampToValueAtTime(currentVol * 1.4, now + 0.3);
  ambientGain.gain.linearRampToValueAtTime(actDef.volume, now + 2.0);
}

// ── Typing sound — very subtle click ─────────────────────

let lastTypeTime = 0;

export function playTypeClick() {
  const ac = getCtx();
  const now = ac.currentTime;

  if (now - lastTypeTime < 0.04) return;
  lastTypeTime = now;

  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 800 + Math.random() * 200;

  const clickGain = ac.createGain();
  clickGain.gain.setValueAtTime(0.003, now);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

  osc.connect(clickGain);
  clickGain.connect(masterGain!);
  osc.start(now);
  osc.stop(now + 0.05);

  setTimeout(() => {
    try { clickGain.disconnect(); } catch { /* */ }
  }, 200);
}

// ── Mute toggle ──────────────────────────────────────────

export function toggleMute(): boolean {
  muted = !muted;
  try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch { /* */ }
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : MASTER_VOLUME;
  }
  return muted;
}

export function isMuted(): boolean {
  return muted;
}

// ── Cleanup ──────────────────────────────────────────────

export function disposeAudio() {
  stopAmbient();
  stopIntroDrone();
  if (ctx) {
    ctx.close();
    ctx = null;
    masterGain = null;
  }
}
