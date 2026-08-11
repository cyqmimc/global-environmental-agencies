/**
 * fetch() with an AbortController-based timeout and one retry.
 * A hung or slow response on first load must not leave the app stuck
 * forever waiting on a promise that never resolves.
 */
async function fetchWithRetry(url, { timeoutMs = 8000, retries = 1 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
    }
  }
  throw lastErr;
}

export function fetchJson(url, options) {
  return fetchWithRetry(url, options).then((res) => res.json());
}

export function fetchText(url, options) {
  return fetchWithRetry(url, options).then((res) => res.text());
}
