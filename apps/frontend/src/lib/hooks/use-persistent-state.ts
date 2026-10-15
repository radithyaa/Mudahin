import { useCallback, useEffect, useState } from "react";

/**
 * State yang persisten di `localStorage` — pengganti ringan untuk Zustand persist
 * yang dipakai `frontend` (mobile-first & web; berfungsi di browser & WebView Tauri).
 *
 * Dibungkus `try/catch` agar lingkungan tanpa `localStorage` (mis. mode privat
 * atau WebView yang ketat) tetap berjalan — kegagalan hanya menghilangkan
 * persistensi, bukan fitur.
 */
const PREFIX = "mudahin-frontend:";

export function usePersistentState<T>(
  key: string,
  initial: T
): [T, (value: T | ((previous: T) => T)) => void] {
  const storageKey = PREFIX + key;

  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Best-effort: abaikan bila penyimpanan tidak tersedia / penuh.
    }
  }, [storageKey, value]);

  const update = useCallback((next: T | ((previous: T) => T)) => {
    setValue((previous) =>
      typeof next === "function" ? (next as (p: T) => T)(previous) : next
    );
  }, []);

  return [value, update];
}
