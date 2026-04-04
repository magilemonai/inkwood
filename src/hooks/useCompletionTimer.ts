import { useEffect, useRef } from "react";

/**
 * Strict-mode-safe completion timer.
 * Uses a ref guard to prevent double-firing from React's strict mode
 * effect double-invocation.
 */
export function useCompletionTimer(
  isComplete: boolean,
  onComplete: () => void,
  delay: number = 1500,
  deps: readonly unknown[] = [],
) {
  const guardRef = useRef(false);

  useEffect(() => {
    if (!isComplete || guardRef.current) return;
    guardRef.current = true;
    const timer = setTimeout(() => {
      onComplete();
      guardRef.current = false;
    }, delay);
    return () => {
      clearTimeout(timer);
      guardRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, delay, ...deps]);
}
