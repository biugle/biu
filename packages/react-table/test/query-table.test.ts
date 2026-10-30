import test from "node:test";
import assert from "node:assert/strict";
import { normalizeQueryTableResponse, stableSerialize } from "../src/use-query-table.js";
import { getBiuTableLocaleText } from "../src/locale/index.js";

test("query table serialization handles circular arrays and shared values", () => {
  const circular: unknown[] = [];
  circular.push(circular);
  assert.equal(stableSerialize(circular), "[[Circular]]");
  const shared = [1, 2];
  assert.equal(stableSerialize([shared, shared]), "[[1,2],[1,2]]");
  const nested: { items: unknown[] } = { items: [] };
  nested.items.push(nested);
  assert.equal(stableSerialize(nested), '{"items":[[Circular]]}');
});

test("query table malformed collections return empty items and a numeric fallback total", () => {
  for (const response of [{ items: {} }, { data: { items: {} } }, { items: "invalid" }, { data: { items: "invalid" } }])
    assert.deepEqual(normalizeQueryTableResponse(response), { items: [], total: 0 });
  assert.deepEqual(normalizeQueryTableResponse({ items: {}, total: 3 }), { items: [], total: 3 });
  assert.deepEqual(normalizeQueryTableResponse({ items: {}, total: "invalid" }), { items: [], total: 0 });
});
test("normalizes the legacy results pagination contract", () => {
  assert.deepEqual(normalizeQueryTableResponse({ results: [{ id: 1 }], pagination: { totalResult: 8 } }), {
    items: [{ id: 1 }],
    total: 8,
  });
});

test("normalizes the standard data contract", () => {
  assert.deepEqual(normalizeQueryTableResponse({ data: [{ id: 1 }], total: 1 }), { items: [{ id: 1 }], total: 1 });
});

test("normalizes nested data contracts and derives total when omitted", () => {
  assert.deepEqual(normalizeQueryTableResponse({ data: { items: [{ id: 1 }, { id: 2 }] } }), {
    items: [{ id: 1 }, { id: 2 }],
    total: 2,
  });
});

test("stable serialization ignores object key order", () => {
  assert.equal(
    stableSerialize({ page: 1, filter: { b: 2, a: 1 } }),
    stableSerialize({ filter: { a: 1, b: 2 }, page: 1 }),
  );
});

test("table locale defaults to Chinese and allows custom labels", () => {
  assert.equal(getBiuTableLocaleText()["暂无数据"], "暂无数据");
  assert.equal(getBiuTableLocaleText("en-US")["暂无数据"], "No data");
  assert.equal(getBiuTableLocaleText("en-US", { 暂无数据: "Nothing here" })["暂无数据"], "Nothing here");
});
