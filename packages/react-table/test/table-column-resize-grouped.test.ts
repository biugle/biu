import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { ProTable, Table, type Column } from "../src/index.js";
import "./fixtures/table-functional.js";
import type { Row } from "./fixtures/table-functional.js";

test("Table preserves controlled action widths while ordinary resizes balance through the dynamic column", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let setExternalWidths!: (widths: Record<string, number | string>) => void;
  let latest: Record<string, number | string> = {};
  function ControlledTable() {
    const [widths, setWidths] = React.useState<Record<string, number | string>>({
      name: 180,
      owner: 180,
      version: 110,
      status: 110,
    });
    setExternalWidths = setWidths;
    return React.createElement(Table<Row>, {
      columns: [
        { key: "name", title: "能力名称", dataIndex: "name", width: 180, fixed: "left", resizable: true },
        {
          key: "ownerGroup",
          title: "归属信息",
          children: [
            { key: "owner", title: "归属团队", dataIndex: "status", width: 180, resizable: true },
            { key: "version", title: "版本", dataIndex: "status", width: 110, resizable: true },
          ],
        },
        { key: "status", title: "状态", dataIndex: "status", width: 110, resizable: true },
        { key: "action", title: "操作", dataIndex: "status", fixed: "right", actionColumn: true },
      ],
      columnWidths: widths,
      onColumnWidthsChange: (next) => {
        latest = next;
        setWidths(next);
      },
      dataSource: [{ id: 1, name: "验证", status: "ready" }],
      rowKey: "id",
    });
  }
  await act(async () => root.render(React.createElement(ControlledTable)));
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1100 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    const table = host.querySelector<HTMLTableElement>("table")!;
    const width = (key: string) =>
      host.querySelector<HTMLTableColElement>(`col[data-biu-column-key="${key}"]`)!.style.width;
    assert.equal(width("status"), "440px");
    assert.equal(width("action"), "190px");
    const handle = host.querySelector<HTMLElement>('[aria-label="归属团队列宽"]')!;
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 360, pointerId: 84 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 460, pointerId: 84 }));
    });
    assert.equal(width("action"), "190px");
    assert.equal(width("name"), "180px");
    await act(async () => window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 84 })));
    assert.equal(table.style.width, "1100px");
    assert.equal(width("owner"), "280px");
    assert.equal(width("status"), "340px");
    assert.equal(width("version"), "110px");
    assert.equal(Object.hasOwn(latest, "action"), false);
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1300 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(width("status"), "540px");
    assert.equal(width("version"), "110px");
    assert.equal(width("action"), "190px");
    await act(async () => setExternalWidths({ ...latest, action: 120 }));
    const ownerHandle = host.querySelector<HTMLElement>('[aria-label="归属团队列宽"]')!;
    await act(async () => {
      ownerHandle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 360, pointerId: 85 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 460, pointerId: 85 }));
    });
    assert.equal(width("status"), "510px");
    assert.equal(width("action"), "120px");
    await act(async () => window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 85 })));
    assert.equal(latest.action, 120);
    assert.equal(width("action"), "120px");
    assert.equal(width("name"), "180px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table keeps grouped headers aligned when committing a dynamic-column resize beside a fixed action column", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "能力名称", dataIndex: "name", width: 180, fixed: "left" },
          {
            key: "business",
            title: "业务信息",
            children: [
              { key: "status", title: "状态", dataIndex: "status", width: 200, resizable: true },
              {
                key: "updatedAt",
                title: "最近更新",
                dataIndex: "status",
                width: 200,
                minWidth: 100,
                resizable: true,
              },
            ],
          },
          { key: "actions", title: "操作", dataIndex: "status", width: 180, fixed: "right", actionColumn: true },
        ],
        rowKey: "id",
        dataSource: [{ id: 1, name: "固定操作列", status: "正常" }],
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll");
    const table = host.querySelector<HTMLTableElement>("table");
    const groupHeader = host.querySelector<HTMLTableCellElement>('thead th[data-biu-column-key="business"]');
    const updatedAtHeader = host.querySelector<HTMLTableCellElement>('thead th[data-biu-column-key="updatedAt"]');
    const statusHeader = host.querySelector<HTMLTableCellElement>('thead th[data-biu-column-key="status"]');
    const actionColumn = host.querySelector<HTMLTableColElement>('col[data-biu-column-key="actions"]');
    const actionHeader = host.querySelector<HTMLTableCellElement>('thead th[data-biu-column-key="actions"]');
    assert.ok(scroll);
    assert.ok(table);
    assert.ok(groupHeader);
    assert.ok(updatedAtHeader);
    assert.ok(statusHeader);
    assert.ok(actionColumn);
    assert.ok(actionHeader);
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1000 });
    await act(async () => window.dispatchEvent(new Event("resize")));

    const startGroupWidth = Number.parseFloat(groupHeader.style.width);
    const startTargetWidth = Number.parseFloat(updatedAtHeader.style.width);
    const startStatusWidth = Number.parseFloat(statusHeader.style.width);
    const startActionWidth = actionColumn.style.width;
    const handle = updatedAtHeader.querySelector<HTMLElement>(".biu-table__resize-handle");
    assert.ok(handle);
    assert.equal(groupHeader.colSpan, 2);

    await act(async () =>
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 500, pointerId: 87 })),
    );
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 580, pointerId: 87 })),
    );

    const fillColumn = table.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]");
    assert.ok(fillColumn);
    assert.equal(Number.parseFloat(updatedAtHeader.style.width), startTargetWidth);
    assert.equal(Number.parseFloat(groupHeader.style.width), startGroupWidth);
    assert.equal(Number.parseFloat(statusHeader.style.width), startStatusWidth);
    assert.equal(groupHeader.colSpan, 2);
    assert.equal(actionColumn.style.width, startActionWidth);
    assert.equal(actionHeader.style.width, startActionWidth);
    assert.equal(fillColumn.style.width, "0px");

    await act(async () => window.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: 87 })));
    assert.equal(table.querySelector("col[data-biu-resize-fill]"), null);
    assert.equal(Number.parseFloat(groupHeader.style.width), startGroupWidth);
    assert.equal(Number.parseFloat(updatedAtHeader.style.width), startTargetWidth);
    assert.equal(actionHeader.style.width, startActionWidth);

    await act(async () =>
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 500, pointerId: 88 })),
    );
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 580, pointerId: 88 })),
    );
    assert.equal(table.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "0px");
    assert.equal(Number.parseFloat(groupHeader.style.width), startGroupWidth);
    await act(async () => window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 88 })));
    assert.equal(table.style.width, "1000px");
    assert.equal(table.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]"), null);
    assert.equal(actionColumn.style.width, startActionWidth);
    assert.equal(actionHeader.style.width, startActionWidth);
    assert.equal(
      Number.parseFloat(groupHeader.style.width),
      Number.parseFloat(
        host.querySelector<HTMLTableCellElement>('thead th[data-biu-column-key="status"]')!.style.width,
      ) + Number.parseFloat(updatedAtHeader.style.width),
    );
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("ProTable lets the previous ordinary column compensate when directly resizing its dynamic column", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const columns: Column<Row>[] = [
    { key: "name", title: "能力名称", dataIndex: "name", width: 180, minWidth: 180, maxWidth: 180, fixed: "left" },
    { key: "module", title: "所属模块", dataIndex: "status", width: 200, minWidth: 100, maxWidth: 800 },
    {
      key: "updatedAt",
      title: "最近更新",
      dataIndex: "status",
      width: 160,
      minWidth: 120,
      resizable: true,
    },
    {
      key: "actions",
      title: "操作",
      dataIndex: "status",
      fixed: "right",
      actionColumn: true,
      resizable: true,
      minWidth: 80,
      maxWidth: 260,
    },
  ];
  let latestWidths: Record<string, number | string> = {};
  function ControlledShowcase() {
    const [widths, setWidths] = React.useState<Record<string, number | string>>({
      name: 180,
      module: 200,
      updatedAt: 160,
    });
    return React.createElement(ProTable<Row>, {
      columns,
      dataSource: [{ id: 1, name: "验证", status: "2026-10-08" }],
      rowKey: "id",
      columnWidths: widths,
      defaultColumnWidths: { name: 180, module: 200, updatedAt: 160 },
      onColumnWidthsChange: (next) => {
        latestWidths = next;
        setWidths(next);
      },
      elasticColumn: "updatedAt",
      fillRemainingSpace: true,
      showColumnSettings: false,
      showDensity: false,
      showFullscreen: false,
      pagination: false,
    });
  }
  await act(async () => root.render(React.createElement(ControlledShowcase)));
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1000 });
    await act(async () => window.dispatchEvent(new Event("resize")));

    const table = host.querySelector<HTMLTableElement>("table")!;
    const width = (key: string) =>
      Number.parseFloat(host.querySelector<HTMLTableColElement>(`col[data-biu-column-key="${key}"]`)!.style.width);
    const headerWidth = (key: string) =>
      Number.parseFloat(
        host.querySelector<HTMLTableCellElement>(`thead th[data-biu-column-key="${key}"]`)!.style.width,
      );
    const cellWidth = (key: string) =>
      Number.parseFloat(
        host.querySelector<HTMLTableCellElement>(`tbody td[data-biu-column-key="${key}"]`)!.style.width,
      );
    const actionWidth = width("actions");
    assert.equal(table.style.width, "1000px");
    assert.deepEqual([width("name"), width("module"), width("updatedAt"), actionWidth], [180, 200, 430, 190]);

    const handle = host.querySelector<HTMLElement>('[aria-label="最近更新列宽"]')!;
    assert.equal(handle.classList.contains("biu-table__resize-handle--start"), false);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 600, pointerId: 91 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 500, pointerId: 91 }));
    });
    assert.ok(host.querySelector("col[data-biu-resize-fill]"));
    const preview = host.querySelector<HTMLElement>(".biu-table__resize-preview--column");
    assert.ok(preview, "the dynamic column retains a visible guide in ProTable");
    assert.equal(preview.style.display, "");
    assert.equal(
      host.querySelector<HTMLTableCellElement>('thead th[data-biu-column-key="updatedAt"]')?.style.width,
      "430px",
    );
    assert.equal(width("module"), 200);
    assert.equal(width("updatedAt"), 430);

    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 500, pointerId: 91 })),
    );

    assert.deepEqual(latestWidths, { name: 180, module: 300, updatedAt: 330 });
    assert.equal(table.style.width, "1000px");
    assert.equal(host.querySelector("col[data-biu-resize-fill]"), null);
    assert.deepEqual(
      [width("name"), width("module"), width("updatedAt"), width("actions")],
      [180, 300, 330, actionWidth],
    );
    assert.deepEqual(
      ["name", "module", "updatedAt", "actions"].map((key) => headerWidth(key)),
      ["name", "module", "updatedAt", "actions"].map((key) => cellWidth(key)),
    );
    assert.equal(width("name") + width("module") + width("updatedAt") + width("actions"), 1000);

    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1100 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(table.style.width, "1100px");
    assert.equal(width("module"), 300);
    assert.equal(width("updatedAt"), 330);
    assert.equal(width("actions"), actionWidth);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("ProTable clamps a dynamic-column drag when its adjacent column reaches maxWidth", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const columns: Column<Row>[] = [
    { key: "name", title: "能力名称", dataIndex: "name", width: 180, minWidth: 180, maxWidth: 180, fixed: "left" },
    { key: "status", title: "状态", dataIndex: "status", width: 200, minWidth: 100, maxWidth: 250, resizable: true },
    { key: "updatedAt", title: "最近更新", dataIndex: "status", width: 160, minWidth: 120, resizable: true },
    { key: "actions", title: "操作", dataIndex: "status", width: 190, fixed: "right", actionColumn: true },
  ];
  let latestWidths: Record<string, number | string> = {};
  function ControlledShowcase() {
    const [widths, setWidths] = React.useState<Record<string, number | string>>({
      name: 180,
      status: 200,
      updatedAt: 160,
    });
    return React.createElement(ProTable<Row>, {
      columns,
      dataSource: [{ id: 1, name: "验证", status: "2026-10-08" }],
      rowKey: "id",
      columnWidths: widths,
      defaultColumnWidths: { name: 180, status: 200, updatedAt: 160 },
      onColumnWidthsChange: (next) => {
        latestWidths = next;
        setWidths(next);
      },
      elasticColumn: "updatedAt",
      fillRemainingSpace: true,
      showColumnSettings: false,
      showDensity: false,
      showFullscreen: false,
      pagination: false,
    });
  }
  await act(async () => root.render(React.createElement(ControlledShowcase)));
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1000 });
    await act(async () => window.dispatchEvent(new Event("resize")));

    const table = host.querySelector<HTMLTableElement>("table")!;
    const width = (key: string) =>
      Number.parseFloat(host.querySelector<HTMLTableColElement>(`col[data-biu-column-key="${key}"]`)!.style.width);
    assert.deepEqual([width("name"), width("status"), width("updatedAt"), width("actions")], [180, 200, 430, 190]);

    const dynamicHandle = host.querySelector<HTMLElement>('[aria-label="最近更新列宽"]')!;
    await act(async () => {
      dynamicHandle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 600, pointerId: 311 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 500, pointerId: 311 }));
    });

    assert.deepEqual([width("status"), width("updatedAt")], [200, 430]);
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "0px");
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 500, pointerId: 311 })),
    );
    assert.deepEqual(latestWidths, { name: 180, status: 250, updatedAt: 380, actions: 190 });
    assert.equal(table.style.width, "1000px");
    assert.equal(host.querySelector("col[data-biu-resize-fill]"), null);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("ProTable adjusts a non-neighbor column through the dynamic column's current committed width", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const columns: Column<Row>[] = [
    { key: "name", title: "能力名称", dataIndex: "name", width: 180, minWidth: 180, maxWidth: 180, fixed: "left" },
    {
      key: "module",
      title: "所属模块",
      dataIndex: "status",
      width: 200,
      minWidth: 100,
      maxWidth: 800,
      resizable: true,
    },
    { key: "owner", title: "负责人", dataIndex: "status", width: 120, minWidth: 80, maxWidth: 240, resizable: true },
    { key: "status", title: "状态", dataIndex: "status", width: 120, minWidth: 80, maxWidth: 240, resizable: true },
    { key: "updatedAt", title: "最近更新", dataIndex: "status", width: 160, minWidth: 120, resizable: true },
    { key: "actions", title: "操作", dataIndex: "status", width: 190, fixed: "right", actionColumn: true },
  ];
  let latestWidths: Record<string, number | string> = {};
  function ControlledShowcase() {
    const [widths, setWidths] = React.useState<Record<string, number | string>>({
      name: 180,
      module: 200,
      owner: 120,
      status: 120,
      updatedAt: 160,
    });
    return React.createElement(ProTable<Row>, {
      columns,
      dataSource: [{ id: 1, name: "验证", status: "ready" }],
      rowKey: "id",
      columnWidths: widths,
      defaultColumnWidths: { name: 180, module: 200, owner: 120, status: 120, updatedAt: 160 },
      onColumnWidthsChange: (next) => {
        latestWidths = next;
        setWidths(next);
      },
      elasticColumn: "updatedAt",
      fillRemainingSpace: true,
      showColumnSettings: false,
      showDensity: false,
      showFullscreen: false,
      pagination: false,
    });
  }
  await act(async () => root.render(React.createElement(ControlledShowcase)));
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1000 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    const width = (key: string) =>
      Number.parseFloat(host.querySelector<HTMLTableColElement>(`col[data-biu-column-key="${key}"]`)!.style.width);
    const table = host.querySelector<HTMLTableElement>("table")!;
    assert.deepEqual(
      [width("name"), width("module"), width("owner"), width("status"), width("updatedAt")],
      [180, 200, 120, 120, 190],
    );

    const dynamicHandle = host.querySelector<HTMLElement>('[aria-label="最近更新列宽"]')!;
    await act(async () => {
      dynamicHandle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 600, pointerId: 301 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 560, pointerId: 301 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 560, pointerId: 301 }));
    });
    assert.deepEqual(latestWidths, {
      name: 180,
      module: 200,
      owner: 120,
      status: 160,
      updatedAt: 150,
      actions: 190,
    });

    const ownerHandle = host.querySelector<HTMLElement>('[aria-label="负责人列宽"]')!;
    await act(async () => {
      ownerHandle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 300, pointerId: 302 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 270, pointerId: 302 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 270, pointerId: 302 }));
    });
    assert.deepEqual(latestWidths, {
      name: 180,
      module: 200,
      owner: 90,
      status: 160,
      updatedAt: 180,
      actions: 190,
    });
    assert.deepEqual(
      [width("name"), width("module"), width("owner"), width("status"), width("updatedAt")],
      [180, 200, 90, 160, 180],
    );
    assert.equal(table.style.width, "1000px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table keeps fixed and action groups stable when the previous ordinary column compensates", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          {
            key: "fixedGroup",
            title: "固定组",
            fixed: "left",
            children: [
              { key: "leftA", title: "固定 A", dataIndex: "name", width: 70 },
              { key: "leftB", title: "固定 B", dataIndex: "name", width: 90 },
            ],
          },
          { key: "name", title: "名称", dataIndex: "name", width: 120 },
          { key: "status", title: "状态", dataIndex: "status", width: 200, resizable: true },
          {
            key: "actionGroup",
            title: "操作组",
            fixed: "right",
            actionColumn: true,
            children: [{ key: "action", title: "操作", dataIndex: "status" }],
          },
        ],
        rowSelection: { selectedRowKeys: [], onChange() {} },
        expandable: { expandedRowRender: () => "详情" },
        onColumnWidthsChange: (next) => changes.push(next),
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowKey: "id",
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1000 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    const table = host.querySelector<HTMLTableElement>("table")!;
    const widths = () => [...table.querySelectorAll<HTMLTableColElement>("col")].map((col) => col.style.width);
    assert.deepEqual(widths(), ["42px", "42px", "70px", "90px", "120px", "446px", "190px"]);
    const handle = host.querySelector<HTMLElement>('[aria-label="状态列宽"]')!;
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 720, pointerId: 86 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 820, pointerId: 86 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 86 }));
    });
    assert.deepEqual(widths(), ["42px", "42px", "70px", "90px", "48px", "518px", "190px"]);
    assert.deepEqual(changes, [{ leftA: 70, leftB: 90, name: 48, status: 518 }]);
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1200 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.deepEqual(widths(), ["42px", "42px", "70px", "90px", "48px", "518px", "200px", "190px"]);
    assert.equal(host.querySelector<HTMLElement>('th[data-biu-column-key="leftA"]')!.style.position, "sticky");
    assert.equal(host.querySelector<HTMLElement>('th[data-biu-column-key="action"]')!.style.position, "sticky");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table preserves a reduced dynamic width while the table spacer fills viewport surplus", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "left", title: "固定", dataIndex: "name", width: 80, fixed: "left" },
          {
            key: "status",
            title: "状态",
            dataIndex: "status",
            width: 200,
            minWidth: 100,
            maxWidth: 500,
            resizable: true,
          },
          { key: "action", title: "操作", dataIndex: "status", width: 80, fixed: "right", actionColumn: true },
        ],
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowKey: "id",
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 800 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    const handle = host.querySelector<HTMLElement>('[aria-label="状态列宽"]')!;
    await act(async () =>
      handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft", shiftKey: true })),
    );
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')!.style.width, "590px");
    assert.equal(host.querySelector<HTMLTableElement>("table")!.style.width, "800px");
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "50px");
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1200 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(host.querySelector<HTMLTableElement>("table")!.style.width, "1200px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')!.style.width, "590px");
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "450px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="action"]')!.style.width, "80px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});
