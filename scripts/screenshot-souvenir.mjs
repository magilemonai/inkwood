/**
 * One-off verification script: renders the Souvenir postcard visibly
 * and saves a PNG so we can eyeball it. Not wired into regular
 * development flow. Run with: node scripts/screenshot-souvenir.mjs
 */

import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const CHROME_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_URL = 'http://localhost:4173/inkwood/?dev';
const OUT_DIR = './screenshots';

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1300, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

await page.goto(BASE_URL, { waitUntil: 'networkidle' });

// Jump straight to outro via the Zustand store (exposed through dev panel).
await page.keyboard.press('F2');
await page.waitForSelector('button:has-text("outro")', { timeout: 5000 });
await page.click('button:has-text("outro")');

// Wait for the hidden Souvenir SVG to be present, then unhide it.
await page.waitForSelector('svg[viewBox="0 0 1200 800"]', { timeout: 5000 });

// Surface the hidden souvenir so we can screenshot it.
await page.evaluate(() => {
  const svg = document.querySelector('svg[viewBox="0 0 1200 800"]');
  if (!svg) return;
  const wrapper = svg.parentElement;
  if (wrapper) {
    wrapper.style.position = 'fixed';
    wrapper.style.left = '50%';
    wrapper.style.top = '50%';
    wrapper.style.transform = 'translate(-50%, -50%)';
    wrapper.style.zIndex = '99999';
    wrapper.style.background = '#0a0806';
  }
});

await page.waitForTimeout(200);

const svgHandle = await page.$('svg[viewBox="0 0 1200 800"]');
if (!svgHandle) throw new Error('Souvenir SVG not found');

await svgHandle.screenshot({ path: `${OUT_DIR}/souvenir.png` });
console.log('Saved screenshots/souvenir.png');

await browser.close();
