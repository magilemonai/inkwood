/**
 * Share Inkwood — wraps navigator.share with a clipboard fallback.
 *
 * Returns a discriminator so callers can show "Link copied!" feedback
 * when we fell back to clipboard (Web Share API is mobile-only on
 * most platforms).
 */

const SHARE_URL = "https://magilemonai.github.io/inkwood/";
const SHARE_TITLE = "Inkwood";
const SHARE_TEXT = "Inkwood - a cozy typing game where every phrase is a spell.";

export type ShareResult = "shared" | "copied" | "cancelled" | "fallback";

export async function shareInkwood(): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ url: SHARE_URL, title: SHARE_TITLE, text: SHARE_TEXT });
      return "shared";
    } catch {
      return "cancelled";
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      return "copied";
    } catch {
      /* fall through to prompt */
    }
  }
  if (typeof window !== "undefined") {
    window.prompt("Copy this link:", SHARE_URL);
  }
  return "fallback";
}
