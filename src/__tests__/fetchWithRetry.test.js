import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchJson, fetchText } from "../utils/fetchWithRetry.js";

/**
 * This project has no DOM/React-rendering test setup (node:test only, zero
 * framework deps — see CLAUDE.md). useCountryData's `status: 'error'` branch
 * is entered exactly when its call to fetchJson("/countries-core.json")
 * rejects, so exercising fetchJson/fetchText's reject-after-retry behavior
 * here is the faithful equivalent of "mock fetch reject, assert the error
 * branch is taken" without pulling in a rendering library.
 */

function withMockedFetch(impl, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return fn().finally(() => {
    globalThis.fetch = original;
  });
}

test("fetchJson: rejects after exhausting retries when fetch always rejects", async () => {
  let calls = 0;
  await withMockedFetch(
    async () => {
      calls++;
      throw new Error("network down");
    },
    async () => {
      await assert.rejects(
        () => fetchJson("/does-not-matter.json", { timeoutMs: 50, retries: 1 }),
        /network down/
      );
      assert.equal(calls, 2, "expected 1 initial attempt + 1 retry");
    }
  );
});

test("fetchJson: succeeds without retrying when the first attempt resolves", async () => {
  let calls = 0;
  await withMockedFetch(
    async () => {
      calls++;
      return { ok: true, json: async () => ({ hello: "world" }) };
    },
    async () => {
      const data = await fetchJson("/ok.json", { timeoutMs: 50, retries: 1 });
      assert.deepEqual(data, { hello: "world" });
      assert.equal(calls, 1);
    }
  );
});

test("fetchJson: recovers on the retry after the first attempt fails", async () => {
  let calls = 0;
  await withMockedFetch(
    async () => {
      calls++;
      if (calls === 1) throw new Error("transient failure");
      return { ok: true, json: async () => ({ recovered: true }) };
    },
    async () => {
      const data = await fetchJson("/flaky.json", { timeoutMs: 50, retries: 1 });
      assert.deepEqual(data, { recovered: true });
      assert.equal(calls, 2);
    }
  );
});

test("fetchJson: a non-ok HTTP response is treated as a failure and retried", async () => {
  let calls = 0;
  await withMockedFetch(
    async () => {
      calls++;
      return { ok: false, status: 404, json: async () => ({}) };
    },
    async () => {
      await assert.rejects(
        () => fetchJson("/missing.json", { timeoutMs: 50, retries: 1 }),
        /HTTP 404/
      );
      assert.equal(calls, 2);
    }
  );
});

test("fetchJson: respects retries: 0 (no retry, single attempt)", async () => {
  let calls = 0;
  await withMockedFetch(
    async () => {
      calls++;
      throw new Error("fail once");
    },
    async () => {
      await assert.rejects(() => fetchJson("/x.json", { timeoutMs: 50, retries: 0 }));
      assert.equal(calls, 1);
    }
  );
});

test("fetchText: rejects after exhausting retries, mirroring fetchJson's behavior", async () => {
  let calls = 0;
  await withMockedFetch(
    async () => {
      calls++;
      throw new Error("svg fetch failed");
    },
    async () => {
      await assert.rejects(
        () => fetchText("/world-map.svg", { timeoutMs: 50, retries: 1 }),
        /svg fetch failed/
      );
      assert.equal(calls, 2);
    }
  );
});

test("fetchJson: aborts a hung request once timeoutMs elapses", async () => {
  await withMockedFetch(
    (url, { signal } = {}) =>
      new Promise((resolve, reject) => {
        // Never resolves on its own — only the AbortController should end this.
        signal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      }),
    async () => {
      await assert.rejects(
        () => fetchJson("/hangs-forever.json", { timeoutMs: 20, retries: 0 }),
        /AbortError|aborted/
      );
    }
  );
});
