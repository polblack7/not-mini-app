import { useCallback, useState } from "react";

/**
 * Wraps an async function with a notice-aware result. Returns { run, pending, lastError }.
 * The optional `onSuccess(result)` callback fires after a successful run.
 *
 * Usage:
 *   const save = useAsyncAction(api.updateSettings, {
 *     notice,
 *     successMessage: "Saved",
 *     errorMessage: "Failed to save",
 *     onSuccess: setSettings,
 *   });
 */
export function useAsyncAction(fn, options = {}) {
  const { notice, successMessage, errorMessage, onSuccess } = options;
  const [pending, setPending] = useState(false);
  const [lastError, setLastError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setPending(true);
      setLastError(null);
      notice?.clear();
      try {
        const result = await fn(...args);
        if (onSuccess) onSuccess(result);
        if (successMessage && notice) notice.success(successMessage);
        return result;
      } catch (err) {
        const msg = err?.message || errorMessage || "Action failed";
        setLastError(msg);
        if (notice) notice.error(msg);
        return null;
      } finally {
        setPending(false);
      }
    },
    [fn, notice, successMessage, errorMessage, onSuccess]
  );

  return { run, pending, lastError };
}
