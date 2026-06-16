import { useState, useCallback } from "react";

const KEY = "gegt:theme";

function getInitial() {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {}
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function apply(theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export default function useDarkMode() {
  // Lazy init so first React render agrees with the pre-paint script in
  // main.jsx — otherwise the toggle icon (☾/☀) flickers for one frame on
  // dark-mode users.
  const [theme, setTheme] = useState(getInitial);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem(KEY, next); } catch {}
      apply(next);
      return next;
    });
  }, []);

  return { theme, toggle, isDark: theme === "dark" };
}
