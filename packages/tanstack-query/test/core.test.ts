import assert from "node:assert/strict";
import test from "node:test";
import {
  BiuQueryError,
  createBiuMutationController,
  createBiuMutationOptions,
  createBiuQueryClientOptions,
  createBiuQueryKeys,
  normalizeBiuListResponse,
  stableSerialize,
} from "../src/index.js";

test("query keys and serialization are stable and framework neutral", () => {
  const keys = createBiuQueryKeys("users");
  assert.deepEqual(keys.all, ["users"]);
  assert.deepEqual(keys.list({ b: 2, a: 1 }), ["users", "list", { b: 2, a: 1 }]);
  assert.deepEqual(keys.detail("u1"), ["users", "detail", "u1"]);
  assert.equal(stableSerialize({ b: 2, a: 1 }), stableSerialize({ a: 1, b: 2 }));
  assert.equal(new BiuQueryError("failed", { status: 500 }).status, 500);
});

test("query serialization handles circular arrays without changing shared values", () => {
  const circular: unknown[] = [];
  circular.push(circular);
  assert.equal(stableSerialize(circular), "[[Circular]]");
  const shared = [1, 2];
  assert.equal(stableSerialize([shared, shared]), "[[1,2],[1,2]]");
  const nested: { items: unknown[] } = { items: [] };
  nested.items.push(nested);
  assert.equal(stableSerialize(nested), '{"items":[[Circular]]}');
});

test("malformed list collections normalize to an empty array and numeric total", () => {
  for (const value of [{ items: {} }, { data: { items: {} } }, { items: "invalid" }, { data: { items: "invalid" } }])
    assert.deepEqual(normalizeBiuListResponse(value), { items: [], total: 0 });
  assert.deepEqual(normalizeBiuListResponse({ items: {}, total: 3 }), { items: [], total: 3 });
  assert.deepEqual(normalizeBiuListResponse({ data: { items: {}, totalResult: 4 } }), { items: [], total: 4 });
  assert.deepEqual(normalizeBiuListResponse({ items: {}, total: "invalid" }), { items: [], total: 0 });
});

test("defaults preserve caller overrides and list responses normalize common envelopes", () => {
  const options = createBiuQueryClientOptions({
    defaults: { staleTime: 1000 },
    defaultOptions: { queries: { retry: 1 } },
  });
  assert.equal(options.defaultOptions?.queries?.staleTime, 1000);
  assert.equal(options.defaultOptions?.queries?.retry, 1);
  assert.deepEqual(normalizeBiuListResponse({ data: { records: [{ id: 1 }], totalResult: 3 } }), {
    items: [{ id: 1 }],
    total: 3,
  });
});

test("mutation options preserve an externally controlled AbortSignal", async () => {
  const controller = createBiuMutationController();
  let received: AbortSignal | undefined;
  const options = createBiuMutationOptions({
    signal: controller.signal,
    mutationFn: async (_value: string, context) => {
      received = context.signal;
      return "ok";
    },
  });
  assert.equal(await options.mutationFn("value"), "ok");
  assert.equal(received, controller.signal);
  controller.cancel("cancelled");
  assert.equal(controller.signal.aborted, true);
});
