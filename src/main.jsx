import './index.css';
import React from 'react'
import ReactDOM from 'react-dom/client'
import GlobalEnvironmentalAgencies from './App'
import EmbedCountryCard from './components/EmbedCountryCard'
import ErrorBoundary from './components/ErrorBoundary'

const isEmbed = /^\/embed\/country\/[a-z]{2}\/?$/i.test(window.location.pathname);

// Apply persisted theme before first paint to avoid a flash. Skipped for
// embeds: an embed's theme is authoritatively the `?theme=` query param
// (set by whoever embeds it, to match their page), never this iframe
// document's own localStorage/OS preference — see EmbedCountryCard.
if (!isEmbed) {
  (function applyInitialTheme() {
    try {
      const saved = localStorage.getItem("gegt:theme");
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      const theme = saved === "dark" || saved === "light"
        ? saved
        : prefersDark ? "dark" : "light";
      if (theme === "dark") document.documentElement.classList.add("dark");
    } catch {
      // localStorage/matchMedia unavailable — default light theme stands.
    }
  })();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary onReset={() => window.location.reload()}>
      {isEmbed ? <EmbedCountryCard /> : <GlobalEnvironmentalAgencies />}
    </ErrorBoundary>
  </React.StrictMode>,
)

// Register service worker in production builds only — keeps dev HMR clean.
// Skipped for embeds: an <iframe> registering a service worker under the
// embedding page's origin context is unexpected behavior for a widget.
if (!isEmbed && "serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
