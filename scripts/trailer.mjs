/**
 * Inkwood trailer — v1 recording script.
 *
 * Records a 30-second silent trailer at 1280×720 as a .webm, staged
 * across five gameplay shots plus a title card. None of the climactic
 * beats are revealed (no comets, no full tree bloom, no outro panorama,
 * no complete ley-line network) — every shot ends between 30% and 55%
 * of the scene's progress, so the trailer shows the *mechanic* and the
 * *mood* without spoiling the payoffs.
 *
 * Each shot has a slow camera move (CSS transform on the scene
 * container, which leaves the typing overlay still/centered), so the
 * viewer's eye keeps moving during the shot.
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
 * Post-production: convert to mp4/gif and add music in your editor of
 * choice. Playwright emits .webm natively — ffmpeg can convert:
 *   ffmpeg -i trailer-<timestamp>.webm -c:v libx264 -pix_fmt yuv420p trailer.mp4
 */

import { chromium } from 'playwright-core';
import { mkdirSync, readdirSync, renameSync } from 'fs';
import { resolve } from 'path';

const CHROME_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_URL = 'http://localhost:4173/inkwood/';
const OUTPUT_DIR = './trailer-output';
const VIDEO_SIZE = { width: 1280, height: 720 };

/**
 * Shot definitions. Each runs for `duration` seconds. The `camera`
 * field is an { from, to } pair of CSS transform strings applied to
 * the scene container over the full shot. `typeText` + `typeStart` +
 * `typeSpeed` control when characters arrive.
 */
const SHOTS = [
  {
    name: 'Garden — wake',
    sceneName: 'The Sleeping Garden',
    typeText: 'wake now, sleeping roots',
    typeStart: 0.6,      // seconds into shot
    typeSpeed: 95,       // ms per character
    duration: 5,
    camera: {
      from: 'scale(1) translate(0, 0)',
      to:   'scale(1.22) translate(-2%, -1%)', // drift toward the tree
    },
  },
  {
    name: 'Cottage — candle',
    sceneName: 'The Dark Cottage',
    typeText: 'little candle, burn bright',
    typeStart: 0.6,
    typeSpeed: 95,
    duration: 5,
    camera: {
      from: 'scale(1.05) translate(3%, 0)',
      to:   'scale(1.18) translate(-3%, 0)',   // pan left → right (camera moves right, scene moves left)
    },
  },
  {
    name: 'Well — water',
    sceneName: 'The Dry Well',
    typeText: 'deep water, remember your name',
    typeStart: 0.6,
    typeSpeed: 90,
    duration: 5,
    camera: {
      // Frame low on the cavern — the cross-section's unique view is the
      // water rising underground, so push the camera down so the
      // water-and-runes band owns the middle of the frame. Upper well
      // structure acts as peek-in context at the top edge.
      from: 'scale(1.1) translate(0, -6%)',
      to:   'scale(1.24) translate(0, -10%)',
    },
  },
  {
    name: 'Library — tome',
    sceneName: 'The Whispering Library',
    typeText: 'open, sleeping pages',
    typeStart: 0.6,
    typeSpeed: 100,
    duration: 5,
    camera: {
      from: 'scale(1) translate(0, 0)',
      to:   'scale(1.28) translate(0, 2%)',    // push in + slight down
    },
  },
  {
    name: 'Stones — rise',
    sceneName: 'The Spirit Stones',
    typeText: 'stand tall again, guardians of old',
    typeStart: 0.5,
    typeSpeed: 85,
    duration: 5,
    camera: {
      from: 'scale(1.15) translate(0, 2%)',
      to:   'scale(1.02) translate(0, 0)',     // pull back slightly as stones rise
    },
  },
];

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function jumpToScene(page, name) {
  await page.keyboard.press('F2');
  await sleep(350);
  const btns = await page.$$('button');
  for (const btn of btns) {
    const t = await btn.textContent();
    if (t && t.includes(name)) {
      await btn.click();
      break;
    }
  }
  await sleep(300);
  await page.keyboard.press('F2');
  await sleep(250);
  // Hide the dev panel entirely during recording
  await page.evaluate(() => {
    document.querySelectorAll('[class*="devPanel"]').forEach((el) => {
      (el).style.display = 'none';
    });
  });
}

/**
 * Kick off a smooth CSS transform transition on the scene container.
 * The typing overlay is a sibling node, so it stays put.
 */
async function applyCamera(page, { from, to }, durationMs) {
  await page.evaluate(
    ({ from, to, durationMs }) => {
      const sel = document.querySelector('[class*="sceneContainer"]');
      if (!sel) return;
      const el = sel;
      el.style.transition = 'none';
      el.style.transformOrigin = 'center center';
      el.style.transform = from;
      // Force reflow so transition applies
      void el.offsetWidth;
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
  await jumpToScene(page, shot.sceneName);
  await resetCamera(page);
  // Let the scene render in its initial state briefly
  await sleep(250);
  // Focus the input so typing registers
  await page.click('body');
  await sleep(100);
  // Kick off the camera move
  applyCamera(page, shot.camera, shot.duration * 1000);
  // Wait a beat, then begin typing
  const typeStartMs = shot.typeStart * 1000;
  const shotEndMs = shot.duration * 1000;
  await sleep(typeStartMs);
  await page.keyboard.type(shot.typeText, { delay: shot.typeSpeed });
  // Remaining time in the shot — let the camera finish its move and the
  // scene settle into its final state
  const typedDurationMs = shot.typeText.length * shot.typeSpeed;
  const spent = typeStartMs + typedDurationMs;
  const remaining = shotEndMs - spent;
  if (remaining > 0) await sleep(remaining);
}

async function showTitleCard(page, durationMs) {
  await page.evaluate(() => {
    const overlay = document.createElement('div');
    overlay.id = 'trailer-title';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:#050505',
      'z-index:99999',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'flex-direction:column',
      'gap:1.2rem',
      'opacity:0',
      'transition:opacity 1.2s ease-out',
      'color:#f0e8c8',
      'font-family:Georgia, "Times New Roman", serif',
    ].join(';');
    overlay.innerHTML = `
      <h1 style="font-size:5rem; font-weight:normal; letter-spacing:0.25em; margin:0;">Inkwood</h1>
      <p style="font-size:1rem; color:#b8a880; letter-spacing:0.2em; font-style:italic; margin:0;">a typing game</p>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
  });
  await sleep(durationMs);
  await page.evaluate(() => {
    const el = document.getElementById('trailer-title');
    if (el) el.remove();
  });
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
    recordVideo: {
      dir: OUTPUT_DIR,
      size: VIDEO_SIZE,
    },
  });

  const page = await context.newPage();
  await page.goto(BASE_URL + '?dev', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(800);

  // Give the viewer a beat of pure game atmosphere before typing starts
  // — this also lets the intro drone kick in.
  await sleep(400);

  for (const shot of SHOTS) {
    console.log(`→ ${shot.name} (${shot.duration}s)`);
    await runShot(page, shot);
  }

  // Title card
  console.log('→ Title card (5s)');
  await resetCamera(page);
  await showTitleCard(page, 5000);

  await page.close();
  await context.close();

  // Playwright's recordVideo names files with an auto-generated id.
  // Rename the newest .webm in the dir to a clean timestamped name.
  const files = readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith('.webm'))
    .map((f) => ({ f, t: Date.now() }));
  if (files.length > 0) {
    const latest = files[files.length - 1].f;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const target = `trailer-${stamp}.webm`;
    renameSync(resolve(OUTPUT_DIR, latest), resolve(OUTPUT_DIR, target));
    console.log(`✔ ${resolve(OUTPUT_DIR, target)}`);
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
