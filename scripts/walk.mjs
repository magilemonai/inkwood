/**
 * The garden walk: play the whole game headlessly, start to finish, and
 * report anything that breaks.
 *
 * Usage:
 *   node scripts/walk.mjs [--params=classic] [--port=4173] [--cadence=12] [--mobile]
 *
 * Starts on the title screen with a clean profile, presses Begin, types
 * every phrase of every level at `cadence` ms per letter, continues
 * through level-win cards and act cards, reaches the outro, plants a
 * word, opens Wander, and (Inkwood 2 only) confirms the edition switch
 * is offered. Collects console errors and page errors throughout, takes
 * a screenshot at each screen kind, and exits non-zero on any failure.
 */

import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, existsSync, readdirSync } from 'fs';
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
  throw new Error('No Playwright Chromium found.');
}

const argv = process.argv.slice(2);
const flags = argv.filter((a) => a.startsWith('--'));
const flagValue = (name, fallback) =>
  (flags.find((f) => f.startsWith(`--${name}=`)) ?? `--${name}=${fallback}`).slice(name.length + 3);
const PARAMS = flagValue('params', '').split(',').filter(Boolean);
const PORT = parseInt(flagValue('port', '4173')) || 4173;
const CADENCE = parseInt(flagValue('cadence', '12')) || 12;
const MOBILE = flags.includes('--mobile');
const CLASSIC = PARAMS.includes('classic');
const LEVELS_FILE = CLASSIC ? './src/levels.ts' : './src/levels2.ts';
const OUT = `./screenshots/walk${CLASSIC ? '-classic' : ''}${MOBILE ? '-mobile' : ''}`;
mkdirSync(OUT, { recursive: true });

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

const problems = [];
const browser = await chromium.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext(
  MOBILE
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1400, height: 800 } },
);
const page = await context.newPage();
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(`console.error: ${msg.text().slice(0, 200)}`);
});
page.on('pageerror', (err) => problems.push(`pageerror: ${String(err).slice(0, 200)}`));

const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const extra = (PARAMS.length ? '?' + PARAMS.join('&') + '&' : '?') + 'canonical&glowprobe=off';
await page.goto(`http://localhost:${PORT}/${extra}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await shot('01-intro');

// Begin.
const begin = await page.$(CLASSIC ? 'button:has-text("Begin Inkwood Classic")' : 'button:has-text("Begin Inkwood 2")');
if (!begin) { problems.push('no Begin button on the intro'); }
else { await begin.click(); }
await page.waitForTimeout(900);

for (let li = 0; li < SCENES.length; li++) {
  const scene = SCENES[li];
  // The header names the level; confirm we are where we think we are.
  const title = await page.textContent('body');
  if (!title.includes(scene.name)) problems.push(`level ${li}: expected "${scene.name}" on screen`);
  await page.click('body');
  await page.waitForTimeout(150);
  for (let pi = 0; pi < scene.prompts.length; pi++) {
    const phrase = scene.prompts[pi];
    for (const ch of phrase) { await page.keyboard.type(ch); await page.waitForTimeout(CADENCE); }
    if (pi === 0 && li === 2) await shot(`02-playing-${scene.name.replace(/\s+/g, '_')}`);
    await page.waitForTimeout(1800); // the breath, then the next phrase or the win card
  }
  // After the last phrase: a level-win card, an act card, or the outro.
  await page.waitForTimeout(600);
  const body = await page.textContent('body');
  if (li === 2 || li === 5 || li === 8) {
    if (li === 2) await shot('03-act-card');
    // Act card: auto-advances (7s / 9.5s) or Enter.
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
  } else if (li < SCENES.length - 1) {
    if (!body.includes('Continue')) problems.push(`level ${li}: expected a level-win card with Continue`);
    if (li === 0) await shot('04-level-win');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
  }
}

// Outro.
await page.waitForTimeout(30000);
const outroText = await page.textContent('body');
if (!outroText.includes('The forest remembers')) problems.push('outro text not found after the last level');
await shot('05-outro');
if (!CLASSIC) {
  const input = await page.$('[data-plant-input="1"]');
  if (!input) problems.push('planting input not found on the Inkwood 2 outro');
  else {
    await input.click(); await page.keyboard.type('lantern'); await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    const after = await page.textContent('body');
    if (!after.includes('lantern')) problems.push('planted word not shown after planting');
    await shot('06-planted');
  }
}
// Wander + the edition switch.
const wander = await page.$('button:has-text("Replay any level")');
if (!wander) problems.push('no "Replay any level" on the outro');
else { await wander.click(); await page.waitForTimeout(900); }
const wanderText = await page.textContent('body');
if (!wanderText.includes('Wander the woods')) problems.push('Wander screen not reached');
if (!wanderText.includes('Classic') || !wanderText.includes('Inkwood 2')) problems.push('edition toggle not present');
await shot('07-wander');

await browser.close();
if (problems.length) {
  console.log(`WALK FAILED (${CLASSIC ? 'classic' : 'inkwood 2'}${MOBILE ? ', mobile' : ''}):`);
  for (const p of problems) console.log('  - ' + p);
  process.exit(1);
}
console.log(`WALK CLEAN (${CLASSIC ? 'classic' : 'inkwood 2'}${MOBILE ? ', mobile' : ''}): 10 levels, outro, ${CLASSIC ? '' : 'planting, '}wander, switch offered. Shots in ${OUT}/`);
