import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validatePage, derivePerCapita, fetchJson } from "../../scripts/update-utils.js";
import { withRollback } from "../../scripts/update-all.js";
import { SERIES_CONFIG, pickLatestObservation } from "../../scripts/fetch-un-sdg-data.js";

test("SDG rejects blank, null, boolean, nonnumeric values and invalid years but retains zero", () => {
  const config = SERIES_CONFIG[0];
  const row = { geoAreaCode: "840", dimensions: config.dimensions, timePeriodStart: 2023 };
  for (const value of [null, undefined, "", "  ", true, "NaN"]) {
    assert.equal(pickLatestObservation([{ ...row, value }], config, "840"), null);
  }
  assert.equal(pickLatestObservation([{ ...row, value: "0" }], config, "840").value, 0);
  assert.equal(pickLatestObservation([{ ...row, value: "1", timePeriodStart: "" }], config, "840"), null);
});

test("malformed or missing pagination cannot silently truncate a refresh", () => {
  for (const args of [[undefined, 2, 2], [[], 2, 2], [[{}], undefined, 1], [[{}], 1, 2]]) {
    assert.throws(() => validatePage(...args), /API page/);
  }
  assert.doesNotThrow(() => validatePage([{}], 2, 2));
});

test("per-capita fallback uses population from the emissions year", () => {
  const data = {
    co2Mt: { us: { value: 10, year: 2023 } },
    population: { us: { value: 2000000, year: 2024, history: [{ year: 2023, value: 1000000 }] } },
  };
  assert.deepEqual(derivePerCapita(data, "us"), { value: 10, year: 2023 });
  data.population.us.history = [];
  assert.deepEqual(derivePerCapita(data, "us"), { value: null, year: null });
  data.co2PerCapitaDirect = { us: { value: 12, year: 2022 } };
  assert.deepEqual(derivePerCapita(data, "us"), { value: 12, year: 2022 });
});

test("failed pipeline restores bytes and removes newly created outputs", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "data-update-test-"));
  try {
    const original = path.join(directory, "wb-latest.json");
    const created = path.join(directory, "sdg-latest.json");
    fs.writeFileSync(original, '{"old":true}\n');
    assert.throws(() => withRollback(directory, () => {
      fs.writeFileSync(original, "{}");
      fs.writeFileSync(created, "{}");
      throw new Error("upstream failed");
    }), /upstream failed/);
    assert.equal(fs.readFileSync(original, "utf8"), '{"old":true}\n');
    assert.equal(fs.existsSync(created), false);
    withRollback(directory, () => fs.writeFileSync(original, '{"new":true}'));
    assert.equal(fs.readFileSync(original, "utf8"), '{"new":true}');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("updater retries a body parse failure", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    json: async () => { if (++calls === 1) throw new Error("truncated JSON"); return { ok: true }; },
  }));
  assert.deepEqual(await fetchJson("https://example.test", {}, { retries: 1 }), { ok: true });
  assert.equal(calls, 2);
});

test("schema validation fails for missing or malformed required snapshots", async () => {
  const { spawnSync } = await import("node:child_process");
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "schema-test-"));
  const root = new URL("../../", import.meta.url);
  try {
    fs.mkdirSync(path.join(directory, "scripts"));
    fs.mkdirSync(path.join(directory, "public"));
    fs.writeFileSync(path.join(directory, "package.json"), '{"type":"module"}');
    const script = path.join(directory, "scripts", "validate-schema.js");
    fs.copyFileSync(new URL("scripts/validate-schema.js", root), script);
    for (const name of ["countries.json", "wb-latest.json", "wb-history.json", "sdg-latest.json"]) {
      fs.copyFileSync(new URL("public/" + name, root), path.join(directory, "public", name));
    }
    for (const name of ["wb-latest.json", "wb-history.json", "sdg-latest.json"]) {
      const file = path.join(directory, "public", name);
      const original = fs.readFileSync(file);
      fs.writeFileSync(file, "{broken");
      assert.equal(spawnSync(process.execPath, [script]).status, 1, name);
      fs.rmSync(file);
      assert.equal(spawnSync(process.execPath, [script]).status, 1, name);
      fs.writeFileSync(file, original);
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
