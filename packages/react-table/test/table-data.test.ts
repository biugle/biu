import test from "node:test";
import assert from "node:assert/strict";
import { deriveTableData, paginateTableData } from "../src/ui/data.js";
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
