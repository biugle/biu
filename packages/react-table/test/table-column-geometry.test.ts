import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Table, type Column } from "../src/index.js";
import "./fixtures/table-functional.js";
import type { Row } from "./fixtures/table-functional.js";

test("Table applies fixed widths to leaf columns and keeps grouped headers aligned", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          {
            key: "identity",
            title: "身份",
            children: [
              { key: "name", title: "名称", dataIndex: "name", width: 180 },
              { key: "status", title: "状态", dataIndex: "status", width: 96 },
            ],
          },
          { key: "owner", title: "负责人", dataIndex: "status", width: 140 },
        ],
        rowKey: "id",
        dataSource: [{ id: 1, name: "张三", status: "正常" }],
      }),
    ),
  );
  try {
    const cols = [...host.querySelectorAll<HTMLTableColElement>("col")];
    assert.deepEqual(
      cols.map((column) => column.style.width),
      ["180px", "96px", ""],
    );
    const header = [...host.querySelectorAll<HTMLTableCellElement>("thead th")];
    assert.equal(header.find((cell) => cell.textContent?.includes("身份"))?.style.width, "276px");
    assert.equal(host.querySelector<HTMLTableCellElement>("tbody td")?.style.width, "180px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table matches grouped fixed header and body offsets with responsive action-column widths", async () => {
  const originalViewportWidth = window.innerWidth;
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1000 });
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const fixedColumns: Column<Row>[] = [
    {
      key: "leftGroup",
      title: "左固定组",
      fixed: "left",
      children: [
        { key: "leftA", title: "左 A", dataIndex: "name", width: 70 },
        { key: "leftB", title: "左 B", dataIndex: "name", width: 90 },
      ],
    },
    { key: "leftC", title: "左 C", dataIndex: "name", width: 60, fixed: "left" },
    { key: "status", title: "状态", dataIndex: "status", width: 200 },
    {
      key: "rightGroup",
      title: "右固定组",
      fixed: "right",
      children: [
        { key: "rightA", title: "右 A", dataIndex: "status", width: 100 },
        { key: "rightB", title: "右 B", dataIndex: "status", width: 90 },
      ],
    },
    { key: "action", title: "操作", dataIndex: "status", fixed: "right", actionColumn: true },
  ];
  const render = (widths: Record<string, number | string> = {}) =>
    React.createElement(Table<Row>, {
      columns: fixedColumns,
      columnWidths: widths,
      rowSelection: { selectedRowKeys: [], onChange() {} },
      expandable: { expandedRowRender: () => "详情" },
      dataSource: [{ id: 1, name: "验证", status: "ready" }],
      rowKey: "id",
    });
  const assertOffsets = (expected: Record<string, string>) => {
    for (const [key, offset] of Object.entries(expected)) {
      const header = host.querySelector<HTMLElement>(`th[data-biu-column-key="${key}"]`)!;
      const body = host.querySelector<HTMLElement>(`td[data-biu-column-key="${key}"]`)!;
      const side = key.startsWith("left") ? "left" : "right";
      assert.equal(header.style.position, "sticky", key);
      assert.equal(body.style.position, "sticky", key);
      assert.equal(header.style[side], offset, `${key} header`);
      assert.equal(body.style[side], offset, `${key} body`);
    }
  };
  await act(async () => root.render(render()));
  try {
    assertOffsets({ leftA: "84px", leftB: "154px", leftC: "244px", action: "0px" });
    for (const key of ["rightA", "rightB"]) {
      const header = host.querySelector<HTMLElement>(`th[data-biu-column-key="${key}"]`)!;
      const body = host.querySelector<HTMLElement>(`td[data-biu-column-key="${key}"]`)!;
      assert.equal(header.style.right, body.style.right);
      assert.match(header.style.right, /\d+px/, `${key} action offset is resolved to pixels`);
    }
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1000 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assertOffsets({ leftA: "84px", leftB: "154px", leftC: "244px", rightA: "280px", rightB: "190px", action: "0px" });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 500 });
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 500 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assertOffsets({ rightA: "150px", rightB: "60px", action: "0px" });
    await act(async () => root.render(render({ leftB: 110, rightB: 120, action: 80 })));
    assertOffsets({ leftA: "84px", leftB: "154px", leftC: "264px", rightA: "200px", rightB: "80px", action: "0px" });
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalViewportWidth });
  }
});

test("Table uses browser breakpoints for action-column defaults when its container is narrower", async () => {
  const originalViewportWidth = window.innerWidth;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const render = () =>
    React.createElement(Table<Row>, {
      columns: [
        { key: "name", title: "名称", dataIndex: "name", width: 180 },
        { key: "actions", title: "操作", dataIndex: "status", actionColumn: true, fixed: "right" },
      ],
      rowKey: "id",
      dataSource: [{ id: 1, name: "动作列", status: "ready" }],
    });
  await act(async () => root.render(render()));
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    for (const { viewport, containerWidth, width, maxCount } of [
      { viewport: 500, containerWidth: 266, width: "60px", maxCount: "1" },
      { viewport: 700, containerWidth: 454, width: "160px", maxCount: "3" },
      { viewport: 1000, containerWidth: 754, width: "190px", maxCount: "5" },
    ]) {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: viewport });
      Object.defineProperty(scroll, "clientWidth", { configurable: true, value: containerWidth });
      await act(async () => window.dispatchEvent(new Event("resize")));
      const col = host.querySelector<HTMLElement>('col[data-biu-column-key="actions"]');
      const header = host.querySelector<HTMLElement>('th[data-biu-column-key="actions"]');
      const cell = host.querySelector<HTMLElement>('td[data-biu-column-key="actions"]');
      assert.ok(col?.classList.contains("biu-table__actions-column"));
      assert.ok(header?.classList.contains("biu-table__actions-column"));
      assert.ok(cell?.classList.contains("biu-table__actions-column"));
      assert.equal(col?.style.width, width);
      assert.equal(cell?.dataset.biuTableActionLimit, maxCount);
    }
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalViewportWidth });
  }
});

test("Table keeps max-content horizontal scroll widths exact when elastic sizing is disabled", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 120, resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 160, resizable: true },
        ],
        dataSource: [{ id: 1, name: "横向布局", status: "ready" }],
        rowKey: "id",
        elasticColumn: false,
        scroll: { x: "max-content" },
      }),
    ),
  );
  try {
    const table = host.querySelector<HTMLTableElement>("table");
    assert.ok(table);
    assert.equal(table.style.width, "max-content");
    assert.equal(table.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "120px");
    assert.equal(table.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "160px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table preserves responsive fixed CSS widths in callbacks and cancels a session on controlled reset", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: Array<Record<string, number | string>> = [];
  const columns: Column<Row>[] = [
    { key: "name", title: "名称", dataIndex: "name", width: 180, resizable: true },
    { key: "status", title: "状态", dataIndex: "status", width: 240 },
    { key: "actions", title: "操作", dataIndex: "status", actionColumn: true, fixed: "right" },
  ];
  const render = (columnWidths: Record<string, number | string>) =>
    React.createElement(Table<Row>, {
      columns,
      columnWidths,
      onColumnWidthsChange: (next) => changes.push(next),
      dataSource: [{ id: 1, name: "验证", status: "ready" }],
      rowKey: "id",
    });
  const initial = { name: 180, status: 240 };
  await act(async () => root.render(render(initial)));
  try {
    const handle = () => host.querySelector<HTMLElement>('[aria-label="名称列宽"]')!;
    await act(async () => handle().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" })));
    assert.equal("actions" in changes.at(-1)!, false);
    await act(async () => {
      handle().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 180, pointerId: 73 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 230, pointerId: 73 }));
    });
    const count = changes.length;
    await act(async () => root.render(render({ name: 200, status: 220 })));
    assert.equal(host.querySelector(".biu-table__resize-preview"), null);
    assert.equal(document.body.classList.contains("biu-table-resizing-global"), false);
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 230, pointerId: 73 })),
    );
    assert.equal(changes.length, count);
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "200px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});
