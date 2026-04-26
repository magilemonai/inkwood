/**
 * Inkwood trailer — v2 recording script.
 *
 * Records a ~30-second silent trailer at 1280×720 as a .webm. Five
 * gameplay shots + a title card, each shot self-contained with a
 * fade-in from black at the start and fade-to-black at the end, so
 * the dev-menu work that swaps scenes between shots is hidden behind
 * the cuts. None of the climactic beats are revealed (no comets,
 * no full tree bloom, no outro panorama, no complete ley-line
 * network) — every shot ends between 30% and 55% of the scene's
 * progress, so the trailer shows the *mechanic* and the *mood*
 * without spoiling the payoffs.
 *
 * Each shot has a slow camera move (CSS transform on the scene
 * container, which leaves the typing overlay still/centered), so the
 * viewer's eye keeps moving during the shot. Typing is paced at
 * ~120ms/char — deliberate, not blazing.
 *
 * Usage:
 *   # Start the preview server first:
 *   npx vite build && npx vite preview --port 4173 &
 *   # Then run:
 *   node scripts/trailer.mjs
 *
 * Output:
 *   ./trailer-output/trailer-<timestamp>.webm
 *
 * Post-production: convert to mp4/gif with ffmpeg if you need it:
 *   ffmpeg -i trailer-<timestamp>.webm -c:v libx264 -pix_fmt yuv420p trailer.mp4
 */

import { chromium } from 'playwright-core';
import { mkdirSync, readdirSync, renameSync, existsSync, statSync, copyFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';
import { spawnSync } from 'child_process';

/** Locate the Playwright-managed Chromium binary in a user-agnostic
 *  way. Picks whichever exists. */
function findChrome() {
  const macCache = resolve(homedir(), 'Library/Caches/ms-playwright');
  if (existsSync(macCache)) {
    const versions = readdirSync(macCache).filter((d) => d.startsWith('chromium-'));
    for (const v of versions.sort().reverse()) {
      const p = resolve(macCache, v, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
      if (existsSync(p)) return p;
    }
  }
  const linuxCache = resolve(homedir(), '.cache/ms-playwright');
  if (existsSync(linuxCache)) {
    const versions = readdirSync(linuxCache).filter((d) => d.startsWith('chromium-'));
    for (const v of versions.sort().reverse()) {
      const p = resolve(linuxCache, v, 'chrome-linux/chrome');
      if (existsSync(p)) return p;
    }
  }
  const sandboxFallback = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  if (existsSync(sandboxFallback)) return sandboxFallback;
  throw new Error('No Playwright Chromium found. Run `npx playwright install chromium`.');
}

const CHROME_PATH = findChrome();
const BASE_URL = 'http://localhost:4173/inkwood/';
const OUTPUT_DIR = './trailer-output';
const VIDEO_SIZE = { width: 1280, height: 720 };

const TYPE_SPEED = 180;        // ms per character — slow, contemplative
const SHOT_DURATION = 8;       // seconds per gameplay shot
const FADE_IN = 0.9;           // seconds — black to scene at shot start
const FADE_OUT = 0.7;          // seconds — scene to black at shot end
const TYPE_LEAD = 1.0;         // seconds — pause before typing starts
const TITLE_DURATION = 5;      // seconds — title card on-screen
const PRE_ROLL = 5;            // seconds of guaranteed-black at recording
                               // start — cropped out in post so any
                               // intro flash during page boot is gone.
                               // 5s gives wide margin for goto + React
                               // mount + dormant intro renders.

/**
 * Shot definitions. Each runs for `SHOT_DURATION` seconds. The `camera`
 * field is an { from, to } pair of CSS transform strings applied to
 * the scene container over the full shot.
 */
const SHOTS = [
  {
    name: 'Garden — wake',
    sceneName: 'The Sleeping Garden',
    typeText: 'wake now, sleeping roots',
    // Gentle push-in toward the tree — opens the trailer with motion
    // that feels intentional, not eager.
    camera: {
      from: 'scale(1) translate(0, 0)',
      to:   'scale(1.18) translate(-3%, -2%)',
    },
  },
  {
    name: 'Well — water',
    sceneName: 'The Dry Well',
    typeText: 'deep water, remember your name',
    // Push down into the cavern as the water rises — the cross-section
    // is the wow, so frame travels deeper through the shot.
    camera: {
      from: 'scale(1.04) translate(0, -2%)',
      to:   'scale(1.34) translate(0, -14%)',
    },
  },
  {
    name: 'Stones — rise',
    sceneName: 'The Spirit Stones',
    typeText: 'stand tall again, guardians',
    // Big pull-back as stones rise — gives them physical scale.
    camera: {
      from: 'scale(1.28) translate(0, 6%)',
      to:   'scale(0.98) translate(0, -1%)',
    },
  },
];

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Pre-register a black overlay so it lands as early as possible on
 *  every navigation — before React mounts and before any dormant-world
 *  art can render. Also hides the dev panel via CSS so the F2 toggle
 *  driving jumpToScene never paints visibly. Buttons inside the panel
 *  remain queryable and clickable (we use force-click). */
async function preInjectFade(context) {
  await context.addInitScript(() => {
    // CSS injected as the first thing — paints html black and hides
    // the dev panel even before React mounts. The dev panel uses
    // inline styles `position: fixed` + `z-index: 9999` + `top: 8`,
    // a fingerprint we can target without touching its component code.
    const style = document.createElement('style');
    style.textContent = `
      html, body { background: #000 !important; }
      [style*="z-index: 9999"][style*="position: fixed"][style*="top: 8"] {
        opacity: 0 !important;
        pointer-events: auto;
      }
    `;
    (document.head || document.documentElement).appendChild(style);

    const inject = () => {
      if (document.getElementById('trailer-fade')) return;
      document.documentElement.style.background = '#000';
      if (!document.body) return;
      const el = document.createElement('div');
      el.id = 'trailer-fade';
      // !important + max z-index so nothing in the React app's CSS can
      // win against this. Explicit vw/vh because some flex/grid
      // contexts don't resolve `inset:0` on a fixed element until
      // layout's finished.
      el.setAttribute('style', [
        'position:fixed!important',
        'top:0!important', 'left:0!important',
        'width:100vw!important', 'height:100vh!important',
        'background:#000!important',
        'z-index:2147483647!important',
        'opacity:1!important',
        'pointer-events:none!important',
        'transition:opacity 0s linear',
      ].join(';'));
      document.body.appendChild(el);
    };
    inject();
    document.addEventListener('DOMContentLoaded', inject);
    const obs = new MutationObserver(() => {
      if (document.body && !document.getElementById('trailer-fade')) {
        inject();
        obs.disconnect();
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  });
}

async function fade(page, target, durationMs) {
  await page.evaluate(
    ({ target, durationMs }) => {
      const el = document.getElementById('trailer-fade');
      if (!el) return;
      // The overlay's inline style sets opacity with !important so the
      // React app's CSS can never accidentally hide it. setProperty
      // preserves the priority flag while still letting us animate.
      el.style.setProperty('transition', `opacity ${durationMs}ms ease-out`, 'important');
      el.style.setProperty('opacity', String(target), 'important');
    },
    { target, durationMs }
  );
  await sleep(durationMs);
}

/** Map of scene title -> level index, mirroring src/levels.ts. */
const TITLE_TO_LVL = {
  'The Sleeping Garden': 0,
  'The Dark Cottage': 1,
  'The Night Sky': 2,
  'The Dry Well': 3,
  'The Forgotten Bridge': 4,
  'The Whispering Library': 5,
  'The Spirit Stones': 6,
  'The Moonlit Sanctum': 7,
  'The Great Tree': 8,
  'The Waking World': 9,
};

async function jumpToScene(page, name) {
  // App.tsx exposes the Zustand store on window in ?dev mode. We use
  // it to call jumpToLevel directly — no F2 toggle, no DevPanel UI,
  // no visibility race during the cut between shots.
  await page.evaluate(({ name, map }) => {
    const w = /** @type {any} */ (window);
    const store = w.__inkwoodStore?.getState();
    const lvl = map[name];
    if (store && lvl !== undefined) store.jumpToLevel(lvl);
  }, { name, map: TITLE_TO_LVL });
  await sleep(180);
}

async function applyCamera(page, { from, to }, durationMs) {
  await page.evaluate(
    ({ from, to, durationMs }) => {
      const sel = document.querySelector('[class*="sceneContainer"]');
      if (!sel) return;
      const el = sel;
      el.style.transition = 'none';
      el.style.transformOrigin = 'center center';
      el.style.transform = from;
      void el.offsetWidth; // force reflow so transition applies
      el.style.transition = `transform ${durationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      el.style.transform = to;
    },
    { from, to, durationMs }
  );
}

async function resetCamera(page) {
  await page.evaluate(() => {
    const el = document.querySelector('[class*="sceneContainer"]');
    if (!el) return;
    el.style.transition = 'none';
    el.style.transform = 'none';
  });
}

async function runShot(page, shot) {
  // 1. Set the scene behind the black overlay.
  await jumpToScene(page, shot.sceneName);
  await resetCamera(page);
  await page.click('body');
  await sleep(80);

  // 2. Fade up from black; kick off camera move covering the full shot.
  applyCamera(page, shot.camera, SHOT_DURATION * 1000);
  await fade(page, 0, FADE_IN * 1000);

  // 3. Wait the lead-in beat, then type.
  const leadAfterFade = Math.max(0, TYPE_LEAD * 1000 - FADE_IN * 1000);
  await sleep(leadAfterFade);
  await page.keyboard.type(shot.typeText, { delay: TYPE_SPEED });

  // 4. Hold whatever's left of the shot, then fade to black.
  const elapsed = FADE_IN * 1000 + leadAfterFade + shot.typeText.length * TYPE_SPEED;
  const holdBeforeFadeOut = SHOT_DURATION * 1000 - elapsed - FADE_OUT * 1000;
  if (holdBeforeFadeOut > 0) await sleep(holdBeforeFadeOut);
  await fade(page, 1, FADE_OUT * 1000);
}

async function showTitleCard(page) {
  // We're already on black at this point; mount the title behind it
  // and fade up.
  await page.evaluate(() => {
    const overlay = document.createElement('div');
    overlay.id = 'trailer-title';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'background:#050505',
      'z-index:99997', 'display:flex', 'align-items:center',
      'justify-content:center', 'flex-direction:column', 'gap:1.2rem',
      'color:#f0e8c8', 'font-family:Georgia, "Times New Roman", serif',
    ].join(';');
    overlay.innerHTML = `
      <h1 style="font-size:5rem; font-weight:normal; letter-spacing:0.25em; margin:0;">Inkwood</h1>
      <p style="font-size:1rem; color:#b8a880; letter-spacing:0.2em; font-style:italic; margin:0;">a typing game</p>
    `;
    document.body.appendChild(overlay);
  });
  // Fade the trailer-fade overlay (above title) out, revealing title.
  await fade(page, 0, FADE_IN * 1000);
  await sleep((TITLE_DURATION - FADE_IN - FADE_OUT) * 1000);
  await fade(page, 1, FADE_OUT * 1000);
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: VIDEO_SIZE,
    recordVideo: { dir: OUTPUT_DIR, size: VIDEO_SIZE },
  });

  // Register the black overlay so it's there from the very first
  // frame of every page load — before React renders the intro.
  await preInjectFade(context);

  const page = await context.newPage();
  // Paint the about:blank page solid black immediately so the
  // recording has nothing white to capture before navigation.
  await page.setContent(
    '<!doctype html><html style="background:#000;height:100%"><body style="margin:0;background:#000;height:100%"></body></html>',
  );
  await sleep(150);

  await page.goto(BASE_URL + '?dev', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(600);

  // Belt-and-suspenders: explicitly (re-)create the overlay after the
  // page has fully settled. addInitScript should have done this already,
  // but if any race left it missing, this guarantees presence.
  await page.evaluate(() => {
    let el = document.getElementById('trailer-fade');
    if (!el) {
      el = document.createElement('div');
      el.id = 'trailer-fade';
      document.body.appendChild(el);
    }
    el.setAttribute('style', [
      'position:fixed!important',
      'top:0!important', 'left:0!important',
      'width:100vw!important', 'height:100vh!important',
      'background:#000!important',
      'z-index:2147483647!important',
      'opacity:1!important',
      'pointer-events:none!important',
      'transition:opacity 0s linear',
    ].join(';'));
  });

  // Hold guaranteed black at start so any flicker during page boot
  // is comfortably inside the pre-roll window we'll crop out.
  await sleep(PRE_ROLL * 1000);

  for (const shot of SHOTS) {
    console.log(`→ ${shot.name} (${SHOT_DURATION}s)`);
    await runShot(page, shot);
  }

  console.log(`→ Title card (${TITLE_DURATION}s)`);
  await resetCamera(page);
  await showTitleCard(page);

  await page.close();
  await context.close();

  // Rename the auto-named .webm (Playwright emits "page@<hash>.webm")
  // to a clean timestamped path. Sort by mtime so we always pick the
  // recording from the run that just finished — not the alphabetically
  // last file in the directory.
  const files = readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith('.webm') && f.startsWith('page@'))
    .map((f) => ({ f, mtime: statSync(resolve(OUTPUT_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  let silentTrailerPath = null;
  if (files.length > 0) {
    const latest = files[0].f;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const target = `trailer-${stamp}.webm`;
    silentTrailerPath = resolve(OUTPUT_DIR, target);
    renameSync(resolve(OUTPUT_DIR, latest), silentTrailerPath);
    console.log(`✔ ${silentTrailerPath}`);
  }

  await browser.close();

  // ── Audio: render the intro drone via ffmpeg, mux with the silent
  //    trailer to produce the final shipping artifact at public/trailer.webm.
  if (silentTrailerPath) {
    muxAudio(silentTrailerPath);
  }
}

/** Three-pad ambient mirroring the game's per-act tonal shifts:
 *  Act I (Garden, C root), Act II (Well, E2 root), Act III (Stones,
 *  D root). Each pad is a chord of sine partials matching audio.ts's
 *  ACT_AMBIENTS table, low-passed and tremolo'd; pads cross-fade into
 *  each other on the shot boundaries so the audio progresses through
 *  the trailer instead of holding one drone the whole time. */
function muxAudio(trailerWebm) {
  const padWavs = [
    resolve(OUTPUT_DIR, 'pad-act1.wav'),
    resolve(OUTPUT_DIR, 'pad-act2.wav'),
    resolve(OUTPUT_DIR, 'pad-act3.wav'),
    resolve(OUTPUT_DIR, 'pad-act4.wav'),
  ];
  const mixWav = resolve(OUTPUT_DIR, 'pad-mix.wav');
  const finalWebm = resolve('public', 'trailer.webm');

  // Query the actual video duration. We'll trim PRE_ROLL seconds of
  // start-of-recording black during mux, so audio is rendered to match
  // the *post-crop* video length and aligned with the cropped timeline.
  const probe = spawnSync('ffprobe', [
    '-i', trailerWebm,
    '-show_entries', 'format=duration',
    '-v', 'quiet',
    '-of', 'csv=p=0',
  ], { encoding: 'utf8' });
  const videoSec = parseFloat(probe.stdout?.trim()) || (PRE_ROLL + SHOTS.length * SHOT_DURATION + TITLE_DURATION);
  const trimmedSec = videoSec - PRE_ROLL;
  const totalSec = trimmedSec + 0.2;
  const shotMs = SHOT_DURATION;

  // Per-act chord definitions, transcribed from audio.ts ACT_AMBIENTS.
  // Weights bias the fundamental and slightly soften the upper partials.
  const ACTS = [
    { // Act I — Garden — C major triad over C3
      root: 130.81, ratios: [1, 1.25, 1.5, 2],
      weights: [1.0, 0.6, 0.55, 0.4],
      filter: 280, lfo: 0.06,
    },
    { // Act II — Well — E2 with a 1.2 partial for that "minor 2nd"
      // tension Cody mapped to Discovery
      root: 82.41, ratios: [1, 1.2, 1.5, 2, 2.4],
      weights: [1.0, 0.45, 0.55, 0.45, 0.3],
      filter: 200, lfo: 0.04,
    },
    { // Act III — Stones — D root with the shimmering 9th from
      // 1.335 partial and an octave reach
      root: 146.83, ratios: [1, 1.335, 1.5, 2, 3],
      weights: [1.0, 0.55, 0.55, 0.4, 0.25],
      filter: 400, lfo: 0.08,
    },
    { // Act IV — Title card — G2 root, the Restoration bed.
      // Closes the trailer warmly under the wordmark.
      root: 98, ratios: [1, 1.25, 1.5, 2, 3],
      weights: [1.0, 0.6, 0.5, 0.4, 0.25],
      filter: 320, lfo: 0.05,
    },
  ];

  console.log('→ Rendering act pads (ffmpeg)…');
  for (let i = 0; i < ACTS.length; i++) {
    const act = ACTS[i];
    // Each pad is rendered to cover its shot plus a 2s tail/lead for
    // cross-fading.
    const padDur = shotMs + 4;
    const inputs = act.ratios.map((r) => [
      '-f', 'lavfi', '-i', `sine=frequency=${(act.root * r).toFixed(3)}:duration=${padDur}`,
    ]).flat();
    const mixIns = act.ratios.map((_, j) => `[${j}]`).join('');
    const filter = [
      `${mixIns}amix=inputs=${act.ratios.length}:duration=longest:weights=${act.weights.join(' ')}`,
      `lowpass=f=${act.filter}`,
      `tremolo=f=${Math.max(0.1, act.lfo).toFixed(2)}:d=0.18`,
      `volume=0.5`,
      `afade=t=in:d=2`,
      `afade=t=out:st=${(padDur - 2).toFixed(2)}:d=2`,
    ].join(',');
    const r = spawnSync('ffmpeg', [
      '-y',
      ...inputs,
      '-filter_complex', filter,
      '-ar', '44100', '-ac', '2',
      padWavs[i],
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
    if (r.status !== 0) {
      console.error(`pad-act${i + 1} render failed:`, r.stderr?.toString().slice(-400));
      return;
    }
  }

  // Place each pad at its shot's start (with a 1s pre-roll lead-in
  // so the pad blooms before the scene visuals do). Pads run ~12s
  // and overlap by ~4s, so they cross-fade through each scene. The
  // Act IV pad covers the title card.
  console.log('→ Mixing pads with timed cross-fades…');
  const offsets = [
    0,
    (shotMs - 1) * 1000,
    (2 * shotMs - 1) * 1000,
    (3 * shotMs - 1) * 1000,
  ];
  const padIns = padWavs.map((_, i) => `[d${i}]`).join('');
  const mixFilter = [
    ...padWavs.map((_, i) => `[${i}]adelay=${offsets[i]}|${offsets[i]}[d${i}]`),
    `${padIns}amix=inputs=${padWavs.length}:duration=longest:weights=1 1 1 1[mixed]`,
    `[mixed]volume=0.85,afade=t=out:st=${(totalSec - 2).toFixed(2)}:d=2[out]`,
  ].join(';');
  const padInputs = padWavs.map((p) => ['-i', p]).flat();
  const mix = spawnSync('ffmpeg', [
    '-y',
    ...padInputs,
    '-filter_complex', mixFilter,
    '-map', '[out]',
    '-ar', '44100', '-ac', '2',
    mixWav,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (mix.status !== 0) {
    console.error('pad mix failed:', mix.stderr?.toString().slice(-400));
    return;
  }

  console.log('→ Muxing audio onto trailer (crop pre-roll)…');
  // Trim PRE_ROLL seconds off the start of the silent video so any
  // page-boot flicker is gone. Audio was rendered with the same
  // PRE_ROLL gap baked in, so no offset realignment needed.
  const muxStep = spawnSync('ffmpeg', [
    '-y',
    '-ss', String(PRE_ROLL), '-i', trailerWebm,
    '-i', mixWav,
    '-c:v', 'libvpx-vp9',
    '-crf', '32',
    '-b:v', '0',
    '-c:a', 'libopus',
    '-b:a', '96k',
    '-shortest',
    finalWebm,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (muxStep.status !== 0) {
    console.error('ffmpeg mux failed:', muxStep.stderr?.toString().slice(-400));
    return;
  }

  // Tidy: drop the intermediate pad wavs.
  for (const w of [...padWavs, mixWav]) {
    try { unlinkSync(w); } catch { /* */ }
  }
  // Keep an archival copy alongside the silent recording.
  copyFileSync(finalWebm, trailerWebm.replace(/\.webm$/, '-with-audio.webm'));

  console.log(`✔ ${finalWebm}`);

  // Also encode an .mp4 alongside the .webm for platforms that won't
  // autoplay webm (Twitter cards in particular). Same content, just
  // re-wrapped: H.264 video + AAC audio.
  const finalMp4 = resolve('public', 'trailer.mp4');
  console.log('→ Encoding mp4 alongside webm…');
  const mp4 = spawnSync('ffmpeg', [
    '-y',
    '-i', finalWebm,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'medium',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    finalMp4,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (mp4.status !== 0) {
    console.error('mp4 encode failed:', mp4.stderr?.toString().slice(-400));
  } else {
    console.log(`✔ ${finalMp4}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
