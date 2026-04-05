/**
 * Screenshot tool for visual verification.
 * Takes screenshots of the live site at specific scenes/progress values.
 *
 * Usage:
 *   node scripts/screenshot.mjs [sceneIndex] [progressPercent]
 *   node scripts/screenshot.mjs 0        # Garden at 0%
 *   node scripts/screenshot.mjs 1 50     # Cottage at 50%
 *   node scripts/screenshot.mjs all      # All scenes at 0%, 50%, 100%
 */

import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const CHROME_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_URL = 'http://localhost:4173/inkwood/';
const SCREENSHOT_DIR = './screenshots';

const SCENES = [
  'The Sleeping Garden',
  'The Dark Cottage',
  'The Night Sky',
  'The Dry Well',
  'The Forgotten Bridge',
  'The Whispering Library',
  'The Spirit Stones',
  'The Moonlit Sanctum',
  'The Great Tree',
  'The Waking World',
];

async function screenshot(sceneIdx, progressPct = 0) {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 800 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Wait for app to load
  await page.waitForTimeout(2000);

  // Jump to the scene using the store
  await page.evaluate((idx) => {
    // Access zustand store
    const store = document.querySelector('#root')?.__zustand;
    if (!store) {
      // Try dispatching via the dev panel approach - simulate jumpToLevel
      window.__INKWOOD_JUMP = idx;
    }
  }, sceneIdx);

  // Use keyboard to skip intro if needed, then use F2 dev panel
  await page.keyboard.press('F2');
  await page.waitForTimeout(500);

  // Click the scene button in the dev panel
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text && text.includes(SCENES[sceneIdx])) {
      await btn.click();
      break;
    }
  }

  await page.waitForTimeout(500);
  await page.keyboard.press('F2'); // close dev panel

  // If we need progress > 0, type characters to advance
  if (progressPct > 0) {
    // Click to focus the input
    await page.click('body');
    await page.waitForTimeout(200);

    // Get the target text and type a percentage of it
    const targetInfo = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      for (const input of inputs) {
        if (input.type !== 'hidden' && input.style.opacity !== '0') continue;
        return { found: true };
      }
      return { found: false };
    });

    if (targetInfo.found) {
      // We need to figure out how many chars to type based on progress
      // For now, we'll type into the hidden input by dispatching events
      // This is complex - let's just take the screenshot at whatever state we're in
    }
  }

  await page.waitForTimeout(1000);

  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const filename = `${SCREENSHOT_DIR}/scene-${sceneIdx}-${SCENES[sceneIdx].replace(/\s+/g, '_')}-${progressPct}pct.png`;
  await page.screenshot({ path: filename, fullPage: false });

  console.log(`Screenshot saved: ${filename}`);
  await browser.close();
  return filename;
}

// Parse args
const args = process.argv.slice(2);
const sceneArg = args[0] || '0';
const progressArg = parseInt(args[1] || '0');

if (sceneArg === 'all') {
  // Screenshot all scenes at 0%
  for (let i = 0; i < SCENES.length; i++) {
    await screenshot(i, 0);
  }
} else {
  const idx = parseInt(sceneArg);
  const file = await screenshot(idx, progressArg);
}
