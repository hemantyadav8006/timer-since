"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useState backed by localStorage. Hydration-safe — returns `fallback`
 * during SSR and reads from storage after mount.
 */
export function useLocalStorage<T>(
  key: string,
  fallback: T,
): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* corrupt storage — use fallback */
    }
  }, [key]);

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* quota exceeded — keep in-memory only */
        }
        return next;
      });
    },
    [key],
  );

  return [value, set];
}
