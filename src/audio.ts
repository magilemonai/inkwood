/**
 * Inkwood Audio — Web Audio API synthesis
 *
 * All audio is synthesized (no files). An AudioEngine class owns the
 * WebAudio graph; the module exports a single instance plus a thin
 * functional facade so call sites stay the shape they had before.
 *
 * The engine supports true crossfades between ambient voices —
 * starting a new scene's ambient does not interrupt the previous
 * voice; the old voice ramps down in parallel with the new ramping
 * up, so level-to-level transitions are seamless rather than stop-
 * then-start.
 */

// ── HARD VOLUME CAP ──
// All audio goes through masterGain which is capped at 0.15.
// Individual voices are further attenuated. Prevents any combination
// of sounds from hurting the listener.
const MASTER_VOLUME = 0.15;

const MUTE_KEY = "inkwood-mute";

// ── Act + scene ambient definitions ──────────────────────

interface ActAmbient {
  root: number;
  ratios: number[];
  types: OscillatorType[];
  filterFreq: number;
  lfoRate: number;
  volume: number;
}

const SCENE_OFFSETS: { filterShift: number; detuneShift: number }[] = [
  { filterShift: 0,   detuneShift: 0 },    // 0: Garden
  { filterShift: -30, detuneShift: -5 },   // 1: Cottage
  { filterShift: 40,  detuneShift: 8 },    // 2: Stars
  { filterShift: -50, detuneShift: -3 },   // 3: Well
  { filterShift: -20, detuneShift: 2 },    // 4: Bridge
  { filterShift: 20,  detuneShift: -8 },   // 5: Library
  { filterShift: -10, detuneShift: 5 },    // 6: Stones
  { filterShift: 30,  detuneShift: -2 },   // 7: Sanctum
  { filterShift: 50,  detuneShift: 10 },   // 8: Tree
  { filterShift: 60,  detuneShift: 12 },   // 9: World
];

const ACT_AMBIENTS: ActAmbient[] = [
  { root: 130.81, ratios: [1, 1.25, 1.5, 2],      types: ["sine", "sine", "triangle", "sine"],         filterFreq: 280, lfoRate: 0.06, volume: 0.012 },
  { root: 82.41,  ratios: [1, 1.2, 1.5, 2, 2.4],  types: ["sine", "triangle", "sine", "sine", "triangle"], filterFreq: 200, lfoRate: 0.04, volume: 0.013 },
  { root: 146.83, ratios: [1, 1.335, 1.5, 2, 3],  types: ["sine", "sine", "sine", "triangle", "sine"], filterFreq: 400, lfoRate: 0.08, volume: 0.011 },
  { root: 98,     ratios: [1, 1.25, 1.5, 2, 3],   types: ["sine", "sine", "triangle", "sine", "sine"], filterFreq: 320, lfoRate: 0.05, volume: 0.012 },
];

const SCENE_TEXTURES: { filterFreq: number; filterQ: number; volume: number; type: "wind" | "water" | "deep" | "none" }[] = [
  { filterFreq: 800,  filterQ: 0.3, volume: 0.004, type: "wind" },
  { filterFreq: 400,  filterQ: 0.5, volume: 0.003, type: "deep" },
  { filterFreq: 1200, filterQ: 0.2, volume: 0.002, type: "wind" },
  { filterFreq: 600,  filterQ: 0.8, volume: 0.005, type: "water" },
  { filterFreq: 500,  filterQ: 0.3, volume: 0.004, type: "wind" },
  { filterFreq: 300,  filterQ: 0.6, volume: 0.003, type: "deep" },
  { filterFreq: 700,  filterQ: 0.3, volume: 0.004, type: "wind" },
  { filterFreq: 2000, filterQ: 0.4, volume: 0.003, type: "wind" },
  { filterFreq: 250,  filterQ: 0.5, volume: 0.004, type: "deep" },
  { filterFreq: 600,  filterQ: 0.3, volume: 0.005, type: "wind" },
];

// ── Voice bundles ─────────────────────────────────────────

interface AmbientVoice {
  act: number;
  scene: number;
  oscs: OscillatorNode[];
  filter: BiquadFilterNode;
  gain: GainNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
  textureSource: AudioBufferSourceNode | null;
  textureGain: GainNode | null;
}

interface IntroVoice {
  oscs: OscillatorNode[];
  gain: GainNode;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private current: AmbientVoice | null = null;
  private intro: IntroVoice | null = null;
  private lastTypeTime = 0;
  private preloadArmed = false;

  constructor() {
    try { this.muted = localStorage.getItem(MUTE_KEY) === "1"; } catch { /* ignore */ }
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : MASTER_VOLUME;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Arm a listener on the first user gesture to unlock the AudioContext
   *  before gameplay starts — eliminates first-phrase-completion stutter. */
  armPreload() {
    if (this.preloadArmed || typeof window === "undefined") return;
    this.preloadArmed = true;
    const prime = () => {
      try { this.ensureCtx(); } catch { /* ignore */ }
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("keydown", prime);
      window.removeEventListener("touchstart", prime);
    };
    window.addEventListener("pointerdown", prime, { once: true });
    window.addEventListener("keydown", prime, { once: true });
    window.addEventListener("touchstart", prime, { once: true });
  }

  // ── Intro drone ────────────────────────────────────────

  startIntroDrone() {
    this.stopIntroDrone();
    // Intro drone and gameplay ambient are mutually exclusive — coming
    // back to the intro (e.g. via restart) should fade out any lingering
    // ambient voice before the drone builds.
    this.stopAmbient();
    const ac = this.ensureCtx();
    const gain = ac.createGain();
    gain.gain.value = 0;

    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 200;
    filter.Q.value = 0.5;

    const freqs = [65.41, 98];
    const oscs = freqs.map((f) => {
      const osc = ac.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      osc.connect(filter);
      osc.start();
      return osc;
    });

    filter.connect(gain);
    gain.connect(this.masterGain!);

    const now = ac.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.008, now + 8);

    this.intro = { oscs, gain };
  }

  stopIntroDrone() {
    if (!this.ctx || !this.intro) return;
    const ac = this.ctx;
    const { oscs, gain } = this.intro;
    gain.gain.setValueAtTime(gain.gain.value, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + 1.5);
    setTimeout(() => {
      oscs.forEach((o) => { try { o.stop(); o.disconnect(); } catch { /* */ } });
      try { gain.disconnect(); } catch { /* */ }
    }, 2000);
    this.intro = null;
  }

  // ── Ambient ────────────────────────────────────────────

  /** Start or crossfade to an ambient voice. If the requested act+scene
   *  matches the currently-playing voice, this is a no-op. Otherwise a
   *  fresh voice is built and ramped up while the previous voice is
   *  ramped down in parallel — a real crossfade, not stop-then-start. */
  startAmbient(actIndex: number, sceneIndex: number = 0) {
    // Intro drone is mutually exclusive with ambient.
    this.stopIntroDrone();

    if (this.current && this.current.act === actIndex && this.current.scene === sceneIndex) {
      return;
    }

    // Begin fading out the old voice (if any) in parallel with the new.
    const old = this.current;
    if (old) {
      this.fadeOutVoice(old, 2);
    }

    this.current = this.buildAmbient(actIndex, sceneIndex, old ? 2 : 3);
  }

  stopAmbient() {
    if (!this.current) return;
    this.fadeOutVoice(this.current, 2);
    this.current = null;
  }

  private buildAmbient(actIndex: number, sceneIndex: number, fadeInSec: number): AmbientVoice {
    const ac = this.ensureCtx();
    const def = ACT_AMBIENTS[actIndex] ?? ACT_AMBIENTS[0];
    const sceneOff = SCENE_OFFSETS[sceneIndex] ?? SCENE_OFFSETS[0];

    const gain = ac.createGain();
    gain.gain.value = 0;

    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = def.filterFreq + sceneOff.filterShift;
    filter.Q.value = 0.7;

    const lfo = ac.createOscillator();
    const lfoGain = ac.createGain();
    lfo.type = "sine";
    lfo.frequency.value = def.lfoRate;
    lfoGain.gain.value = def.volume * 0.25;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    const oscs = def.ratios.map((ratio, i) => {
      const osc = ac.createOscillator();
      osc.type = def.types[i] ?? "sine";
      osc.frequency.value = def.root * ratio;
      osc.detune.value = (i - def.ratios.length / 2) * 3 + sceneOff.detuneShift;
      osc.connect(filter);
      osc.start();
      return osc;
    });

    filter.connect(gain);
    gain.connect(this.masterGain!);

    const now = ac.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(def.volume, now + fadeInSec);

    const texture = this.buildTexture(sceneIndex);

    return {
      act: actIndex,
      scene: sceneIndex,
      oscs,
      filter,
      gain,
      lfo,
      lfoGain,
      textureSource: texture?.source ?? null,
      textureGain: texture?.gain ?? null,
    };
  }

  private fadeOutVoice(voice: AmbientVoice, seconds: number) {
    if (!this.ctx) return;
    const ac = this.ctx;
    const now = ac.currentTime;

    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.linearRampToValueAtTime(0, now + seconds);

    if (voice.textureGain) {
      voice.textureGain.gain.cancelScheduledValues(now);
      voice.textureGain.gain.setValueAtTime(voice.textureGain.gain.value, now);
      voice.textureGain.gain.linearRampToValueAtTime(0, now + seconds);
    }

    setTimeout(() => {
      voice.oscs.forEach((o) => { try { o.stop(); o.disconnect(); } catch { /* */ } });
      try { voice.lfo.stop(); voice.lfo.disconnect(); } catch { /* */ }
      try { voice.lfoGain.disconnect(); } catch { /* */ }
      try { voice.filter.disconnect(); } catch { /* */ }
      try { voice.gain.disconnect(); } catch { /* */ }
      try { voice.textureSource?.stop(); voice.textureSource?.disconnect(); } catch { /* */ }
      try { voice.textureGain?.disconnect(); } catch { /* */ }
    }, seconds * 1000 + 500);
  }

  // ── Nature texture layer ──────────────────────────────

  private buildTexture(sceneIndex: number): { source: AudioBufferSourceNode; gain: GainNode } | null {
    const ac = this.ensureCtx();
    const config = SCENE_TEXTURES[sceneIndex] ?? SCENE_TEXTURES[0];
    if (config.type === "none") return null;

    const sampleRate = ac.sampleRate;
    const length = sampleRate * 4;
    const buffer = ac.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = config.filterFreq;
    filter.Q.value = config.filterQ;

    const gain = ac.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    source.start();
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(config.volume, ac.currentTime + 4);

    return { source, gain };
  }

  // ── Phrase completion — brief filter sweep on current voice ──

  playCompletionSweep() {
    if (!this.ctx || !this.current) return;
    const ac = this.ctx;
    const now = ac.currentTime;
    const voice = this.current;
    const actDef = ACT_AMBIENTS[voice.act] ?? ACT_AMBIENTS[0];
    const sceneOff = SCENE_OFFSETS[voice.scene] ?? SCENE_OFFSETS[0];
    const baseFreq = actDef.filterFreq + sceneOff.filterShift;

    voice.filter.frequency.cancelScheduledValues(now);
    voice.filter.frequency.setValueAtTime(baseFreq, now);
    voice.filter.frequency.linearRampToValueAtTime(baseFreq + 200, now + 0.3);
    voice.filter.frequency.linearRampToValueAtTime(baseFreq, now + 2.0);

    const currentVol = voice.gain.gain.value;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(currentVol, now);
    voice.gain.gain.linearRampToValueAtTime(currentVol * 1.4, now + 0.3);
    voice.gain.gain.linearRampToValueAtTime(actDef.volume, now + 2.0);
  }

  // ── Typing sound — very subtle click ──────────────────

  playTypeClick() {
    const ac = this.ensureCtx();
    const now = ac.currentTime;
    if (now - this.lastTypeTime < 0.04) return;
    this.lastTypeTime = now;

    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 800 + Math.random() * 200;

    const clickGain = ac.createGain();
    clickGain.gain.setValueAtTime(0.003, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(clickGain);
    clickGain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.05);

    setTimeout(() => {
      try { clickGain.disconnect(); } catch { /* */ }
    }, 200);
  }

  // ── Mute toggle ───────────────────────────────────────

  toggleMute(): boolean {
    this.muted = !this.muted;
    try { localStorage.setItem(MUTE_KEY, this.muted ? "1" : "0"); } catch { /* */ }
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : MASTER_VOLUME;
    }
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  dispose() {
    this.stopAmbient();
    this.stopIntroDrone();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
    }
  }
}

// ── Singleton instance + functional facade ────────────────

const engine = new AudioEngine();

export function armAudioPreload() { engine.armPreload(); }
export function startIntroDrone() { engine.startIntroDrone(); }
export function stopIntroDrone() { engine.stopIntroDrone(); }
export function startAmbient(act: number, scene: number = 0) { engine.startAmbient(act, scene); }
export function stopAmbient() { engine.stopAmbient(); }
export function playCompletionSweep() { engine.playCompletionSweep(); }
export function playTypeClick() { engine.playTypeClick(); }
export function toggleMute() { return engine.toggleMute(); }
export function isMuted() { return engine.isMuted(); }
export function disposeAudio() { engine.dispose(); }
