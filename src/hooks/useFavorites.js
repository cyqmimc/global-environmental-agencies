import { useState, useEffect, useCallback } from "react";

const KEY = "gegt:favorites";

function read() {
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
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    setFavorites(read());
  }, []);

  const toggle = useCallback((isoCode) => {
    if (!isoCode) return;
    setFavorites((prev) => {
      const next = prev.includes(isoCode)
        ? prev.filter((x) => x !== isoCode)
        : [...prev, isoCode];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const isFav = useCallback(
    (isoCode) => favorites.includes(isoCode),
    [favorites]
  );

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setFavorites([]);
  }, []);

  return { favorites, toggle, isFav, clear };
}
