// Keep the timeout active through body parsing, and retry transient failures.
export async function fetchJson(url, options = {}, { timeoutMs = 30_000, retries = 2 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < retries) await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

export function validatePage(rows, pages, page) {
  if (!Array.isArray(rows) || rows.length === 0 || !Number.isInteger(pages) || pages < page) {
    throw new Error(`Invalid or empty API page ${page}; refusing incomplete refresh`);
  }
}

export function derivePerCapita(data, iso) {
  const direct = data.co2PerCapitaDirect?.[iso];
  if (direct) return { value: Math.round(direct.value * 100) / 100, year: direct.year };
  const emissions = data.co2Mt?.[iso];
  const population = data.population?.[iso]?.history?.find(point => point.year === emissions?.year);
  if (!emissions || !population || population.value <= 0) return { value: null, year: null };
  return { value: Math.round(emissions.value * 1e6 / population.value * 100) / 100, year: emissions.year };
}
