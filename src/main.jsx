import './index.css';
import React from 'react'
import ReactDOM from 'react-dom/client'
import GlobalEnvironmentalAgencies from './App'

// Apply persisted theme before first paint to avoid a flash.
(function applyInitialTheme() {
  try {
    const saved = localStorage.getItem("gegt:theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const theme = saved === "dark" || saved === "light"
      ? saved
      : prefersDark ? "dark" : "light";
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch {}
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalEnvironmentalAgencies />
  </React.StrictMode>,
)

// Register service worker in production builds only — keeps dev HMR clean.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
