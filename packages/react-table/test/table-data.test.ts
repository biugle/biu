import test from "node:test";
import assert from "node:assert/strict";
import * as React from "react";
import { deriveTableData, normalizeFilterKeys, paginateTableData } from "../src/ui/data.js";
import { columnTitleText } from "../src/ui/column-utils.js";
import type { Column } from "../src/ui/types.js";

type Row = { id: number; name: string; owner: string };
const columns: Column<Row>[] = [
  { key: "name", title: "Name", dataIndex: "name", sortable: true },
  { key: "owner", title: "Owner", dataIndex: "owner", filters: [{ label: "Table", value: "Table" }] },
];
const rows: Row[] = [
  { id: 1, name: "LayoutFrame", owner: "Foundation" },
  { id: 2, name: "useQueryTable", owner: "Table" },
  { id: 3, name: "Form.Item", owner: "Form" },
];

test("table derives filtered and sorted client data", () => {
  assert.deepEqual(
    deriveTableData(rows, columns, { field: "name", order: "ascend" }, { owner: "Table" }).map((row) => row.name),
    ["useQueryTable"],
  );
  assert.deepEqual(
    deriveTableData(rows, columns, { field: "name", order: "descend" }).map((row) => row.name),
    ["useQueryTable", "LayoutFrame", "Form.Item"],
  );
});

test("table paginates client data with safe bounds", () => {
  assert.deepEqual(paginateTableData(rows, 2, 2), [rows[2]]);
  assert.deepEqual(paginateTableData(rows, 0, 0), [rows[0]]);
});

test("filter key normalization preserves falsy values and treats empty values as unselected", () => {
  assert.deepEqual(normalizeFilterKeys(["ready", 0]), ["ready", 0]);
  assert.deepEqual(normalizeFilterKeys(false), [false]);
  assert.deepEqual(normalizeFilterKeys(0), [0]);
  assert.deepEqual(normalizeFilterKeys(""), []);
  assert.deepEqual(normalizeFilterKeys(null), []);
  assert.deepEqual(normalizeFilterKeys(undefined), []);
});

test("accessible column titles preserve nested React text, numeric zero and caller spacing", () => {
  assert.equal(columnTitleText({ key: "name", title: "  名称  " }), "  名称  ");
  assert.equal(columnTitleText({ key: "number", title: 0 }), "0");
  const title = React.createElement(
    React.Fragment,
    null,
    React.createElement("strong", null, "Name"),
    [" ", React.createElement("span", { key: "number" }, [0, null, false]), " "],
    React.createElement("svg", null, React.createElement("title", null, "Decorative icon")),
    React.createElement("span", { "aria-hidden": true }, "Hidden decoration"),
  );
  assert.equal(columnTitleText({ key: "name", title }), "Name 0 ");
  assert.equal(
    columnTitleText({
      key: "svg-text",
      title: React.createElement("svg", null, React.createElement("text", null, "Visible")),
    }),
    "Visible",
  );
});

test("empty or icon-only titles use the column key without executing components", () => {
  let calls = 0;
  const CustomTitle = ({ children }: { children?: React.ReactNode }) => {
    calls += 1;
    return children ?? "Dynamic title";
  };
  for (const title of [
    null,
    undefined,
    false,
    " \n ",
    React.createElement(React.Fragment, null),
    React.createElement("svg", null, React.createElement("title", null, "Icon"), React.createElement("path")),
    React.createElement(CustomTitle),
  ]) {
    assert.equal(columnTitleText({ key: "stable-key", title }), "stable-key");
  }
  assert.equal(
    columnTitleText({ key: "name", title: React.createElement(CustomTitle, null, "Static children") }),
    "Static children",
  );
  assert.equal(calls, 0);
});
