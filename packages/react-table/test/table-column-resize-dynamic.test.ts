import assert from "node:assert/strict";
import { readTableStyles } from "./fixtures/styles.js";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Table, type Column } from "../src/index.js";
import "./fixtures/table-functional.js";
import type { Row } from "./fixtures/table-functional.js";

test("Table resizes the dynamic last column against its previous ordinary column", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const widths: Array<[string, number]> = [];
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
        onColumnResize: (key, width) => widths.push([key, width]),
        onColumnWidthsChange: (next) => widthMaps.push(next),
      }),
    ),
  );
  try {
    const handles = host.querySelectorAll<HTMLElement>(".biu-table__resize-handle");
    const handle = handles[1];
    assert.ok(handle);
    assert.equal(handles.length, 2);
    assert.ok(host.querySelector('[aria-label="最近更新列宽"]'));
    assert.equal(handle.classList.contains("biu-table__resize-handle--start"), false);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 460, pointerId: 22 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 420, pointerId: 22 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 420, pointerId: 22 }));
    });
    assert.deepEqual(widths.at(-1), ["status", 200]);
    assert.deepEqual(widthMaps.at(-1), { name: 220, status: 200 });
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table renders the dynamic last-column handle on its trailing edge with shared hover visibility", async () => {
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
      }),
    ),
  );
  try {
    const handle = host.querySelectorAll<HTMLElement>(".biu-table__resize-handle")[1];
    assert.ok(handle);
    assert.equal(handle.classList.contains("biu-table__resize-handle--dynamic"), true);
    assert.equal(handle.getAttribute("role"), "separator");
    assert.ok(handle.querySelector("svg"), "the dynamic column must keep its resize icon");
    const resizeStyles = readTableStyles();
    assert.match(resizeStyles, /\.biu-table__resize-handle\s*\{[^}]*opacity:\s*0/s);
    assert.match(
      resizeStyles,
      /\.biu-table__resize-handle\s*\{[^}]*right:\s*0;/s,
      "the LTR handle remains anchored to the column's trailing edge",
    );
    assert.match(
      resizeStyles,
      /\.biu-table th:hover > \.biu-table__resize-handle\s*\{[^}]*opacity:\s*0\.7/s,
      "every column handle shares the header hover state",
    );
    assert.doesNotMatch(
      resizeStyles,
      /\.biu-table__resize-handle--dynamic\s*\{[^}]*opacity:/s,
      "the dynamic handle does not override shared visibility",
    );
    assert.doesNotMatch(
      resizeStyles,
      /@media\s*\([^)]*hover:\s*none[^)]*\)[\s\S]*?\.biu-table__resize-handle\s*\{[^}]*opacity:\s*0\.55/s,
      "column handles are not permanently visible on touch layouts",
    );
    const nameCell = host.querySelector<HTMLTableCellElement>('tbody td[data-biu-column-key="name"]');
    const statusCell = host.querySelector<HTMLTableCellElement>('tbody td[data-biu-column-key="status"]');
    assert.ok(nameCell && statusCell);
    assert.equal(nameCell.style.width, "180px");
    assert.equal(statusCell.style.width, "240px");
    assert.equal(handle.classList.contains("biu-table__resize-handle--start"), false);
    assert.equal(host.querySelectorAll<HTMLElement>(".biu-table__resize-handle").length, 2);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 420, pointerId: 25 }));
    });
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 380, pointerId: 25 }));
    });
    const preview = host.querySelector<HTMLElement>(".biu-table__resize-preview--column");
    assert.ok(preview, "the dynamic resize keeps its column guide visible");
    assert.equal(preview.style.display, "");
    assert.equal(nameCell.style.width, "180px");
    assert.equal(statusCell.style.width, "240px");
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 380, pointerId: 25 }));
    });
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table keeps the column preview line aligned with a non-trailing pointer move", async () => {
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
      }),
    ),
  );
  try {
    const handle = host.querySelectorAll<HTMLElement>(".biu-table__resize-handle")[0];
    assert.ok(handle);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 180, pointerId: 27 }));
    });
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 220, pointerId: 27 }));
    });
    assert.equal(host.querySelector<HTMLElement>(".biu-table__resize-preview")?.style.left, "220px");
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 220, pointerId: 27 }));
    });
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table keeps the viewport filler while the dynamic column balances against its previous column", async () => {
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
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll");
    const table = host.querySelector<HTMLTableElement>("table");
    const handle = host.querySelectorAll<HTMLElement>(".biu-table__resize-handle")[1];
    assert.ok(scroll && table && handle);
    Object.defineProperty(scroll, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 100,
        right: 700,
        top: 0,
        bottom: 400,
        width: 600,
        height: 400,
        x: 100,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    const statusHeader = host.querySelector<HTMLElement>('th[data-biu-column-key="status"]');
    assert.ok(statusHeader);
    const nameHeader = host.querySelector<HTMLElement>('th[data-biu-column-key="name"]');
    assert.ok(nameHeader);
    const makeRect = (left: number, width: number) => ({
      left,
      right: left + width,
      top: 0,
      bottom: 40,
      width,
      height: 40,
      x: left,
      y: 0,
      toJSON: () => ({}),
    });
    Object.defineProperty(nameHeader, "getBoundingClientRect", {
      configurable: true,
      value: () => makeRect(100, Number.parseFloat(nameHeader.style.width) || 180),
    });
    Object.defineProperty(statusHeader, "getBoundingClientRect", {
      configurable: true,
      value: () => {
        const nameWidth = Number.parseFloat(nameHeader.style.width) || 180;
        const statusWidth = Number.parseFloat(statusHeader.style.width) || 240;
        return makeRect(100 + nameWidth, statusWidth);
      },
    });
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 565, pointerId: 55 }));
    });
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 515, pointerId: 55 }));
    });
    const preview = host.querySelector<HTMLElement>(".biu-table__resize-preview--column");
    assert.ok(preview, "the dynamic resize keeps its column guide visible");
    assert.equal(preview.style.display, "");
    assert.equal(preview.style.left, "370px", "the guide follows the accepted dynamic-column drag before commit");
    assert.equal(table.style.width, "600px");
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "180px");
    assert.ok(host.querySelector("thead .biu-table__resize-fill-cell"));
    assert.ok(host.querySelector("tbody .biu-table__resize-fill-cell"));
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 515, pointerId: 55 }));
    });
    assert.deepEqual(widthMaps.at(-1), { name: 230, status: 190 });
    assert.equal(table.style.width, "600px");
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "180px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table keeps a fixed action column unchanged while an adjacent ordinary column shrinks", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const widthMaps: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, minWidth: 100 },
          { key: "status", title: "最近更新", dataIndex: "status", width: 240, resizable: true, minWidth: 120 },
          { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right", actionColumn: true },
        ],
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "刚刚" }],
        onColumnWidthsChange: (next) => widthMaps.push(next),
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll");
    const table = host.querySelector<HTMLTableElement>("table");
    const actionColumn = host.querySelector<HTMLTableColElement>('col[data-biu-column-key="actions"]');
    const handle = host.querySelector<HTMLElement>('[aria-label="最近更新列宽"]');
    assert.ok(scroll && table && actionColumn && handle);
    Object.defineProperty(scroll, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 100,
        right: 700,
        top: 0,
        bottom: 400,
        width: 600,
        height: 400,
        x: 100,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    const statusHeader = host.querySelector<HTMLElement>('th[data-biu-column-key="status"]');
    assert.ok(statusHeader);
    Object.defineProperty(statusHeader, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 280,
        right: 520,
        top: 0,
        bottom: 40,
        width: 240,
        height: 40,
        x: 280,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 565, pointerId: 56 }));
    });
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 515, pointerId: 56 }));
    });
    assert.equal(table.style.width, "600px");
    assert.equal(actionColumn.style.width, "80px");
    assert.equal(host.querySelector<HTMLTableCellElement>('th[data-biu-column-key="actions"]')?.style.width, "80px");
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "100px");
    const fillerHeader = host.querySelector("thead .biu-table__resize-fill-cell");
    assert.equal(fillerHeader?.nextElementSibling?.getAttribute("data-biu-column-key"), "actions");
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 515, pointerId: 56 }));
    });
    assert.equal(widthMaps.at(-1)?.actions, 80);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table stops a dynamic-column resize when its preceding column reaches maxWidth", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const viewportWidth = 1700;
  const keys = ["name", "module", "owner", "status", "updatedAt"];
  const initialWidths = { name: 190, module: 150, owner: 120, status: 120, updatedAt: 160 };
  const columns: Column<Row>[] = [
    { key: "name", title: "名称", dataIndex: "name", width: 190, resizable: true, minWidth: 120, maxWidth: 320 },
    { key: "module", title: "模块", dataIndex: "status", width: 150, resizable: true, minWidth: 100, maxWidth: 260 },
    { key: "owner", title: "负责人", dataIndex: "name", width: 120, resizable: true, minWidth: 90, maxWidth: 220 },
    { key: "status", title: "状态", dataIndex: "status", width: 120, resizable: true, minWidth: 90, maxWidth: 220 },
    {
      key: "updatedAt",
      title: "最近更新",
      dataIndex: "status",
      width: 160,
      resizable: true,
      minWidth: 120,
      maxWidth: 260,
    },
  ];
  let publishedWidths: Record<string, number | string> = initialWidths;
  function ControlledTable() {
    const [widths, setWidths] = React.useState<Record<string, number | string>>(initialWidths);
    return React.createElement(Table<Row>, {
      columns,
      columnWidths: widths,
      rowKey: "id",
      dataSource: [{ id: 1, name: "能力", status: "ready" }],
      onColumnWidthsChange: (next) => {
        publishedWidths = next;
        setWidths(next);
      },
    });
  }
  await act(async () => root.render(React.createElement(ControlledTable)));
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll");
    const table = host.querySelector<HTMLTableElement>("table");
    assert.ok(scroll && table);
    Object.defineProperty(scroll, "clientWidth", { configurable: true, get: () => viewportWidth });
    Object.defineProperty(scroll, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 100,
        right: 100 + viewportWidth,
        top: 0,
        bottom: 400,
        width: viewportWidth,
        height: 400,
        x: 100,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    const widthFor = (key: string) => {
      const col = table.querySelector<HTMLTableColElement>(`col[data-biu-column-key="${key}"]`);
      return Number.parseFloat(col?.style.width ?? "0") || 0;
    };
    const headerRange = (key: string) => {
      const index = keys.indexOf(key);
      const left = 100 + keys.slice(0, index).reduce((sum, item) => sum + widthFor(item), 0);
      const width = widthFor(key);
      return { left, right: left + width, width };
    };
    Object.defineProperty(table, "getBoundingClientRect", {
      configurable: true,
      value: () => {
        const width = Number.parseFloat(table.style.width) || keys.reduce((sum, key) => sum + widthFor(key), 0);
        return { left: 100, right: 100 + width, top: 0, bottom: 200, width, height: 200, x: 100, y: 0 };
      },
    });
    for (const header of table.querySelectorAll<HTMLElement>("th[data-biu-column-key]")) {
      const key = header.dataset.biuColumnKey;
      if (!key) continue;
      Object.defineProperty(header, "getBoundingClientRect", {
        configurable: true,
        value: () => {
          const { left, right, width } = headerRange(key);
          return { left, right, top: 0, bottom: 40, width, height: 40, x: left, y: 0, toJSON: () => ({}) };
        },
      });
    }
    await act(async () => window.dispatchEvent(new Event("resize")));

    const target = host.querySelector<HTMLElement>('[aria-label="最近更新列宽"]');
    assert.ok(target);
    const startWidth = widthFor("updatedAt");
    const startX = headerRange("updatedAt").right - 2;
    const endX = startX - (startWidth - 120 + 20);
    assert.equal(target.classList.contains("biu-table__resize-handle--start"), false);
    await act(async () => {
      target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: startX, pointerId: 57 }));
    });
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: endX, pointerId: 57 }));
    });
    const previousColumnGrowCapacity = 220 - 120;
    assert.equal(widthFor("updatedAt"), startWidth);
    assert.equal(widthFor("status"), 120);
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: endX, pointerId: 57 }));
    });

    const totalWidth = Object.values(publishedWidths).reduce<number>(
      (sum, width) => sum + Number.parseFloat(String(width)),
      0,
    );
    assert.equal(publishedWidths.updatedAt, startWidth - previousColumnGrowCapacity);
    assert.equal(publishedWidths.status, 220);
    assert.equal(totalWidth, viewportWidth);
    assert.equal(widthFor("updatedAt"), startWidth - previousColumnGrowCapacity);
    assert.equal(
      keys.reduce((sum, key) => sum + widthFor(key), 0),
      viewportWidth,
    );
    assert.equal(table.style.width, `${viewportWidth}px`);
    assert.equal(widthFor("status"), 220);

    const statusHandle = host.querySelector<HTMLElement>('[aria-label="状态列宽"]');
    assert.ok(statusHandle);
    const statusWidth = widthFor("status");
    const updatedAtWidth = widthFor("updatedAt");
    const ownerWidth = widthFor("owner");
    const statusStartX = headerRange("status").right - 2;
    await act(async () => {
      statusHandle.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, clientX: statusStartX, pointerId: 58 }),
      );
    });
    await act(async () => {
      window.dispatchEvent(
        new PointerEvent("pointermove", { bubbles: true, clientX: statusStartX - 30, pointerId: 58 }),
      );
    });
    assert.equal(table.style.width, `${viewportWidth}px`);
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: statusStartX - 30, pointerId: 58 }));
    });

    assert.equal(publishedWidths.status, statusWidth - 30);
    assert.equal(publishedWidths.owner, ownerWidth);
    assert.equal(publishedWidths.updatedAt, updatedAtWidth + 30);
    assert.equal(
      Object.values(publishedWidths).reduce<number>((sum, width) => sum + Number.parseFloat(String(width)), 0),
      viewportWidth,
    );
    assert.equal(
      keys.reduce((sum, key) => sum + widthFor(key), 0),
      viewportWidth,
    );
    assert.equal(table.style.width, `${viewportWidth}px`);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});
