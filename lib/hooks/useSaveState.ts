import { useState, useCallback } from "react";

interface SaveState {
  saving: boolean;
  error: string | null;
  /** Wrap an async save function. Sets saving=true, clears error, runs fn, then resets. */
  run: (fn: () => Promise<void>) => Promise<void>;
  clearError: () => void;
}

/**
 * Eliminates the repeated `[saving, setSaving]` + `try/finally` pattern.
 *
 * Usage:
 *   const save = useSaveState();
 *   await save.run(async () => { await setDoc(...) });
 *   // Button: disabled={save.saving}
 *   // Label:  {save.saving ? "Saving…" : "Save"}
 *   // Error:  {save.error && <p>{save.error}</p>}
 */
export function useSaveState(): SaveState {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const run = useCallback(async (fn: () => Promise<void>) => {
    setSaving(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { saving, error, run, clearError };
}
