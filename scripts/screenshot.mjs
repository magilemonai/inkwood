/**
 * Screenshot tool for visual verification.
 *
 * Usage:
 *   node scripts/screenshot.mjs <sceneIndex> [progressPercent] [flags]
 *   node scripts/screenshot.mjs 0          # Garden at 0%
 *   node scripts/screenshot.mjs 3 50       # Well at 50%
 *   node scripts/screenshot.mjs 3 95       # Well at 95%
 *   node scripts/screenshot.mjs all        # All scenes at 0%
 *
 * Flags:
 *   --mobile              390x844 portrait, touch, DPR 2 (the iPhone check)
 *   --params=glow,feel    extra URL gates to enable (comma-separated)
 *   --settle=1500         extra ms to wait before the shot (animations)
 *
 * Filenames carry the flags: scene-1-The_Dark_Cottage-99pct-mobile-glow+feel.png
 */

import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, existsSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';

/** Locate the Playwright-managed Chromium binary in a user-agnostic
 *  way. Tries the macOS cache, the Linux cache (the original sandbox
 *  layout), and the standard Linux fallback. Picks whichever exists. */
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
const BASE_URL = 'http://localhost:4173/';
const SCREENSHOT_DIR = './screenshots';

/**
 * Parse scenes + prompts out of src/levels.ts so the screenshot script
 * can't drift from the source of truth. Previously this array was
 * duplicated here and had to be hand-synced whenever prompts changed
 * (which already broke the strict-typing flow once during the v12
 * comma audit). Regex is sufficient — levels.ts is plain data, not
 * TypeScript that Node would need to evaluate.
 */
function loadScenesFromLevels() {
  const src = readFileSync('./src/levels.ts', 'utf8');
  const scenes = [];
  // Match each level block: { title: "...", ... prompts: [ ... ], ... }
  const levelRegex = /title:\s*"([^"]+)"[\s\S]*?prompts:\s*\[([^\]]+)\]/g;
  let m;
  while ((m = levelRegex.exec(src)) !== null) {
    const name = m[1];
    const promptsRaw = m[2];
    const prompts = Array.from(promptsRaw.matchAll(/"([^"]+)"/g)).map((x) => x[1]);
    scenes.push({ name, prompts });
  }
  if (scenes.length === 0) {
    throw new Error('Failed to parse any levels from src/levels.ts');
  }
  return scenes;
}

const SCENES = loadScenesFromLevels();

async function screenshot(sceneIdx, progressPct = 0, opts = {}) {
  const { mobile = false, params = [], settle = 0 } = opts;
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    // SwiftShader keeps WebGL available in headless mode (the Glow layer).
    args: ['--no-sandbox', '--disable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });

  const scene = SCENES[sceneIdx];
  const context = await browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
      : { viewport: { width: 1400, height: 800 } },
  );
  const page = await context.newPage();
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.startsWith('[glow]')) console.log('  browser:', text);
  });
  const extra = params.length ? '&' + params.join('&') : '';
  await page.goto(BASE_URL + '?dev&canonical' + extra, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Open dev panel and jump to scene
  await page.keyboard.press('F2');
  await page.waitForTimeout(500);
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text && text.includes(scene.name)) {
      await btn.click();
      break;
    }
  }
  await page.waitForTimeout(500);
  await page.keyboard.press('F2'); // close dev panel
  await page.waitForTimeout(300);

  // Type characters to reach desired progress
  if (progressPct > 0) {
    // Click to focus
    await page.click('body');
    await page.waitForTimeout(200);

    // Calculate total chars across all prompts
    const allChars = scene.prompts.join('');
    const totalChars = allChars.length;
    const charsToType = Math.floor(totalChars * (progressPct / 100));

    let typed = 0;
    for (const prompt of scene.prompts) {
      for (const char of prompt) {
        if (typed >= charsToType) break;
        await page.keyboard.type(char, { delay: 10 });
        typed++;
      }
      if (typed >= charsToType) break;
      // Wait for prompt completion + breathing pause
      await page.waitForTimeout(2000);
    }
    await page.waitForTimeout(500);
  }
  if (settle > 0) await page.waitForTimeout(settle);

  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const safeName = scene.name.replace(/\s+/g, '_');
  const suffix = (mobile ? '-mobile' : '') + (params.length ? '-' + params.join('+') : '');
  const filename = `${SCREENSHOT_DIR}/scene-${sceneIdx}-${safeName}-${progressPct}pct${suffix}.png`;
  await page.screenshot({ path: filename, fullPage: false });
  console.log(`Saved: ${filename}`);

  await browser.close();
  return filename;
}

const argv = process.argv.slice(2);
const flags = argv.filter((a) => a.startsWith('--'));
const args = argv.filter((a) => !a.startsWith('--'));
const opts = {
  mobile: flags.includes('--mobile'),
  params: (flags.find((f) => f.startsWith('--params=')) ?? '--params=').slice('--params='.length).split(',').filter(Boolean),
  settle: parseInt((flags.find((f) => f.startsWith('--settle=')) ?? '--settle=0').slice('--settle='.length)) || 0,
};
const sceneArg = args[0] || '0';
const progressArg = parseInt(args[1] || '0');

if (sceneArg === 'all') {
  for (let i = 0; i < SCENES.length; i++) {
    await screenshot(i, 0, opts);
  }
} else {
  await screenshot(parseInt(sceneArg), progressArg, opts);
}
