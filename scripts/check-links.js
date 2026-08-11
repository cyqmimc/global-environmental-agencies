/**
 * Link checker: HEAD-requests every country agency website (public/countries.json
 * `website` field, 80 URLs) plus the standing data-source URLs this project
 * pulls from (see DATA-MAINTENANCE.md — keep this list in sync with that doc).
 *
 * Reports any 4xx/5xx/timeout/network failure. Bounded concurrency + a
 * descriptive User-Agent so this doesn't look like a scraping run against 90+
 * government/NGO domains at once.
 *
 * Caveat, confirmed while building this: several government sites sit behind
 * WAFs (Cloudflare/Akamai) that 403 or silently drop *any* non-browser client
 * from a datacenter IP — that includes GitHub Actions runners, not just this
 * script. A single run's failures are a lead to investigate, not proof of a
 * dead link; this script deliberately does not spoof a browser User-Agent to
 * get around that, since these are often intentional anti-bot policies on
 * official government domains. Spot-check flagged URLs manually before
 * updating `countries.json`/DATA-MAINTENANCE.md off of one report.
 *
 * Usage: node scripts/check-links.js
 * Exit code is non-zero if any URL failed, so CI can gate on it.
 *
 * When run inside GitHub Actions ($GITHUB_OUTPUT set), also writes
 * `total`/`broken` outputs and a Markdown report to ./link-check-report.md
 * for the monthly workflow to post as/into an issue.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const UA =
  "GlobalEnvironmentalAgencies-LinkChecker/1.0 (+https://github.com/cyqmimc/global-environmental-agencies; monthly automated check, contact via GitHub issues)";
const TIMEOUT_MS = 15_000;
const CONCURRENCY = Number(process.env.LINK_CHECK_CONCURRENCY) || 4;

// Standing sources this project's data is pulled from (see DATA-MAINTENANCE.md
// "数据来源" tables). Update both places together when a source changes.
const DATA_SOURCE_URLS = [
  "https://api.worldbank.org/v2/country?format=json",
  "https://carbonpricingdashboard.worldbank.org/",
  "https://climate-laws.org/",
  "https://climateactiontracker.org/countries/",
  "https://epi.yale.edu/",
  "https://ozone.unep.org/treaties/montreal-protocol/amendments/kigali-amendment",
  "https://prais.unccd.int",
  "https://unfccc.int/BR",
  "https://unfccc.int/NDCREG",
  "https://www.unccd.int/convention/regional-implementation-annexes",
  "https://www.unccd.int/our-work/country-profile",
  "https://www.unccd.int/our-work/ldn-target-setting-programme",
  "https://zerotracker.net/",
];

function loadWebsiteUrls() {
  const countries = JSON.parse(
    readFileSync(resolve(ROOT, "public", "countries.json"), "utf8")
  );
  return countries
    .filter((c) => c.website)
    .map((c) => ({ url: c.website, label: `${c.countryEn} (${c.isoCode})` }));
}

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function lane() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  return results;
}

// Some hosts (e.g. unfccc.int, which appears twice in DATA_SOURCE_URLS)
// throttle/refuse a second simultaneous connection from the same client —
// confirmed by isolated single-request checks succeeding where a concurrent
// batch run timed out. Serialize requests per-host; different hosts still
// run in parallel up to CONCURRENCY.
const hostQueues = new Map();

function queueByHost(url, task) {
  const host = new URL(url).host;
  const prev = hostQueues.get(host) || Promise.resolve();
  const run = prev.then(task, task);
  hostQueues.set(host, run.catch(() => {}));
  return run;
}

async function attempt(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": UA,
        // Standard client hygiene — some WAFs treat a request with no Accept
        // header at all as an automatic bot-score hit. Not browser spoofing:
        // the User-Agent above still honestly identifies this as a checker.
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    return { ok: res.ok, status: res.status };
  } finally {
    clearTimeout(timer);
  }
}

async function checkUrl(url) {
  try {
    let result = await queueByHost(url, () => attempt(url, "HEAD"));
    // Some servers reject HEAD outright (405/501) even though the resource
    // is fine — fall back to a single GET before calling it broken.
    if (!result.ok && (result.status === 405 || result.status === 501)) {
      result = await queueByHost(url, () => attempt(url, "GET"));
    }
    if (result.ok) return { url, ok: true, status: result.status };
    return { url, ok: false, status: result.status, reason: `HTTP ${result.status}` };
  } catch (err) {
    const reason = err.name === "AbortError" ? `timeout after ${TIMEOUT_MS}ms` : err.message;
    return { url, ok: false, status: null, reason };
  }
}

async function main() {
  const targets = [
    ...loadWebsiteUrls(),
    ...DATA_SOURCE_URLS.map((url) => ({ url, label: "data source" })),
  ];

  console.log(`Checking ${targets.length} URLs (concurrency ${CONCURRENCY})...\n`);

  const results = await runWithConcurrency(targets, CONCURRENCY, async ({ url, label }) => {
    const r = await checkUrl(url);
    console.log(`${r.ok ? "✓" : "✗"} ${url}${r.ok ? "" : `  [${label}] ${r.reason}`}`);
    return { ...r, label };
  });

  const broken = results.filter((r) => !r.ok);

  console.log(`\n${results.length - broken.length}/${results.length} URLs OK.`);
  if (broken.length) {
    console.log(`\n✗ ${broken.length} broken:`);
    broken.forEach((r) => console.log(`  - [${r.label}] ${r.url} — ${r.reason}`));
  }

  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(
      process.env.GITHUB_OUTPUT,
      `total=${results.length}\nbroken=${broken.length}\n`,
      { flag: "a" }
    );
  }

  const reportLines = [
    `Monthly link check — ${new Date().toISOString().slice(0, 10)}`,
    "",
    `${results.length - broken.length}/${results.length} URLs OK.`,
    "",
  ];
  if (broken.length) {
    reportLines.push(`### ${broken.length} broken link(s)`, "");
    reportLines.push(
      "⚠️ Some government sites block automated/datacenter clients (WAF) and " +
        "will 403 or time out here even when the site is genuinely up — that " +
        "includes this checker running from a GitHub Actions IP. Please open " +
        "each URL in a browser before editing `countries.json` off this list.",
      ""
    );
    reportLines.push("| URL | Source | Reason |", "|---|---|---|");
    broken.forEach((r) => reportLines.push(`| ${r.url} | ${r.label} | ${r.reason} |`));
  } else {
    reportLines.push("All URLs reachable. 🎉");
  }
  writeFileSync(resolve(ROOT, "link-check-report.md"), reportLines.join("\n") + "\n");

  process.exit(broken.length ? 1 : 0);
}

main();
