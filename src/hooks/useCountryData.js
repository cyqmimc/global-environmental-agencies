import { useState, useEffect, useMemo, useCallback, useRef } from "react";

let detailCache = null;
let detailFetchPromise = null;

function fetchDetail() {
  if (!detailFetchPromise) {
    detailFetchPromise = fetch("/countries-detail.json")
      .then((r) => r.json())
      .then((d) => {
        detailCache = d;
        return d;
      });
  }
  return detailFetchPromise;
}

export default function useCountryData() {
  const [countries, setCountries] = useState([]);
  const [wbMeta, setWbMeta] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    Promise.all([
      fetch("/countries-core.json").then((r) => r.json()),
      fetch("/wb-data.json").then((r) => r.json()).catch(() => ({ countries: {}, meta: null })),
    ]).then(([countriesData, wbData]) => {
      if (wbData.meta) setWbMeta(wbData.meta);
      const merged = countriesData.map((c) => {
        const code = c.isoCode || c.flagUrl?.match(/flagcdn\.com\/(\w{2})\.svg/)?.[1];
        const wb = code ? wbData.countries?.[code] || null : null;
        return { ...c, wb };
      });
      setCountries(merged);

      // Eager background prefetch of the detail bundle once the core list is up.
      // Keeps the lazy contract (loadDetail still returns the same shape), but
      // ensures RankingsView CSV export and other bulk operations don't drop
      // keyLaws/treaties just because the user never opened a detail dialog.
      if (!fetchedRef.current) {
        fetchedRef.current = true;
        const kick = () => fetchDetail().catch(() => {});
        if (typeof requestIdleCallback === "function") requestIdleCallback(kick, { timeout: 2000 });
        else setTimeout(kick, 1000);
      }
    });
  }, []);

  // Lazy-load detail data and merge into one country object.
  const loadDetail = useCallback(async (country) => {
    if (country._detail) return country;
    if (!detailCache) await fetchDetail();
    const d = detailCache?.[country.isoCode];
    if (!d) return country;

    const enriched = { ...country, ...d, _detail: true };
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
    if (!detailCache) await fetchDetail();
    if (!detailCache) return;
    setCountries((prev) =>
      prev.map((c) => (c._detail ? c : { ...c, ...(detailCache[c.isoCode] || {}), _detail: true }))
    );
  }, []);

  const globalAvg = useMemo(() => {
    if (countries.length === 0) return {};
    const avg = (fn) => {
      const vals = countries.map(fn).filter((v) => v != null);
      return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null;
    };
    return {
      forestCoverage: avg((c) => c.data.forestCoverage),
      carbonEmission: avg((c) => c.data.carbonEmission),
      co2PerCapita: avg((c) => c.wb?.co2PerCapita),
      renewableEnergy: avg((c) => c.wb?.renewableEnergy),
      pm25: avg((c) => c.wb?.pm25),
      protectedAreas: avg((c) => c.wb?.protectedAreas),
    };
  }, [countries]);

  return { countries, wbMeta, globalAvg, loadDetail, loadAllDetails };
}
