/** Clamp progress into a sub-range for staggered animation entry.
 *  Returns 0-1 within the range [start, start+duration]. */
export function sub(p: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (p - start) / duration));
}
