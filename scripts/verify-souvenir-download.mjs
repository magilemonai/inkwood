/**
 * End-to-end verification: click "Keep this moment" on the outro screen
 * and confirm the PNG download fires with valid image data.
 */

import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
import { readFileSync, statSync } from 'fs';

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
  acceptDownloads: true,
});
const page = await context.newPage();

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.keyboard.press('F2');
await page.waitForSelector('button:has-text("outro")');
await page.click('button:has-text("outro")');

// The button appears at t=19s in the outro animation. Fast-forward by
// directly calling its handler via keyboard? Better: wait for the
// button to appear, up to 25s.
await page.waitForSelector('button:has-text("Keep this moment")', { timeout: 30000 });

const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 10000 }),
  page.click('button:has-text("Keep this moment")'),
]);

const suggestedName = download.suggestedFilename();
const savePath = `${OUT_DIR}/${suggestedName}`;
await download.saveAs(savePath);

const size = statSync(savePath).size;
const head = readFileSync(savePath).slice(0, 8);
const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;

console.log(`Downloaded: ${savePath}`);
console.log(`Size: ${size} bytes`);
console.log(`Valid PNG header: ${isPng}`);

await browser.close();

if (!isPng || size < 10000) {
  console.error('Verification failed: file does not look like a real PNG.');
  process.exit(1);
}
