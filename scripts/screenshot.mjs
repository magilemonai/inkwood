/**
 * Screenshot tool for visual verification.
 *
 * Usage:
 *   node scripts/screenshot.mjs <sceneIndex> [progressPercent]
 *   node scripts/screenshot.mjs 0          # Garden at 0%
 *   node scripts/screenshot.mjs 3 50       # Well at 50%
 *   node scripts/screenshot.mjs 3 95       # Well at 95%
 *   node scripts/screenshot.mjs all        # All scenes at 0%
 */

import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const CHROME_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_URL = 'http://localhost:4173/inkwood/';
const SCREENSHOT_DIR = './screenshots';

const SCENES = [
  { name: 'The Sleeping Garden', prompts: ['wake now, sleeping roots', 'bloom, every waiting flower'] },
  { name: 'The Dark Cottage', prompts: ['little candle, burn bright', 'fill every room with warmth'] },
  { name: 'The Night Sky', prompts: ['Orion Vega Sirius Lyra', 'burn again with ancient fire'] },
  { name: 'The Dry Well', prompts: ['deep water, remember your name', 'rise and carry the old songs home'] },
  { name: 'The Forgotten Bridge', prompts: ['stone, recall the crossing', 'spirits, walk the old paths'] },
  { name: 'The Whispering Library', prompts: ['open, sleeping pages', 'speak again, forgotten words'] },
  { name: 'The Spirit Stones', prompts: ['stand tall again, guardians of old', 'remember what was promised'] },
  { name: 'The Moonlit Sanctum', prompts: ['moonlight, gather where spirits convene', 'return to your seats, ancient ones'] },
  { name: 'The Great Tree', prompts: ['roots deeper than memory', 'branches wider than sky', 'awaken, heart of all things'] },
  { name: 'The Waking World', prompts: ['garden bloom, hearth burn bright', 'stars remember, spirits sing', 'the ancient order is restored'] },
];

async function screenshot(sceneIdx, progressPct = 0) {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const scene = SCENES[sceneIdx];
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 800 });
  await page.goto(BASE_URL + '?dev', { waitUntil: 'networkidle' });
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

  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const safeName = scene.name.replace(/\s+/g, '_');
  const filename = `${SCREENSHOT_DIR}/scene-${sceneIdx}-${safeName}-${progressPct}pct.png`;
  await page.screenshot({ path: filename, fullPage: false });
  console.log(`Saved: ${filename}`);

  await browser.close();
  return filename;
}

const args = process.argv.slice(2);
const sceneArg = args[0] || '0';
const progressArg = parseInt(args[1] || '0');

if (sceneArg === 'all') {
  for (let i = 0; i < SCENES.length; i++) {
    await screenshot(i, 0);
  }
} else {
  await screenshot(parseInt(sceneArg), progressArg);
}
