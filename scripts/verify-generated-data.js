#!/usr/bin/env node
/**
 * CI gate: fail if any generated public/*.json file doesn't match what
 * rebuilding it from source (data/countries/*.json) would produce right now.
 *
 * This is what actually prevents drift now that public/countries.json can't
 * just be gitignored (Vercel's static deploy serves it directly, so it has
 * to be a real committed file) — instead of trusting people to always run
 * `npm run build-data` before committing, CI independently rebuilds
 * everything in memory and byte-compares it against what's checked in. If
 * someone hand-edits public/countries.json (or countries-core.json /
 * countries-detail.json) directly instead of editing data/countries/<iso>.json
 * and rebuilding, this fails the build with a diff.
 *
 * Pure read-only check — never writes files. Run the real build
 * (`npm run build-data`) to fix a failure, then commit the result.
 *
 * Run: node scripts/verify-generated-data.js
 * Exit code is non-zero on any mismatch.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildCountries, serialize } from "./build-countries.js";
import { buildCore, buildDetail } from "./split-countries.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");

function readIfExists(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

function firstDiffLine(expected, actual) {
  const a = expected.split("\n");
  const b = actual.split("\n");
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) return { line: i + 1, expected: a[i], actual: b[i] };
  }
  return null;
}

function check(label, committedPath, expectedContent) {
  const committedContent = readIfExists(committedPath);
  if (committedContent === null) {
    return { label, ok: false, reason: `${committedPath} does not exist` };
  }
  if (committedContent === expectedContent) {
    return { label, ok: true };
  }
  const diff = firstDiffLine(expectedContent, committedContent);
  return {
    label,
    ok: false,
    reason: diff
      ? `first difference at line ${diff.line}:\n    expected: ${diff.expected ?? "(no line)"}\n    committed: ${diff.actual ?? "(no line)"}`
      : "content differs (sizes match, bytes don't)",
  };
}

function main() {
  const countries = buildCountries();
  const expectedCountriesJson = serialize(countries);
  const expectedCoreJson = JSON.stringify(buildCore(countries));
  const expectedDetailJson = JSON.stringify(buildDetail(countries));

  const results = [
    check(
      "public/countries.json",
      path.join(PUBLIC, "countries.json"),
      expectedCountriesJson
    ),
    check(
      "public/countries-core.json",
      path.join(PUBLIC, "countries-core.json"),
      expectedCoreJson
    ),
    check(
      "public/countries-detail.json",
      path.join(PUBLIC, "countries-detail.json"),
      expectedDetailJson
    ),
  ];

  const failures = results.filter((r) => !r.ok);

  results.forEach((r) => console.log(`${r.ok ? "✓" : "✗"} ${r.label}${r.ok ? "" : ` — ${r.reason}`}`));

  if (failures.length) {
    console.error(
      `\n${failures.length} generated file(s) out of sync with data/countries/*.json.\n` +
        "Run `npm run build-data` and commit the result — never hand-edit files in public/ directly."
    );
    process.exit(1);
  }

  console.log("\n✓ All generated data files match their source.");
}

main();
