import { useState, useCallback } from "react";

const KEY = "gegt:colorScheme";

function getInitial() {
  if (typeof window === "undefined") return "cvd";
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "cvd" || saved === "classic") return saved;
  } catch {
    // localStorage unavailable (private browsing, quota) — fall through.
  }
  return "cvd";
}

// "cvd" = colorblind-safe default palette. "classic" = original red-green
// scheme, opt-in, persisted like useDarkMode's theme preference.
export default function useColorScheme() {
  const [scheme, setScheme] = useState(getInitial);

  const toggle = useCallback(() => {
    setScheme((prev) => {
      const next = prev === "cvd" ? "classic" : "cvd";
      try { localStorage.setItem(KEY, next); } catch { /* localStorage unavailable */ }
      return next;
    });
  }, []);

  return { scheme, toggle, isClassic: scheme === "classic" };
}
