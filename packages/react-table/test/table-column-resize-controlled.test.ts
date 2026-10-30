import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Table, type Column } from "../src/index.js";
import "./fixtures/table-functional.js";
import type { Row } from "./fixtures/table-functional.js";

test("Table uses the configured dynamic column first and its previous neighbor as fallback", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const widthMaps: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 100, minWidth: 60, resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 100, minWidth: 60 },
          { key: "owner", title: "负责人", dataIndex: "status", width: 100, minWidth: 60 },
          { key: "updated", title: "最近更新", dataIndex: "status", width: 100, minWidth: 60 },
        ],
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "已完成" }],
        onColumnWidthsChange: (next) => widthMaps.push(next),
      }),
    ),
  );
  try {
    const handle = host.querySelector<HTMLElement>(".biu-table__resize-handle");
    assert.ok(handle);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 100, pointerId: 51 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 300, pointerId: 51 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 300, pointerId: 51 }));
    });
    assert.deepEqual(widthMaps.at(-1), { name: 180, status: 100, owner: 60, updated: 60 });
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table does not use a preceding column to compensate ahead of a fixed right column", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const widthMaps: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, minWidth: 120, resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 180, minWidth: 120, resizable: true },
          { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right" },
        ],
        elasticColumn: false,
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "已完成" }],
        onColumnWidthsChange: (next) => widthMaps.push(next),
      }),
    ),
  );
  try {
    const handle = host.querySelectorAll<HTMLElement>(".biu-table__resize-handle")[1];
    assert.ok(handle);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 360, pointerId: 52 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 410, pointerId: 52 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 410, pointerId: 52 }));
    });
    assert.deepEqual(widthMaps.at(-1), { name: 180, status: 230, actions: 80 });
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table restores React-owned column widths after a no-op drag before the next resize", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const widthMaps: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, minWidth: 120, resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 240, minWidth: 120, resizable: true },
        ],
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "已完成" }],
        onColumnWidthsChange: (next) => widthMaps.push(next),
      }),
    ),
  );
  try {
    const getNameColumn = () => host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]');
    const handle = () => host.querySelector<HTMLElement>(".biu-table__resize-handle");
    assert.equal(getNameColumn()?.style.width, "180px");
    await act(async () => {
      handle()?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 180, pointerId: 53 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 180, pointerId: 53 }));
    });
    assert.equal(getNameColumn()?.style.width, "180px");
    await act(async () => {
      handle()?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 180, pointerId: 54 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 200, pointerId: 54 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 200, pointerId: 54 }));
    });
    assert.equal(widthMaps.at(-1)?.name, 200);
    assert.equal(widthMaps.at(-1)?.status, 220);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table freezes fixed and auxiliary widths throughout a measured viewport resize", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: Array<Record<string, number | string>> = [];
  const fixedColumns: Column<Row>[] = [
    { key: "left", title: "左固定", dataIndex: "name", width: 80, fixed: "left" },
    { key: "name", title: "名称", dataIndex: "name", width: 180, minWidth: 120, resizable: true },
    { key: "status", title: "状态", dataIndex: "status", width: 240, minWidth: 120, resizable: true },
    { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right" },
  ];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: fixedColumns,
        rowKey: "id",
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowSelection: { selectedRowKeys: [], onChange() {} },
        expandable: { expandedRowRender: () => "详情" },
        onColumnWidthsChange: (next) => changes.push(next),
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 800 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    const table = host.querySelector<HTMLTableElement>("table")!;
    const widths = () =>
      [...table.querySelectorAll<HTMLTableColElement>("col:not([data-biu-resize-fill])")].map((col) => col.style.width);
    assert.equal(table.style.width, "800px");
    assert.deepEqual(widths(), ["42px", "42px", "80px", "180px", "376px", "80px"]);
    const handle = host.querySelector<HTMLElement>('[aria-label="名称列宽"]')!;
    await act(async () =>
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 344, pointerId: 71 })),
    );
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 444, pointerId: 71 })),
    );
    assert.deepEqual(widths(), ["42px", "42px", "80px", "280px", "276px", "80px"]);
    assert.equal(table.style.width, "800px");
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 444, pointerId: 71 })),
    );
    assert.equal(changes.at(-1)?.left, 80);
    assert.equal(changes.at(-1)?.actions, 80);
    assert.deepEqual(widths(), ["42px", "42px", "80px", "280px", "276px", "80px"]);
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1000 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(table.style.width, "1000px");
    assert.deepEqual(widths(), ["42px", "42px", "80px", "280px", "476px", "80px"]);
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 300 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(table.style.width, "800px");
    assert.deepEqual(widths(), ["42px", "42px", "80px", "280px", "276px", "80px"]);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table keeps dynamic widths stable during preview and commits previous-column compensation on release", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, minWidth: 120, resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 240, minWidth: 120, resizable: true },
          { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right" },
        ],
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowKey: "id",
        onColumnWidthsChange: (widths) => changes.push(widths),
      }),
    ),
  );
  try {
    const handle = host.querySelector<HTMLElement>('[aria-label="状态列宽"]')!;
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 420, pointerId: 72 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 300, pointerId: 72 }));
    });
    const preview = host.querySelector<HTMLElement>(".biu-table__resize-preview--column");
    assert.ok(preview, "the resize guide stays visible while the previous column compensates");
    assert.equal(preview.style.display, "");
    assert.equal(host.querySelector<HTMLTableElement>("table")?.style.width, "500px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "180px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "240px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="actions"]')?.style.width, "80px");
    await act(async () => window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 72 })));
    assert.equal(host.querySelector(".biu-table__resize-preview"), null);
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "300px");
    assert.deepEqual(changes.at(-1), { name: 300, status: 120, actions: 80 });
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="actions"]')?.style.width, "80px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table excludes hidden nested leaves and empty groups from column geometry", async () => {
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
              { key: "hidden", title: "隐藏列", width: 999, hidden: true },
            ],
          },
          { key: "empty", title: "空分组", children: [{ key: "other", title: "其他", hidden: true }] },
          { key: "status", title: "状态", dataIndex: "status", width: 240 },
        ],
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowKey: "id",
      }),
    ),
  );
  try {
    assert.deepEqual(
      [...host.querySelectorAll<HTMLTableColElement>("col")].map((col) => col.dataset.biuColumnKey),
      ["name", "status"],
    );
    assert.equal(host.querySelector('th[data-biu-column-key="identity"]')?.getAttribute("colspan"), "1");
    assert.equal(host.querySelector('th[data-biu-column-key="empty"]'), null);
    assert.equal(host.querySelector('th[data-biu-column-key="hidden"]'), null);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table keeps a new controlled value that equals the live drag preview", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const columns: Column<Row>[] = [
    { key: "name", title: "名称", dataIndex: "name", width: 120, minWidth: 80, resizable: true },
    { key: "status", title: "状态", dataIndex: "status", width: 240, minWidth: 80 },
  ];
  const render = (columnWidths: Record<string, number | string>) =>
    React.createElement(Table<Row>, {
      columns,
      columnWidths,
      dataSource: [{ id: 1, name: "验证", status: "ready" }],
      rowKey: "id",
    });
  await act(async () => root.render(render({ name: 120, status: 240 })));
  try {
    const handle = host.querySelector<HTMLElement>('[aria-label="名称列宽"]')!;
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 120, pointerId: 74 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 240, pointerId: 74 }));
    });
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "240px");
    await act(async () => root.render(render({ status: 240, name: 120 })));
    assert.ok(host.querySelector(".biu-table__resize-preview"));
    assert.equal(document.body.classList.contains("biu-table-resizing-global"), true);
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 240, pointerId: 74 })),
    );
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "240px");
    await act(async () => root.render(render({ name: 240, status: 120 })));
    assert.equal(host.querySelector(".biu-table__resize-preview"), null);
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "240px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "");
    assert.equal(document.body.classList.contains("biu-table-resizing-global"), false);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table cancels a drag when selection, expansion or horizontal sizing changes", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const columns: Column<Row>[] = [
    { key: "name", title: "名称", dataIndex: "name", width: 120, resizable: true },
    { key: "status", title: "状态", dataIndex: "status", width: 240 },
  ];
  const columnWidths = { name: 120, status: 240 };
  let commits = 0;
  const render = (options: Partial<React.ComponentProps<typeof Table<Row>>>) =>
    React.createElement(Table<Row>, {
      columns,
      columnWidths,
      onColumnWidthsChange: () => commits++,
      dataSource: [{ id: 1, name: "验证", status: "ready" }],
      rowKey: "id",
      ...options,
    });
  try {
    for (const options of [
      { rowSelection: { selectedRowKeys: [], onChange() {} } },
      { expandable: { expandedRowRender: () => "详情" } },
      { scroll: { x: "max-content" } },
    ]) {
      await act(async () => root.render(render({})));
      const handle = host.querySelector<HTMLElement>('[aria-label="名称列宽"]')!;
      await act(async () => {
        handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 120, pointerId: 75 }));
        window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 180, pointerId: 75 }));
      });
      await act(async () => root.render(render(options)));
      assert.equal(host.querySelector(".biu-table__resize-preview"), null);
      assert.equal(document.body.classList.contains("biu-table-resizing-global"), false);
      await act(async () => window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 75 })));
      assert.equal(commits, 0);
    }
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});
