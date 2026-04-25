/**
 * Generate the Open Graph share image (public/og-image.png) at 1200×630.
 *
 * Captures the Stars scene at climax — constellations drawn, moon out,
 * comets streaking — and overlays the rune mark and "Inkwood" wordmark.
 * Skips the typing UI and the Begin button so the share preview reads
 * as "look at this," not "log in."
 *
 * Run with the dev server up at localhost:5173:
 *   npm run dev
 *   node scripts/og-image.mjs
 */

import { chromium } from 'playwright-core';
import { existsSync } from 'fs';

const MAC_PATH = '/Users/cody/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const LINUX_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CHROME_PATH = existsSync(MAC_PATH) ? MAC_PATH : LINUX_PATH;

const BASE_URL = 'http://localhost:5173/inkwood/?dev&canonical';
const OUTPUT = 'public/og-image.png';

// Stars (level 2) canonical prompts: "Orion Vega Sirius Lyra" + "burn again with ancient fire".
// Type fully through prompt 1 and most of prompt 2 to reach ~95% scene progress
// without triggering level advance (which would yank the scene away).
const STARS_PROMPTS = ['Orion Vega Sirius Lyra', 'burn again with ancient fire'];
const STOP_BEFORE_LAST = 3; // leave 3 chars unfinished on prompt 2

const browser = await chromium.launch({
  executablePath: CHROME_PATH,
  headless: true,
});

const page = await browser.newPage();
await page.setViewportSize({ width: 1200, height: 630 });
await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

// Open dev panel, jump to Stars (level 2), close panel.
await page.keyboard.press('F2');
await page.waitForTimeout(300);
const buttons = await page.$$('button');
for (const btn of buttons) {
  const text = await btn.textContent();
  if (text && text.trim().startsWith('2:')) {
    await btn.click();
    break;
  }
}
await page.waitForTimeout(300);
await page.keyboard.press('F2');
await page.waitForTimeout(300);

// Focus the page so keystrokes flow into the typing handler.
await page.click('body');
await page.waitForTimeout(200);

// Type prompt 1 fully, wait for the 1.5s breathing pause + advance.
for (const ch of STARS_PROMPTS[0]) {
  await page.keyboard.type(ch, { delay: 12 });
}
await page.waitForTimeout(2200);

// Type most of prompt 2, stopping a few chars short so the level
// doesn't advance off the scene.
const p2 = STARS_PROMPTS[1].slice(0, STARS_PROMPTS[1].length - STOP_BEFORE_LAST);
for (const ch of p2) {
  await page.keyboard.type(ch, { delay: 12 });
}
// Let twinkles, comets, and constellation glows settle.
await page.waitForTimeout(800);

// Inject the wordmark overlay and hide the typing UI. The rune SVG
// matches IntroSequence.tsx — same paths, same colors, just sized
// up for share-thumbnail legibility.
await page.evaluate(() => {
  // Hide typing area so the scene reads cleanly.
  const style = document.createElement('style');
  style.textContent = `
    [class*="typingArea"], [class*="header"] { display: none !important; }
  `;
  document.head.appendChild(style);

  // Wordmark lockup at bottom-center with a soft gradient scrim so it
  // reads against busy constellations and comet streaks.
  const overlay = document.createElement('div');
  overlay.innerHTML = `
    <div style="position:fixed; left:0; right:0; bottom:0; padding:90px 0 44px;
                background:linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0));
                display:flex; flex-direction:column; align-items:center; gap:16px;
                z-index:99999; pointer-events:none;">
      <svg viewBox="0 0 60 60" width="108" height="108">
        <circle cx="30" cy="30" r="26" fill="none" stroke="#3a5a2a" stroke-width="1.2" opacity="0.85"/>
        <path d="M30 12 C29.5 22, 30.5 32, 30 48"
              stroke="#5a8a4a" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        <path d="M24 19 L35 21"
              stroke="#6aaa58" stroke-width="1.9" stroke-linecap="round" fill="none"/>
        <path d="M22 28 L37 32"
              stroke="#6aaa58" stroke-width="1.9" stroke-linecap="round" fill="none"/>
        <path d="M21 37 L38 43"
              stroke="#6aaa58" stroke-width="1.9" stroke-linecap="round" fill="none"/>
        <circle cx="35" cy="21" r="1.4" fill="#d8e8c8" opacity="0.85"/>
        <circle cx="35" cy="21" r="0.5" fill="#fff" opacity="0.95"/>
      </svg>
      <h1 style="margin:0; font-family: serif; font-size:128px; font-weight:normal;
                 letter-spacing:0.15em; color:#f0e8c8;">Inkwood</h1>
      <p style="margin:0; font-family: serif; font-size:38px; letter-spacing:0.12em;
                color:#a89878; font-style:italic;">a typing game</p>
    </div>
  `;
  document.body.appendChild(overlay);
});

// Allow the overlay one paint frame to settle.
await page.waitForTimeout(200);

await page.screenshot({ path: OUTPUT, type: 'png' });
console.log(`Saved: ${OUTPUT}`);

await browser.close();
