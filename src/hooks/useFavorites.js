import { useState, useCallback } from "react";

const KEY = "gegt:favorites";

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function useFavorites() {
  // Lazy init so the very first render already reflects the persisted list —
  // otherwise filteredCountries computes once with favorites=[] and a URL
  // ?favOnly=1 shows "no results" for one frame before correcting.
  const [favorites, setFavorites] = useState(read);

  const toggle = useCallback((isoCode) => {
    if (!isoCode) return;
    setFavorites((prev) => {
      const next = prev.includes(isoCode)
        ? prev.filter((x) => x !== isoCode)
        : [...prev, isoCode];
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* localStorage unavailable */ }
      return next;
    });
  }, []);

  const isFav = useCallback(
    (isoCode) => favorites.includes(isoCode),
    [favorites]
  );

  return { favorites, toggle, isFav };
}
