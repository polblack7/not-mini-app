import { useEffect, useRef, useState } from "react";

/**
 * Returns a counter that increments every time `value` transitions from a
 * null/falsy state to a new non-null value. Used to remount one-shot
 * animations (e.g. the orange error sweep on Hero Balance).
 */
export function useErrorFlash(value) {
  const [count, setCount] = useState(0);
  const previous = useRef(null);
  useEffect(() => {
    const next = value || null;
    if (next && next !== previous.current) {
      setCount((c) => c + 1);
    }
    previous.current = next;
  }, [value]);
  return count;
}
