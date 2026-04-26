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
import { spawnSync } from 'child_process';

const MAC_PATH = '/Users/cody/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const LINUX_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CHROME_PATH = existsSync(MAC_PATH) ? MAC_PATH : LINUX_PATH;
const BASE_URL = 'http://localhost:4173/inkwood/';
const OUTPUT_DIR = './trailer-output';
const VIDEO_SIZE = { width: 1280, height: 720 };

const TYPE_SPEED = 180;        // ms per character — slow, contemplative
const SHOT_DURATION = 8;       // seconds per gameplay shot
const FADE_IN = 0.9;           // seconds — black to scene at shot start
const FADE_OUT = 0.7;          // seconds — scene to black at shot end
const TYPE_LEAD = 1.0;         // seconds — pause before typing starts
const TITLE_DURATION = 5;      // seconds — title card on-screen

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
    // Slow push-in toward the tree as it grows in.
    camera: {
      from: 'scale(1) translate(0, 0)',
      to:   'scale(1.32) translate(-6%, -3%)',
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

/** Inject a fade-to-black overlay (created once on first use). The
 *  overlay sits above everything including the dev panel, so any
 *  scene-switching work that happens while opacity = 1 is invisible. */
async function ensureFadeOverlay(page) {
  await page.evaluate(() => {
    if (document.getElementById('trailer-fade')) return;
    const el = document.createElement('div');
    el.id = 'trailer-fade';
    el.style.cssText = [
      'position:fixed', 'inset:0', 'background:#000',
      'z-index:99998', 'opacity:1', 'pointer-events:none',
      'transition:opacity 0s linear',
    ].join(';');
    document.body.appendChild(el);
  });
}

async function fade(page, target, durationMs) {
  await page.evaluate(
    ({ target, durationMs }) => {
      const el = document.getElementById('trailer-fade');
      if (!el) return;
      el.style.transition = `opacity ${durationMs}ms ease-out`;
      el.style.opacity = String(target);
    },
    { target, durationMs }
  );
  await sleep(durationMs);
}

async function jumpToScene(page, name) {
  // Happens behind a fully-black overlay — dev panel pop is invisible.
  await page.keyboard.press('F2');
  await sleep(180);
  const btns = await page.$$('button');
  for (const btn of btns) {
    const t = await btn.textContent();
    if (t && t.includes(name)) {
      await btn.click();
      break;
    }
  }
  await sleep(150);
  await page.keyboard.press('F2');
  await sleep(120);
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

  const page = await context.newPage();
  await page.goto(BASE_URL + '?dev', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(600);

  // Mount the fade overlay (starts at opacity 1 — fully black) so the
  // initial dev-panel poke is hidden behind it.
  await ensureFadeOverlay(page);

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

/** Render the in-game intro drone (two sine tones through a low-pass)
 *  and mux it onto the silent trailer. Matches audio.ts's drone:
 *  C2 (65.41 Hz) + G2 (98 Hz), lowpass ~200 Hz, gentle fade in/out. */
function muxAudio(trailerWebm) {
  const droneWav = resolve(OUTPUT_DIR, 'drone.wav');
  const finalWebm = resolve('public', 'trailer.webm');

  // Total trailer length: SHOTS * SHOT_DURATION + TITLE_DURATION + a
  // small tail so the drone doesn't cut hard against the closing fade.
  const totalSec = SHOTS.length * SHOT_DURATION + TITLE_DURATION + 0.5;

  const droneFilter = [
    `[0][1]amix=inputs=2:duration=longest:weights=1 1`,
    `lowpass=f=200`,
    `volume=0.42`,
    // Long fade-in matches the in-game drone's 6-second build.
    `afade=t=in:d=4`,
    // Tail fade-out under the closing title fade.
    `afade=t=out:st=${(totalSec - 2).toFixed(2)}:d=2`,
  ].join(',');

  console.log('→ Rendering drone audio (ffmpeg)…');
  const droneRender = spawnSync('ffmpeg', [
    '-y',
    '-f', 'lavfi', '-i', `sine=frequency=65.41:duration=${totalSec}`,
    '-f', 'lavfi', '-i', `sine=frequency=98:duration=${totalSec}`,
    '-filter_complex', droneFilter,
    '-ar', '44100', '-ac', '2',
    droneWav,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (droneRender.status !== 0) {
    console.error('ffmpeg drone render failed:', droneRender.stderr?.toString().slice(-400));
    return;
  }

  console.log('→ Muxing audio onto trailer…');
  const mux = spawnSync('ffmpeg', [
    '-y',
    '-i', trailerWebm,
    '-i', droneWav,
    '-c:v', 'copy',
    '-c:a', 'libopus',
    '-b:a', '96k',
    '-shortest',
    finalWebm,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (mux.status !== 0) {
    console.error('ffmpeg mux failed:', mux.stderr?.toString().slice(-400));
    return;
  }

  // Tidy: keep the silent trailer in trailer-output for archival; delete
  // the intermediate drone.wav.
  try { unlinkSync(droneWav); } catch { /* */ }
  // Also drop a copy alongside in trailer-output so post-prod has it handy.
  copyFileSync(finalWebm, trailerWebm.replace(/\.webm$/, '-with-audio.webm'));

  console.log(`✔ ${finalWebm}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
