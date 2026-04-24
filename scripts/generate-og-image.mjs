/**
 * Generate public/og-image.png for social previews.
 *
 * Captures the Stars scene at 99% progress at 1200×630 (the canonical
 * OG / Twitter summary_large_image aspect) and saves it to public/og-image.png
 * so it ships with the build.
 *
 * Usage:
 *   npm run build && npm run preview &   # preview server at :4173
 *   node scripts/generate-og-image.mjs
 */

import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const CHROME_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_URL = 'http://localhost:4173/inkwood/';
const OUT_PATH = './public/og-image.png';

// Stars level is index 2; two prompts total 45 chars. Typing all of them
// gets us to 99%+ and triggers the full constellation + comet composition.
const SCENE_NAME = 'The Night Sky';
const PROMPTS = [
  'Orion Vega Sirius Lyra',
  'burn again with ancient fire',
];

const browser = await chromium.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

const page = await browser.newPage();
await page.setViewportSize({ width: 1200, height: 630 });
await page.goto(BASE_URL + '?dev&canonical', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

await page.keyboard.press('F2');
await page.waitForTimeout(300);
const buttons = await page.$$('button');
for (const btn of buttons) {
  const text = await btn.textContent();
  if (text && text.includes(SCENE_NAME)) {
    await btn.click();
    break;
  }
}
await page.waitForTimeout(200);
await page.keyboard.press('F2');
await page.waitForTimeout(300);
await page.click('body');
await page.waitForTimeout(200);

for (const prompt of PROMPTS) {
  for (const ch of prompt) {
    await page.keyboard.type(ch, { delay: 8 });
  }
  await page.waitForTimeout(1800);
}
await page.waitForTimeout(600);

mkdirSync('./public', { recursive: true });
await page.screenshot({ path: OUT_PATH, fullPage: false });
console.log(`Saved: ${OUT_PATH}`);

await browser.close();
