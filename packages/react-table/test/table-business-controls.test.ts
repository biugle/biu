import assert from "node:assert/strict";
import { readTableStyles } from "./fixtures/styles.js";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { ProTable, TableColumnSettings, type Column } from "../src/index.js";
import { useQueryTable } from "../src/use-query-table.js";
import { columns, type Row } from "./fixtures/table-functional.js";

test("useQueryTable manual cancellation clears fetching state without applying stale results", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let current: { cancel: () => void; isFetching: boolean } | undefined;
  function QueryHarness() {
    const table = useQueryTable<{ id: number }>({
      queryKey: ["manual-cancel"],
      queryFn: ({ signal }) =>
        new Promise<never>((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
        }),
    });
    current = table;
    return React.createElement("span", { id: "fetching" }, String(table.isFetching));
  }
  const root = createRoot(host);
  await act(async () => root.render(React.createElement(QueryHarness)));
  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.equal(current?.isFetching, true);
    await act(async () => current?.cancel());
    assert.equal(current?.isFetching, false);
    assert.equal(host.querySelector("#fetching")?.textContent, "false");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("ProTable leaves business toolbar actions to the caller", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(ProTable<Row>, {
        columns,
        rowKey: "id",
        dataSource: [{ id: 1, name: "新增测试", status: "enabled" }],
        toolbarRight: React.createElement("button", { type: "button" }, "新增"),
        showColumnSettings: false,
        showFullscreen: false,
      }),
    ),
  );
  try {
    assert.equal(host.querySelectorAll(".biu-pro-table__toolbar-right .biu-ui-button").length, 0);
    assert.equal(host.textContent?.includes("新增"), true);
    assert.equal(host.textContent?.includes("导出"), false);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("ProTable toolbar and table pagination share the standard spacing and full-width alignment", () => {
  const styles = readTableStyles();
  assert.match(styles, /\.biu-pro-table__toolbar\s*\{[^}]*margin-bottom:\s*6px;/s);
  assert.match(
    styles,
    /\.biu-table > \.biu-table__pagination\s*\{[^}]*width:\s*100%;[^}]*box-sizing:\s*border-box;[^}]*justify-content:\s*flex-end;/s,
  );
});

test("ProTable column settings move ordinary columns with controls and preserve fixed columns", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const proColumns: Column<Row>[] = [
    { key: "left", title: "固定左列", dataIndex: "name", fixed: "left", width: 120 },
    { key: "first", title: "第一普通列", dataIndex: "status" },
    { key: "second", title: "第二普通列", dataIndex: "name" },
    { key: "right", title: "固定右列", dataIndex: "status", fixed: "right", width: 120 },
  ];
  await act(async () =>
    root.render(
      React.createElement(ProTable<Row>, {
        columns: proColumns,
        rowKey: "id",
        dataSource: [{ id: 1, name: "一行", status: "ready" }],
      }),
    ),
  );
  try {
    const settingsButton = host.querySelector<HTMLButtonElement>(".biu-pro-table__column-settings button");
    assert.ok(settingsButton);
    assert.equal(settingsButton.className.includes("biu-ui-button--secondary"), true);
    assert.equal(settingsButton.querySelector("svg")?.getAttribute("class")?.includes("lucide-settings"), true);
    await act(async () => settingsButton.click());
    const source = document.body.querySelector<HTMLElement>('[data-column-key="second"]');
    const target = document.body.querySelector<HTMLElement>('[data-column-key="first"]');
    const fixed = document.body.querySelector<HTMLElement>('[data-column-key="left"]');
    assert.ok(source);
    assert.ok(target);
    assert.ok(fixed);
    assert.equal(source.draggable, false);
    assert.equal(source.querySelector<HTMLElement>(".biu-pro-table__column-setting-handle"), null);
    assert.equal(source.querySelector<HTMLButtonElement>('button[aria-label="上移第二普通列"]')?.disabled, false);
    assert.equal(fixed.draggable, false);
    assert.equal(fixed.textContent?.includes("锁"), false);
    assert.ok(fixed.querySelector("svg"));
    assert.equal(fixed.querySelector<HTMLInputElement>('input[type="checkbox"]')?.disabled, true);
    await act(async () => fixed.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click());
    assert.equal(
      [...document.body.querySelectorAll<HTMLElement>("[data-column-key]")].map((row) => row.dataset.columnKey)[0],
      "left",
    );
    await act(async () => source.querySelector<HTMLButtonElement>('button[aria-label="上移第二普通列"]')?.click());
    assert.deepEqual(
      [...host.querySelectorAll("thead th")].map((cell) => cell.textContent?.trim()),
      ["固定左列", "第二普通列", "第一普通列", "固定右列"],
    );
    assert.deepEqual(
      [...document.body.querySelectorAll<HTMLElement>("[data-column-key]")].map((row) => row.dataset.columnKey),
      ["left", "second", "first", "right"],
    );
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("ProTable column settings keeps hidden ordinary columns in their full order", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const orderedColumns: Column<Row>[] = [
    { key: "left", title: "固定左列", dataIndex: "name", fixed: "left", width: 120 },
    { key: "first", title: "第一普通列", dataIndex: "status" },
    { key: "hidden", title: "隐藏普通列", dataIndex: "name", hidden: true },
    { key: "second", title: "第二普通列", dataIndex: "name" },
    { key: "right", title: "固定右列", dataIndex: "status", fixed: "right", width: 120 },
  ];
  await act(async () =>
    root.render(
      React.createElement(ProTable<Row>, {
        columns: orderedColumns,
        rowKey: "id",
        dataSource: [{ id: 1, name: "一行", status: "ready" }],
      }),
    ),
  );
  try {
    const settingsButton = host.querySelector<HTMLButtonElement>(".biu-pro-table__column-settings button");
    assert.ok(settingsButton);
    await act(async () => settingsButton.click());
    const keys = () =>
      [...document.body.querySelectorAll<HTMLElement>("[data-column-key]")].map((row) => row.dataset.columnKey);
    assert.deepEqual(keys(), ["left", "first", "hidden", "second", "right"]);
    const hiddenRow = document.body.querySelector<HTMLElement>('[data-column-key="hidden"]');
    assert.ok(hiddenRow);
    assert.equal(hiddenRow.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked, false);
    const firstRow = document.body.querySelector<HTMLElement>('[data-column-key="first"]');
    assert.ok(firstRow);
    await act(async () => firstRow.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click());
    assert.deepEqual(keys(), ["left", "first", "hidden", "second", "right"]);
    await act(async () => firstRow.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click());
    assert.equal(firstRow.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked, true);
    assert.deepEqual(keys(), ["left", "first", "hidden", "second", "right"]);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("ProTable default toolbar settings use the secondary contained visual contract", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(ProTable<Row>, {
        columns,
        rowKey: "id",
        dataSource: [{ id: 1, name: "工具栏测试", status: "ready" }],
        showDensity: true,
        showColumnSettings: true,
        showFullscreen: true,
      }),
    ),
  );
  try {
    for (const label of ["表格密度", "列设置", "全屏"]) {
      const button = host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
      assert.ok(button);
      assert.equal(button.className.includes("biu-ui-button--secondary"), true);
      assert.equal(button.className.includes("biu-ui-button--variant-contained"), true);
      assert.equal(button.querySelector("svg")?.getAttribute("width"), "15");
      assert.equal(button.querySelector("svg")?.getAttribute("height"), "15");
    }
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("TableColumnSettings moves controlled columns with up/down controls", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const settingsColumns: Column<Row>[] = [
    { key: "fixed", title: "固定列", dataIndex: "name", fixed: "left" },
    { key: "first", title: "第一列", dataIndex: "name" },
    { key: "second", title: "第二列", dataIndex: "status" },
  ];
  let order = ["fixed", "first", "second"];
  const render = () =>
    React.createElement(TableColumnSettings<Row>, {
      columns: settingsColumns,
      value: order,
      onChange: (next) => {
        order = next;
        root.render(render());
      },
    });
  await act(async () => root.render(render()));
  try {
    const trigger = host.querySelector<HTMLButtonElement>(".biu-pro-table__column-settings button");
    assert.ok(trigger);
    await act(async () => trigger.click());
    const source = document.body.querySelector<HTMLElement>('[data-column-key="second"]');
    const target = document.body.querySelector<HTMLElement>('[data-column-key="first"]');
    assert.ok(source);
    assert.ok(target);
    await act(async () => source.querySelector<HTMLButtonElement>('button[aria-label="上移第二列"]')?.click());
    assert.deepEqual(order, ["fixed", "second", "first"]);
    assert.equal(
      document.body.querySelector(".biu-pro-table__column-settings-panel")?.getAttribute("data-column-order"),
      "fixed,second,first",
    );
    assert.equal(document.body.querySelector<HTMLElement>('[data-column-key="second"]')?.draggable, false);
    assert.equal(
      document.body
        .querySelector<HTMLElement>('[data-column-key="second"]')
        ?.querySelector(".biu-pro-table__column-setting-handle"),
      null,
    );
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("TableColumnSettings restores a hidden column to its moved position", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const settingsColumns: Column<Row>[] = [
    { key: "fixed", title: "固定列", dataIndex: "name", fixed: "left" },
    { key: "first", title: "第一列", dataIndex: "name" },
    { key: "second", title: "第二列", dataIndex: "status" },
    { key: "third", title: "第三列", dataIndex: "name" },
  ];
  let order = ["fixed", "first", "second", "third"];
  const render = () =>
    React.createElement(TableColumnSettings<Row>, {
      columns: settingsColumns,
      value: order,
      onChange: (next) => {
        order = next;
        root.render(render());
      },
    });
  await act(async () => root.render(render()));
  try {
    const trigger = host.querySelector<HTMLButtonElement>(".biu-pro-table__column-settings button");
    assert.ok(trigger);
    await act(async () => trigger.click());
    const source = document.body.querySelector<HTMLElement>('[data-column-key="third"]');
    assert.ok(source);
    await act(async () => source.querySelector<HTMLButtonElement>('button[aria-label="上移第三列"]')?.click());
    assert.deepEqual(order, ["fixed", "first", "third", "second"]);

    const keys = () =>
      [...document.body.querySelectorAll<HTMLElement>("[data-column-key]")].map((row) => row.dataset.columnKey);
    const thirdRow = () => document.body.querySelector<HTMLElement>('[data-column-key="third"]');
    await act(async () => thirdRow()?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click());
    assert.deepEqual(keys(), ["fixed", "first", "third", "second"]);
    await act(async () => thirdRow()?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click());
    assert.equal(thirdRow()?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked, true);
    assert.deepEqual(keys(), ["fixed", "first", "third", "second"]);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});
