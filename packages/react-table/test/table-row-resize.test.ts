import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { ProTable, Table } from "../src/index.js";
import "./fixtures/table-functional.js";
import type { Row } from "./fixtures/table-functional.js";

test("Table row resizing clamps values and commits without an Escape rollback path", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: Array<[string, number]> = [];
  const heightMaps: Array<Record<string, number>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name" }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "可调行高", status: "ready" }],
        rowResizable: true,
        minRowHeight: 48,
        maxRowHeight: 80,
        onRowResize: (key, height) => changes.push([key, height]),
        onRowHeightsChange: (next) => heightMaps.push(next),
      }),
    ),
  );
  try {
    const handle = host.querySelector<HTMLElement>(".biu-table__row-resize-handle");
    assert.ok(handle);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientY: 100, pointerId: 2 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientY: 140, pointerId: 2 }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientY: 140, pointerId: 2 }));
    });
    assert.deepEqual(changes, [["1", 80]]);
    assert.deepEqual(heightMaps, [{ "1": 80 }]);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table row resize handles expose their range and support arrow, Home and End keys", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: Array<[string, number]> = [];
  const heightMaps: Array<Record<string, number>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name" }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "键盘调整", status: "ready" }],
        rowResizable: true,
        minRowHeight: 40,
        maxRowHeight: 60,
        onRowResize: (key, height) => changes.push([key, height]),
        onRowHeightsChange: (next) => heightMaps.push(next),
      }),
    ),
  );
  try {
    const handle = host.querySelector<HTMLElement>(".biu-table__row-resize-handle");
    const row = handle?.closest<HTMLTableRowElement>("tr");
    const cell = row?.querySelector<HTMLTableCellElement>("td[data-biu-column-key]");
    assert.ok(handle && row && cell);
    assert.equal(handle.getAttribute("role"), "separator");
    assert.equal(handle.getAttribute("aria-orientation"), "horizontal");
    assert.equal(handle.getAttribute("aria-valuemin"), "40");
    assert.equal(handle.getAttribute("aria-valuemax"), "60");
    assert.equal(handle.getAttribute("aria-valuenow"), "40");
    assert.equal(handle.tabIndex, 0);
    assert.equal(row.style.height, "40px");
    assert.equal(cell.style.height, "40px");

    await act(async () => handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" })));
    assert.deepEqual(changes.at(-1), ["1", 50]);
    assert.deepEqual(heightMaps.at(-1), { "1": 50 });
    assert.equal(row.style.height, "50px");
    assert.equal(cell.style.height, "50px");
    assert.equal(host.querySelector(".biu-table__row-resize-handle")?.getAttribute("aria-valuenow"), "50");

    await act(async () => handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" })));
    assert.deepEqual(changes.at(-1), ["1", 60]);
    await act(async () => handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Home" })));
    assert.deepEqual(changes.at(-1), ["1", 40]);
    assert.deepEqual(
      changes.map(([, height]) => height),
      [50, 60, 40],
    );
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table commits a row resize at pointerup even when no pointermove was delivered", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: Array<[string, number]> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name" }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "松手提交", status: "ready" }],
        rowResizable: true,
        minRowHeight: 40,
        maxRowHeight: 80,
        onRowResize: (key, height) => changes.push([key, height]),
      }),
    ),
  );
  try {
    const handle = host.querySelector<HTMLElement>(".biu-table__row-resize-handle");
    const row = handle?.closest<HTMLTableRowElement>("tr");
    const cell = row?.querySelector<HTMLTableCellElement>("td[data-biu-column-key]");
    assert.ok(handle && row && cell);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientY: 100, pointerId: 202 }));
    });
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientY: 130, pointerId: 202 }));
    });
    assert.deepEqual(changes, [["1", 70]]);
    assert.equal(row.style.height, "70px");
    assert.equal(cell.style.height, "70px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("ProTable keeps a controlled row-height resize in the rendered row after pointerup", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const heightMaps: Array<Record<string, number>> = [];
  function ControlledResizeTable() {
    const [rowHeights, setRowHeights] = React.useState<Record<string, number>>({ "1": 48 });
    return React.createElement(ProTable<Row>, {
      columns: [
        { key: "name", title: "名称", dataIndex: "name", width: 180 },
        { key: "status", title: "状态", dataIndex: "status", width: 180 },
      ],
      dataSource: [{ id: 1, name: "可调行高", status: "ready" }],
      rowKey: "id",
      rowHeights,
      defaultRowHeights: { "1": 48 },
      rowResizable: true,
      minRowHeight: 40,
      maxRowHeight: 96,
      onRowHeightsChange: (next) => {
        heightMaps.push(next);
        setRowHeights(next);
      },
      showColumnSettings: false,
      showDensity: false,
      showFullscreen: false,
      pagination: false,
    });
  }
  await act(async () => root.render(React.createElement(ControlledResizeTable)));
  try {
    const handle = host.querySelector<HTMLElement>(".biu-table__row-resize-handle");
    const row = handle?.closest("tr");
    assert.ok(handle && row);
    assert.equal(row.style.height, "48px");
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientY: 100, pointerId: 201 }));
    });
    assert.equal(row.isConnected, true);
    assert.equal(host.querySelector(".biu-table__row-resize-handle")?.closest("tr"), row);
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientY: 130, pointerId: 201 }));
    });
    assert.equal(row.style.height, "78px");
    assert.ok([...row.querySelectorAll<HTMLElement>("td")].every((cell) => cell.style.height === "78px"));
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientY: 130, pointerId: 201 }));
    });
    assert.deepEqual(heightMaps, [{ "1": 78 }]);
    assert.equal(row.style.height, "78px");
    assert.ok([...row.querySelectorAll<HTMLElement>("td")].every((cell) => cell.style.height === "78px"));
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table resize sessions always clean up on pointerup and window blur", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const widths: number[] = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name", width: 120, resizable: true }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "尺寸", status: "ready" }],
        onColumnResize: (_key, width) => widths.push(width),
      }),
    ),
  );
  try {
    const handle = host.querySelector<HTMLElement>(".biu-table__resize-handle");
    assert.ok(handle);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 100, pointerId: 11 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 100, pointerId: 11 }));
    });
    assert.deepEqual(widths, []);
    assert.equal(document.body.classList.contains("biu-table-resizing-global"), false);

    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 100, pointerId: 12 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 180, pointerId: 12 }));
      window.dispatchEvent(new Event("blur"));
    });
    assert.deepEqual(widths, []);
    assert.equal(document.body.classList.contains("biu-table-resizing-global"), false);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});
