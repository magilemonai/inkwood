/**
 * Frame-by-frame sweep of a scene under the Inkwood 2 gate.
 *
 * One browser, one page per scene. Jumps to the scene through the dev
 * panel, types its canonical phrases character by character, and
 * screenshots every time level progress crosses a step, plus the breath
 * after each phrase completes and the first frame of the next phrase.
 * Then composes a labeled contact sheet so a whole scene's animation
 * can be judged at a glance, and the individual frames are there for a
 * closer look.
 *
 * Usage:
 *   node scripts/sweep.mjs <sceneIndex|all> [--step=5] [--port=4173] [--mobile] [--params=v2]
 *
 * Output: screenshots/sweep/<idx>-<name>/f-<pct>.png, b-<n>.png (breath),
 *         n-<n>.png (next phrase start), and screenshots/sweep/<idx>-<name>-sheet.png
 */

import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, existsSync, readdirSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';

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
const STEP = parseInt(flagValue('step', '5')) || 5;
const PORT = parseInt(flagValue('port', '4173')) || 4173;
const MOBILE = flags.includes('--mobile');
const PARAMS = flagValue('params', 'v2').split(',').filter(Boolean);
const LEVELS_FILE = PARAMS.includes('v2') ? './src/levels2.ts' : './src/levels.ts';
const BASE_URL = `http://localhost:${PORT}/`;
const OUT = './screenshots/sweep';

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

async function sweep(browser, idx) {
  const scene = SCENES[idx];
  const safe = scene.name.replace(/\s+/g, '_');
  const dir = `${OUT}/${idx}-${safe}${MOBILE ? '-mobile' : ''}`;
  mkdirSync(dir, { recursive: true });
  const context = await browser.newContext(
    MOBILE
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
      : { viewport: { width: 1400, height: 800 } },
  );
  const page = await context.newPage();
  const extra = (PARAMS.length ? '&' + PARAMS.join('&') : '') + '&glowprobe=off';
  await page.goto(BASE_URL + '?dev&canonical' + extra, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.keyboard.press('F2'); await page.waitForTimeout(300);
  for (const btn of await page.$$('button')) {
    if ((await btn.textContent())?.includes(scene.name)) { await btn.click(); break; }
  }
  await page.waitForTimeout(300);
  await page.keyboard.press('F2'); await page.waitForTimeout(300);
  await page.click('body'); await page.waitForTimeout(800);

  const frames = []; // { file, label }
  const shot = async (file, label) => {
    await page.screenshot({ path: `${dir}/${file}`, fullPage: false });
    frames.push({ file, label });
  };

  const total = scene.prompts.length;
  const thresholds = [];
  for (let t = 0; t <= 100; t += STEP) thresholds.push(t);
  if (thresholds[thresholds.length - 1] !== 100) thresholds.push(100);
  let ti = 0;
  await shot('f-000.png', '0%');
  ti = 1;

  for (let pi = 0; pi < total; pi++) {
    const phrase = scene.prompts[pi];
    for (let ci = 0; ci < phrase.length; ci++) {
      await page.keyboard.type(phrase[ci], { delay: 8 });
      const pct = Math.round(((pi + (ci + 1) / phrase.length) / total) * 100);
      while (ti < thresholds.length && pct >= thresholds[ti]) {
        await page.waitForTimeout(120);
        await shot(`f-${String(thresholds[ti]).padStart(3, '0')}.png`, `${thresholds[ti]}%`);
        ti++;
      }
    }
    // Phrase complete: the breath, then the first frame of the next phrase.
    await page.waitForTimeout(700);
    await shot(`b-${pi + 1}.png`, `breath ${pi + 1}`);
    if (pi + 1 < total) {
      await page.waitForTimeout(1300);
      await shot(`n-${pi + 2}.png`, `phrase ${pi + 2} start`);
    }
  }

  // Contact sheet: an HTML grid of the frames in capture order.
  const cols = 4;
  const tileW = MOBILE ? 200 : 340;
  const tiles = frames.map((f) => {
    const data = readFileSync(`${dir}/${f.file}`).toString('base64');
    return `<figure><img src="data:image/png;base64,${data}"><figcaption>${f.label}</figcaption></figure>`;
  }).join('');
  const html = `<!doctype html><html><head><style>
    body{margin:0;background:#111;color:#ccc;font:12px Georgia,serif}
    h1{font-size:14px;margin:8px 10px;color:#ddd;font-weight:normal}
    .grid{display:grid;grid-template-columns:repeat(${cols},${tileW}px);gap:8px;padding:8px}
    figure{margin:0}img{width:${tileW}px;display:block;border:1px solid #333}
    figcaption{padding:2px 0 0;color:#aaa}
  </style></head><body><h1>${idx} · ${scene.name} · ${scene.prompts.join(' / ')}</h1><div class="grid">${tiles}</div></body></html>`;
  const sheetPath = `${OUT}/${idx}-${safe}${MOBILE ? '-mobile' : ''}-sheet.html`;
  writeFileSync(sheetPath, html);
  const sheetPage = await context.newPage();
  await sheetPage.setViewportSize({ width: cols * (tileW + 8) + 24, height: 900 });
  await sheetPage.goto('file://' + resolve(sheetPath));
  await sheetPage.waitForTimeout(300);
  const sheetPng = `${OUT}/${idx}-${safe}${MOBILE ? '-mobile' : ''}-sheet.png`;
  await sheetPage.screenshot({ path: sheetPng, fullPage: true });
  await context.close();
  console.log(`Sheet: ${sheetPng} (${frames.length} frames)`);
}

const browser = await chromium.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const which = args[0] ?? 'all';
const indices = which === 'all' ? SCENES.map((_, i) => i) : which.split(',').map((n) => parseInt(n));
for (const i of indices) await sweep(browser, i);
await browser.close();
