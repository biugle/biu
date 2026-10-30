import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Table } from "../src/index.js";
import "./fixtures/table-functional.js";
import type { Row } from "./fixtures/table-functional.js";

test("Table resizable columns keep a minimum width and report the next width", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const widths: Array<[string, number]> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name", width: 120, resizable: true, minWidth: 80 }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "可调宽度", status: "ready" }],
        onColumnResize: (key, width) => widths.push([key, width]),
      }),
    ),
  );
  try {
    const handle = host.querySelector<HTMLElement>(".biu-table__resize-handle");
    assert.ok(handle);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 100, pointerId: 1 }));
      handle.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 180, pointerId: 1 }));
      handle.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 180, pointerId: 1 }));
    });
    // A table with one ordinary column keeps that column as the internal
    // elastic slot. Its committed width is reported through the callback; the
    // col itself intentionally has no inline width so it can absorb the table
    // viewport without a caller-provided flex column.
    assert.equal(host.querySelector<HTMLTableColElement>("col")?.style.width, "");
    assert.deepEqual(widths.at(-1), ["name", 200]);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table does not render resize handles unless resizing is explicitly enabled", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name", width: 120 }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "默认关闭", status: "ready" }],
      }),
    ),
  );
  try {
    assert.equal(host.querySelector(".biu-table__resize-handle"), null);
    assert.equal(host.querySelector(".biu-table__row-resize-handle"), null);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table column resize handles support keyboard adjustment with the same compensation rules", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const widthMaps: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, resizable: true, minWidth: 120 },
          { key: "status", title: "状态", dataIndex: "status", width: 240, minWidth: 120 },
        ],
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "已完成" }],
        onColumnWidthsChange: (next) => widthMaps.push(next),
      }),
    ),
  );
  try {
    const handle = host.querySelector<HTMLElement>('[aria-label="名称列宽"]');
    assert.ok(handle);
    assert.equal(handle.getAttribute("role"), "separator");
    assert.equal(handle.tabIndex, 0);
    await act(async () => {
      handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    });
    assert.deepEqual(widthMaps.at(-1), { name: 190, status: 230 });
    await act(async () => {
      handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Home" }));
    });
    assert.deepEqual(widthMaps.at(-1), { name: 120, status: 300 });
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table clamps a column resize to the configured minimum width", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const widths: number[] = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name", width: 120, resizable: true, minWidth: 80 }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "最小宽度", status: "ready" }],
        onColumnResize: (_key, width) => widths.push(width),
      }),
    ),
  );
  try {
    const handle = host.querySelector<HTMLElement>(".biu-table__resize-handle");
    assert.ok(handle);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 120, pointerId: 21 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 0, pointerId: 21 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 0, pointerId: 21 }));
    });
    assert.deepEqual(widths, [80]);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table commits a column resize at pointerup even when no pointermove was delivered", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: Array<[string, number]> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name", width: 120, resizable: true, minWidth: 80 }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "松手提交", status: "ready" }],
        fillRemainingSpace: false,
        onColumnResize: (key, width) => changes.push([key, width]),
      }),
    ),
  );
  try {
    const handle = host.querySelector<HTMLElement>(".biu-table__resize-handle");
    assert.ok(handle);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 100, pointerId: 203 }));
    });
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 160, pointerId: 203 }));
    });
    assert.deepEqual(changes, [["name", 180]]);
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "180px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table refuses to shrink a column when all following compensation columns are at maxWidth", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const widthMaps: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 190, resizable: true, minWidth: 120 },
          {
            key: "status",
            title: "最近更新",
            dataIndex: "status",
            width: 447,
            resizable: true,
            minWidth: 120,
            maxWidth: 260,
          },
        ],
        elasticColumn: "status",
        columnWidths: { name: 190, status: 447 },
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "刚刚" }],
        onColumnWidthsChange: (next) => widthMaps.push(next),
      }),
    ),
  );
  try {
    const handle = host.querySelector<HTMLElement>('[aria-label="名称列宽"]');
    assert.ok(handle);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 190, pointerId: 26 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 140, pointerId: 26 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 140, pointerId: 26 }));
    });
    assert.equal(widthMaps.length, 0);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table normalizes an oversized controlled width without publishing a no-op resize", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const widthMaps: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 190, resizable: true, minWidth: 120 },
          {
            key: "status",
            title: "最近更新",
            dataIndex: "status",
            width: 447,
            resizable: true,
            minWidth: 120,
            maxWidth: 260,
          },
        ],
        elasticColumn: "status",
        columnWidths: { name: 190, status: 447 },
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "刚刚" }],
        onColumnWidthsChange: (next) => widthMaps.push(next),
      }),
    ),
  );
  try {
    const handle = host.querySelector<HTMLElement>('[aria-label="最近更新列宽"]');
    assert.ok(handle);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 397, pointerId: 28 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 447, pointerId: 28 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 447, pointerId: 28 }));
    });
    assert.equal(widthMaps.length, 0);
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "");
    await act(async () => handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" })));
    assert.equal(widthMaps.length, 0);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table clamps a resized column to maxWidth and compensates with the next column", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const widthMaps: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 190, resizable: true, minWidth: 120, maxWidth: 230 },
          { key: "status", title: "最近更新", dataIndex: "status", width: 220, resizable: true, minWidth: 120 },
        ],
        columnWidths: { name: 190, status: 220 },
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "刚刚" }],
        onColumnWidthsChange: (next) => widthMaps.push(next),
      }),
    ),
  );
  try {
    const handle = host.querySelector<HTMLElement>('[aria-label="名称列宽"]');
    assert.ok(handle);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 190, pointerId: 29 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 300, pointerId: 29 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 300, pointerId: 29 }));
    });
    assert.deepEqual(widthMaps.at(-1), { name: 230, status: 180 });
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table exposes the elastic last column handle when an earlier resizable column is separated by a fixed-width column", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 120 },
          { key: "updated", title: "最近更新", dataIndex: "status", width: 180, resizable: true },
        ],
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "刚刚" }],
      }),
    ),
  );
  try {
    const handles = host.querySelectorAll<HTMLElement>(".biu-table__resize-handle");
    assert.equal(handles.length, 2);
    assert.ok(host.querySelector('[aria-label="最近更新列宽"]'));
    assert.equal(host.querySelector<HTMLTableElement>("table")?.style.width, "100%");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="updated"]')?.style.width, "");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table resizes the dynamic last column and grows the previous column when it shrinks", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const widthMaps: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, resizable: true, minWidth: 120 },
          { key: "status", title: "最近更新", dataIndex: "status", width: 240, resizable: true, minWidth: 120 },
        ],
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "刚刚" }],
        onColumnWidthsChange: (next) => widthMaps.push(next),
      }),
    ),
  );
  try {
    const handle = host.querySelectorAll<HTMLElement>(".biu-table__resize-handle")[1];
    assert.ok(handle);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 1000, pointerId: 23 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 420, pointerId: 23 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 420, pointerId: 23 }));
    });
    assert.deepEqual(widthMaps.at(-1), { name: 300, status: 120 });
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table resizes the last column safely without an elastic column", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const widthMaps: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, resizable: true, minWidth: 120 },
          { key: "status", title: "最近更新", dataIndex: "status", width: 240, resizable: true, minWidth: 120 },
        ],
        elasticColumn: false,
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "刚刚" }],
        onColumnWidthsChange: (next) => widthMaps.push(next),
      }),
    ),
  );
  try {
    const handle = host.querySelectorAll<HTMLElement>(".biu-table__resize-handle")[1];
    assert.ok(handle);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 420, pointerId: 24 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: -1000, pointerId: 24 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: -1000, pointerId: 24 }));
    });
    assert.deepEqual(widthMaps.at(-1), { name: 180, status: 120 });
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table keeps the last-column resize handle usable across consecutive drags", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: Array<[string, number]> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, resizable: true, minWidth: 120 },
          { key: "status", title: "最近更新", dataIndex: "status", width: 240, resizable: true, minWidth: 120 },
        ],
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "刚刚" }],
        onColumnResize: (key, width) => changes.push([key, width]),
      }),
    ),
  );
  try {
    const firstHandle = host.querySelectorAll<HTMLElement>(".biu-table__resize-handle")[1];
    assert.ok(firstHandle);
    await act(async () => {
      firstHandle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 500, pointerId: 31 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 420, pointerId: 31 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 420, pointerId: 31 }));
    });

    const secondHandle = host.querySelectorAll<HTMLElement>(".biu-table__resize-handle")[1];
    assert.ok(secondHandle);
    await act(async () => {
      secondHandle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 450, pointerId: 32 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 500, pointerId: 32 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 500, pointerId: 32 }));
    });

    assert.deepEqual(changes, [
      ["status", 160],
      ["status", 210],
    ]);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table anchors a consecutive last-column drag to the rendered header width", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const measuredWidths: Record<string, number> = { name: 180, status: 300 };
  const changes: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, resizable: true, minWidth: 120 },
          { key: "status", title: "最近更新", dataIndex: "status", width: 240, resizable: true, minWidth: 120 },
        ],
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "刚刚" }],
        onColumnWidthsChange: (next) => {
          changes.push(next);
          for (const [key, value] of Object.entries(next)) {
            if (typeof value === "number") measuredWidths[key] = value;
          }
        },
      }),
    ),
  );
  try {
    host.querySelectorAll<HTMLElement>("th[data-biu-column-key]").forEach((cell) => {
      const key = cell.dataset.biuColumnKey ?? "";
      Object.defineProperty(cell, "getBoundingClientRect", {
        configurable: true,
        value: () => ({
          width: measuredWidths[key] ?? 0,
          height: 40,
          top: 0,
          right: measuredWidths[key] ?? 0,
          bottom: 40,
          left: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }),
      });
    });
    const handle = () => host.querySelectorAll<HTMLElement>(".biu-table__resize-handle")[1];
    await act(async () => {
      handle()?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 550, pointerId: 33 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 500, pointerId: 33 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 500, pointerId: 33 }));
    });
    await act(async () => {
      handle()?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 500, pointerId: 34 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 550, pointerId: 34 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 550, pointerId: 34 }));
    });
    assert.deepEqual(changes, [
      { name: 230, status: 250 },
      { name: 180, status: 300 },
    ]);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table renders every configured resize handle when the elastic column is disabled", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, resizable: true, minWidth: 120 },
          { key: "status", title: "最近更新", dataIndex: "status", width: 240, resizable: true, minWidth: 120 },
        ],
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "刚刚" }],
        elasticColumn: false,
      }),
    ),
  );
  try {
    const handles = host.querySelectorAll<HTMLElement>(".biu-table__resize-handle");
    assert.equal(handles.length, 2);
    assert.ok(host.querySelector('[aria-label="最近更新列宽"]'));
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});
