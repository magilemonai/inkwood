/**
 * Motion check: record a scene being typed at a realistic cadence and lay
 * the video out as a frame strip, so an animation is judged the way the
 * eye meets it (frames in quick succession) rather than as sampled stills.
 *
 * Usage:
 *   node scripts/motion.mjs <sceneIndex> [--from=5] [--to=45] [--cadence=170] [--fps=10] [--port=4173] [--params=v2]
 *
 * Types the canonical phrases with `cadence` ms between letters, recording
 * video from the moment level progress passes `from`% until it passes
 * `to`%. Then ffmpeg extracts `fps` frames per second of that window and a
 * contact sheet is composed at screenshots/motion/<idx>-<name>-strip.png.
 * Individual frames land beside it. Needs ffmpeg on PATH.
 */

import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, existsSync, readdirSync, writeFileSync, renameSync, rmSync } from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';
import { execSync } from 'child_process';

function findChrome() {
  const macCache = resolve(homedir(), 'Library/Caches/ms-playwright');
  if (existsSync(macCache)) {
    for (const v of readdirSync(macCache).filter((d) => d.startsWith('chromium-')).sort().reverse()) {
      const p = resolve(macCache, v, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
      if (existsSync(p)) return p;
    }
  }
  const linuxCache = resolve(homedir(), '.cache/ms-playwright');
  if (existsSync(linuxCache)) {
    for (const v of readdirSync(linuxCache).filter((d) => d.startsWith('chromium-')).sort().reverse()) {
      const p = resolve(linuxCache, v, 'chrome-linux/chrome');
      if (existsSync(p)) return p;
    }
  }
  throw new Error('No Playwright Chromium found. Run `npx playwright install chromium`.');
}

const argv = process.argv.slice(2);
const flags = argv.filter((a) => a.startsWith('--'));
const args = argv.filter((a) => !a.startsWith('--'));
const flagValue = (name, fallback) =>
  (flags.find((f) => f.startsWith(`--${name}=`)) ?? `--${name}=${fallback}`).slice(name.length + 3);
const FROM = parseFloat(flagValue('from', '0'));
const TO = parseFloat(flagValue('to', '100'));
const CADENCE = parseInt(flagValue('cadence', '170')) || 170;
const FPS = parseInt(flagValue('fps', '10')) || 10;
const PORT = parseInt(flagValue('port', '4173')) || 4173;
const PARAMS = flagValue('params', 'v2').split(',').filter(Boolean);
const LEVELS_FILE = PARAMS.includes('v2') ? './src/levels2.ts' : './src/levels.ts';
const BASE_URL = `http://localhost:${PORT}/`;
const OUT = './screenshots/motion';

function loadScenes() {
  const src = readFileSync(LEVELS_FILE, 'utf8');
  const scenes = [];
  const re = /title:\s*"([^"]+)"[\s\S]*?prompts:\s*\[([^\]]+)\]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    scenes.push({ name: m[1], prompts: Array.from(m[2].matchAll(/"([^"]+)"/g)).map((x) => x[1]) });
  }
  return scenes;
}

const SCENES = loadScenes();
const idx = parseInt(args[0] ?? '0');
const scene = SCENES[idx];
const safe = scene.name.replace(/\s+/g, '_');
const dir = `${OUT}/${idx}-${safe}`;
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const videoDir = `${dir}/video`;
mkdirSync(videoDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({
  viewport: { width: 1400, height: 800 },
  recordVideo: { dir: videoDir, size: { width: 1400, height: 800 } },
});
const tCtx = Date.now(); // the recording starts here
const page = await context.newPage();
const extra = (PARAMS.length ? '&' + PARAMS.join('&') : '') + '&glowprobe=off';
await page.goto(BASE_URL + '?dev&canonical' + extra, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.keyboard.press('F2'); await page.waitForTimeout(300);
for (const btn of await page.$$('button')) {
  if ((await btn.textContent())?.includes(scene.name)) { await btn.click(); break; }
}
await page.waitForTimeout(300);
await page.keyboard.press('F2'); await page.waitForTimeout(300);
await page.click('body'); await page.waitForTimeout(600);

// Type. Note the wall-clock moments the window opens and closes so the
// frames can be cut from the recording.
const t0 = Date.now();
let tFrom = null, tTo = null;
const total = scene.prompts.length;
outer: for (let pi = 0; pi < total; pi++) {
  const phrase = scene.prompts[pi];
  for (let ci = 0; ci < phrase.length; ci++) {
    const before = ((pi + ci / phrase.length) / total) * 100;
    if (before >= TO) { tTo = Date.now(); break outer; }
    if (tFrom === null && before >= FROM) tFrom = Date.now();
    await page.keyboard.type(phrase[ci]);
    await page.waitForTimeout(CADENCE);
  }
  if (pi + 1 < total) await page.waitForTimeout(1700); // the breath + phrase swap
}
if (tFrom === null) tFrom = t0;
if (tTo === null) { await page.waitForTimeout(800); tTo = Date.now(); }
await page.waitForTimeout(400);
await context.close();
await browser.close();

const webm = readdirSync(videoDir).find((f) => f.endsWith('.webm'));
const video = `${videoDir}/${webm}`;
// The recording started at context creation; cut the window from there.
const startS = Math.max(0, (tFrom - tCtx) / 1000);
const durS = Math.max(0.5, (tTo - tFrom) / 1000 + 0.6);
execSync(`ffmpeg -loglevel error -y -ss ${startS.toFixed(2)} -t ${durS.toFixed(2)} -i "${video}" -vf fps=${FPS} "${dir}/frame-%03d.png"`);
const frames = readdirSync(dir).filter((f) => f.startsWith('frame-')).sort();

// Strip: 6 columns of small tiles, in order; the eye can scan a row as motion.
const cols = 6;
const tileW = 228;
const tiles = frames.map((f, i) => {
  const data = readFileSync(`${dir}/${f}`).toString('base64');
  return `<figure><img src="data:image/png;base64,${data}"><figcaption>${(i / FPS).toFixed(1)}s</figcaption></figure>`;
}).join('');
const html = `<!doctype html><html><head><style>
  body{margin:0;background:#111;color:#ccc;font:11px Georgia,serif}
  h1{font-size:13px;margin:8px 10px;color:#ddd;font-weight:normal}
  .grid{display:grid;grid-template-columns:repeat(${cols},${tileW}px);gap:4px;padding:6px}
  figure{margin:0}img{width:${tileW}px;display:block;border:1px solid #333}
  figcaption{padding:1px 0 0;color:#888}
</style></head><body><h1>${idx} · ${scene.name} · ${FROM}%→${TO}% at ${CADENCE}ms/letter, ${FPS} fps, ${frames.length} frames</h1><div class="grid">${tiles}</div></body></html>`;
const sheetHtml = `${dir}/strip.html`;
writeFileSync(sheetHtml, html);
const b2 = await chromium.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox'] });
const p2 = await b2.newPage();
await p2.setViewportSize({ width: cols * (tileW + 4) + 16, height: 900 });
await p2.goto('file://' + resolve(sheetHtml));
await p2.waitForTimeout(300);
const strip = `${OUT}/${idx}-${safe}-strip.png`;
await p2.screenshot({ path: strip, fullPage: true });
await b2.close();
renameSync(video, `${dir}/typing.webm`);
rmSync(videoDir, { recursive: true, force: true });
console.log(`Strip: ${strip} (${frames.length} frames); video: ${dir}/typing.webm`);
