import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { normalizeQueryTableResponse, stableSerialize } from "../src/use-query-table.js";
import { getBiuTableLocaleText } from "../src/locale/index.js";
import { Table } from "../src/ui/table.js";

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
  const renderLabels = (title: string, locale?: string, localeText?: Record<string, string>) =>
    renderToStaticMarkup(
      createElement(Table<{ name: string }>, {
        columns: [{ key: "name", title, dataIndex: "name", resizable: true, filters: [{ label: "A", value: "A" }] }],
        locale,
        localeText,
        pagination: false,
      }),
    );
  for (const locale of ["en-US", "en", " EN-gb "]) {
    const markup = renderLabels("Region name", locale);
    assert.match(markup, /aria-label="Region name Column width"/);
    assert.match(markup, /aria-label="Filter Region name"/);
  }
  const chinese = renderLabels("名称");
  assert.match(chinese, /aria-label="名称列宽"/);
  assert.match(chinese, /aria-label="筛选名称"/);
  const customized = renderLabels("Region name", undefined, { 列宽: "Resize width", 筛选: "Find" });
  assert.match(customized, /aria-label="Region name Resize width"/);
  assert.match(customized, /aria-label="Find Region name"/);
  assert.match(renderLabels("名称", "en-US", { 列宽: "宽度" }), /aria-label="名称宽度"/);
  assert.match(renderLabels("Name", "en-US", { 列宽: " width" }), /aria-label="Name width"/);
});
