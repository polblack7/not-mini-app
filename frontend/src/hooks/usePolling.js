import { useEffect, useRef } from "react";

/**
 * Calls `tick` once on mount and every `intervalMs` thereafter while `enabled`
 * is true. The latest `tick` is held in a ref so callers can pass inline arrow
 * functions without restarting the interval.
 */
export function usePolling(tick, intervalMs, enabled = true) {
  const ref = useRef(tick);
  useEffect(() => {
    ref.current = tick;
  }, [tick]);

  useEffect(() => {
    if (!enabled || !intervalMs) return undefined;
    const fire = () => ref.current?.();
    fire();
    const id = setInterval(fire, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs]);
}
