import { chromium } from 'playwright-core';
import { mkdirSync, existsSync } from 'fs';

const MAC_PATH = '/Users/cody/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const LINUX_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CHROME = existsSync(MAC_PATH) ? MAC_PATH : LINUX_PATH;
const URL = 'http://localhost:4173/';

mkdirSync('./screenshots', { recursive: true });

// INTRO timelapse — fresh page (clear localStorage so hasCompleted skip doesn't fire)
{
  const b = await chromium.launch({ executablePath: CHROME, headless: true });
  const p = await b.newPage();
  await p.setViewportSize({ width: 1400, height: 800 });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  for (const t of [0, 3, 6, 9, 12, 15]) {
    await p.screenshot({ path: `./screenshots/intro-${t}s.png` });
    if (t < 15) await p.waitForTimeout(3000);
  }
  await b.close();
}

// OUTRO timelapse — jump via dev panel
{
  const b = await chromium.launch({ executablePath: CHROME, headless: true });
  const p = await b.newPage();
  await p.setViewportSize({ width: 1400, height: 800 });
  await p.goto(URL + '?dev', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.keyboard.press('F2');
  await p.waitForTimeout(400);
  const btns = await p.$$('button');
  for (const btn of btns) {
    const t = await btn.textContent();
    if (t && t.trim() === 'outro') { await btn.click(); break; }
  }
  await p.waitForTimeout(400);
  await p.keyboard.press('F2');
  await p.waitForTimeout(400);
  for (const t of [0, 4, 8, 12, 16, 22]) {
    await p.screenshot({ path: `./screenshots/outro-${t}s.png` });
    if (t < 22) await p.waitForTimeout(t === 16 ? 6000 : 4000);
  }
  await b.close();
}

console.log('done');
