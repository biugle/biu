import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement, type ReactElement } from "react";
import dayjs from "dayjs";
import { LocalizedDemoTree } from "../src/pages/CapabilityPage/localization.js";

const $t = (key: string) => ({ 标题: "Title", 选项: "Option", 示例: "Example" })[key] ?? key;

function localize(props: Record<string, unknown>) {
  return LocalizedDemoTree({ node: createElement("section", props), $t }) as ReactElement<Record<string, unknown>>;
}

test("localization preserves date range instances and methods", () => {
  const start = dayjs("2026-10-01");
  const end = dayjs("2026-10-29");
  const date = new Date("2026-10-29T00:00:00Z");
  const result = localize({ defaultValue: [start, end, date] });
  const values = result.props.defaultValue as [typeof start, typeof end, Date];
  assert.strictEqual(values[0], start);
  assert.strictEqual(values[1], end);
  assert.strictEqual(values[2], date);
  assert.equal(values[0].startOf("month").format("YYYY-MM-DD"), "2026-10-01");
});

test("plain nested option labels translate while identifiers and values remain", () => {
  const handleChange = () => undefined;
  const result = localize({
    title: "标题",
    options: [{ value: "ExampleCode", label: "选项", children: [{ value: "ChildCode", title: "标题" }] }],
    value: "选项",
    onChange: handleChange,
    children: createElement("code", null, "示例"),
  });
  assert.equal(result.props.title, "Title");
  assert.deepEqual(result.props.options, [
    { value: "ExampleCode", label: "Option", children: [{ value: "ChildCode", title: "Title" }] },
  ]);
  assert.equal(result.props.value, "选项");
  assert.strictEqual(result.props.onChange, handleChange);
  assert.equal((result.props.children as ReactElement<{ children: string }>).props.children, "示例");
});
