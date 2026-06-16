import { test } from "node:test";
import assert from "node:assert/strict";

// Mirror of the cmp() helper in src/hooks/useFilters.js. Behaviour must stay
// in sync — if useFilters changes its null-handling, update this test too.
function cmp(va, vb, asc) {
  const aNull = va == null;
  const bNull = vb == null;
  if (aNull && bNull) return 0;
  if (aNull) return 1;
  if (bNull) return -1;
  return asc ? va - vb : vb - va;
}

test("sort: ascending pushes null to the end", () => {
  const arr = [3, null, 1, null, 2].sort((a, b) => cmp(a, b, true));
  assert.deepEqual(arr, [1, 2, 3, null, null]);
});

test("sort: descending also pushes null to the end (not to front)", () => {
  const arr = [3, null, 1, null, 2].sort((a, b) => cmp(a, b, false));
  assert.deepEqual(arr, [3, 2, 1, null, null]);
});

test("sort: stable behaviour when both null", () => {
  assert.equal(cmp(null, null, true), 0);
  assert.equal(cmp(null, null, false), 0);
});

test("sort: undefined treated like null", () => {
  assert.equal(cmp(undefined, 5, true), 1); // undefined sinks
  assert.equal(cmp(5, undefined, true), -1);
});
