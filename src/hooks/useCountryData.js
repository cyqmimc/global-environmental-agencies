import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { fetchJson } from "../utils/fetchWithRetry";

let detailCache = null;
let historyCache = null;
let idlePrefetchPromise = null;

/**
 * Fetches countries-detail.json + wb-history.json together (idle prefetch,
 * or on first demand from loadDetail/loadAllDetails). Both are only needed
 * once a detail dialog opens or a bulk export runs — never on first paint.
 */
function fetchIdleBundle() {
  if (!idlePrefetchPromise) {
    idlePrefetchPromise = Promise.all([
      fetchJson("/countries-detail.json").catch(() => ({})),
      fetchJson("/wb-history.json").catch(() => ({ countries: {} })),
    ]).then(([detail, history]) => {
      detailCache = detail;
      historyCache = history.countries || {};
      return { detail, history: historyCache };
    });
  }
  return idlePrefetchPromise;
}

export default function useCountryData() {
  const [countries, setCountries] = useState([]);
  const [wbMeta, setWbMeta] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    Promise.all([
      fetchJson("/countries-core.json"),
      fetchJson("/wb-latest.json").catch(() => ({ countries: {}, meta: null })),
    ])
      .then(([countriesData, wbData]) => {
        if (wbData.meta) setWbMeta(wbData.meta);
        const merged = countriesData.map((c) => {
          const code = c.isoCode || c.flagUrl?.match(/flagcdn\.com\/(\w{2})\.svg/)?.[1];
          const wb = code ? wbData.countries?.[code] || null : null;
          return { ...c, wb };
        });
        setCountries(merged);

        // Idle prefetch of detail + history bundles. Once resolved, merge
        // history into wb.history for every country so Sparklines/TrendLineChart
        // light up without needing a per-country fetch.
        if (!fetchedRef.current) {
          fetchedRef.current = true;
          const kick = () =>
            fetchIdleBundle()
              .then(({ history }) => {
                setCountries((prev) =>
                  prev.map((c) =>
                    c.wb && history[c.isoCode]
                      ? { ...c, wb: { ...c.wb, history: history[c.isoCode] } }
                      : c
                  )
                );
              })
              .catch(() => {})
              .finally(() => setHistoryLoaded(true));
          if (typeof requestIdleCallback === "function") requestIdleCallback(kick, { timeout: 2000 });
          else setTimeout(kick, 1000);
        }
      })
      .catch((err) => console.error("Failed to load country data:", err));
  }, []);

  // Lazy-load detail + history data and merge into one country object.
  // Used when a DetailDialog opens before the idle prefetch has resolved.
  const loadDetail = useCallback(async (country) => {
    if (country._detail) return country;
    if (!detailCache) await fetchIdleBundle();
    const d = detailCache?.[country.isoCode];
    const h = historyCache?.[country.isoCode];
    if (!d && !h) return country;

    const enriched = {
      ...country,
      ...d,
      wb: h ? { ...country.wb, history: h } : country.wb,
      _detail: true,
    };
    setCountries((prev) =>
      prev.map((c) => (c.isoCode === country.isoCode ? enriched : c))
    );
    return enriched;
  }, []);

  /**
   * Merge detail into every country currently in state. Resolves when done.
   * Used by export flows that need the full row shape regardless of whether
   * each country's detail dialog has been opened.
   */
  const loadAllDetails = useCallback(async () => {
    if (!detailCache) await fetchIdleBundle();
    if (!detailCache) return countries;
    const enriched = countries.map((c) =>
      c._detail ? c : { ...c, ...(detailCache[c.isoCode] || {}), _detail: true }
    );
    setCountries(enriched);
    return enriched;
  }, [countries]);

  const globalAvg = useMemo(() => {
    if (countries.length === 0) return {};
    const avg = (fn, digits = 2) => {
      const vals = countries.map(fn).filter((v) => v != null && Number.isFinite(v));
      return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(digits) : null;
    };
    return {
      forestCoverage: avg((c) => c.wb?.forestArea),
      carbonEmission: avg((c) => c.wb?.co2Mt),
      co2PerCapita: avg((c) => c.wb?.co2PerCapita),
      renewableEnergy: avg((c) => c.wb?.renewableEnergy),
      pm25: avg((c) => c.wb?.pm25),
      protectedAreas: avg((c) => c.wb?.protectedAreas),
      // New: derived carbon intensity (kg CO₂/USD GDP) averaged across countries with both fields.
      carbonIntensity: avg(
        (c) => (c.wb?.co2Mt != null && c.wb?.gdp > 0 ? (c.wb.co2Mt * 1e9) / c.wb.gdp : null),
        4
      ),
    };
  }, [countries]);

  return { countries, wbMeta, globalAvg, loadDetail, loadAllDetails, historyLoaded };
}
