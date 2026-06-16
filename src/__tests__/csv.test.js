/**
 * Node built-in test runner (no extra deps).
 * Run with: node --test src/__tests__/csv.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { csvQuote, activeFilterCount } from "../constants.js";

test("csvQuote: wraps plain text in quotes", () => {
  assert.equal(csvQuote("hello"), '"hello"');
});

test("csvQuote: doubles embedded quotes (RFC 4180)", () => {
  assert.equal(csvQuote('she said "hi"'), '"she said ""hi"""');
});

test("csvQuote: handles null/undefined gracefully", () => {
  assert.equal(csvQuote(null), '""');
  assert.equal(csvQuote(undefined), '""');
});

test("csvQuote: preserves commas inside quoted field (escape via wrapping)", () => {
  // Commas are not escaped inside the field — that's the whole point of quoting.
  assert.equal(csvQuote("Paris, France"), '"Paris, France"');
});

test("activeFilterCount: counts each independently-applied filter", () => {
  assert.equal(activeFilterCount({}), 0);
  assert.equal(
    activeFilterCount({ search: "x", region: "", tag: "", compliance: "", favOnly: false }),
    1
  );
  assert.equal(
    activeFilterCount({ search: "x", region: "Asia", tag: "climate", compliance: "ndc_good", favOnly: true }),
    5
  );
});
