import { useState, useEffect, useMemo, useCallback, useRef } from "react";

let detailCache = null;

export default function useCountryData() {
  const [countries, setCountries] = useState([]);
  const [wbMeta, setWbMeta] = useState(null);
  const detailFetchRef = useRef(null);

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
    });
  }, []);

  // Lazy-load detail data and merge into country object
  const loadDetail = useCallback(async (country) => {
    if (country._detail) return country; // already loaded

    if (!detailCache) {
      if (!detailFetchRef.current) {
        detailFetchRef.current = fetch("/countries-detail.json").then((r) => r.json());
      }
      detailCache = await detailFetchRef.current;
    }

    const d = detailCache[country.isoCode];
    if (!d) return country;

    const enriched = {
      ...country,
      ...d,
      _detail: true,
    };

    // Update in countries array
    setCountries((prev) =>
      prev.map((c) => (c.isoCode === country.isoCode ? enriched : c))
    );

    return enriched;
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

  return { countries, wbMeta, globalAvg, loadDetail };
}
