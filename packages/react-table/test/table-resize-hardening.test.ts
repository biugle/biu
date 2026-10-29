import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { ProTable, Table, type Column } from "../src/index.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
Object.assign(globalThis, {
  document: dom.window.document,
  window: dom.window,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
  HTMLSelectElement: dom.window.HTMLSelectElement,
  DocumentFragment: dom.window.DocumentFragment,
  Event: dom.window.Event,
  KeyboardEvent: dom.window.KeyboardEvent,
  MouseEvent: dom.window.MouseEvent,
  PointerEvent: dom.window.PointerEvent ?? dom.window.MouseEvent,
  Node: dom.window.Node,
  CustomEvent: dom.window.CustomEvent,
  MutationObserver: dom.window.MutationObserver,
  getComputedStyle: dom.window.getComputedStyle,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
class TestResizeObserver {
  observe() {}
  disconnect() {}
}
Object.assign(dom.window, {
  ResizeObserver: TestResizeObserver,
  requestAnimationFrame: (callback: FrameRequestCallback) => dom.window.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => dom.window.clearTimeout(id),
});
Object.assign(globalThis, {
  ResizeObserver: TestResizeObserver,
  requestAnimationFrame: (callback: FrameRequestCallback) => dom.window.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => dom.window.clearTimeout(id),
});
Object.assign(dom.window.HTMLElement.prototype, { attachEvent() {}, detachEvent() {} });

type Row = { id: number; name: string; status: string };
const columns: Column<Row>[] = [
  { key: "name", title: "名称", dataIndex: "name", sortable: true },
  { key: "status", title: "状态", dataIndex: "status" },
];

async function mount(node: React.ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  let root!: Root;
  await act(async () => {
    root = createRoot(host);
    root.render(node);
  });
  return { host, root };
}

async function unmount(rendered: { host: HTMLDivElement; root: Root }) {
  await act(async () => rendered.root.unmount());
  rendered.host.remove();
  document.body.replaceChildren();
}

test("Table reports the selected state from rowSelection.onSelect", async () => {
  const selectedStates: boolean[] = [];
  function SelectionTable() {
    const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);
    return React.createElement(Table<Row>, {
      columns,
      rowKey: "id",
      dataSource: [{ id: 1, name: "第一行", status: "enabled" }],
      rowSelection: {
        selectedRowKeys,
        onChange: setSelectedRowKeys,
        onSelect: (_record, selected) => selectedStates.push(selected),
      },
    });
  }
  const rendered = await mount(React.createElement(SelectionTable));
  try {
    const checkbox = rendered.host.querySelector<HTMLInputElement>('tbody input[type="checkbox"]');
    assert.ok(checkbox);
    await act(async () => checkbox.click());
    await act(async () => checkbox.click());
    assert.deepEqual(selectedStates, [true, false]);
  } finally {
    await unmount(rendered);
  }
});

test("Table previews non-virtual row resizes without re-rendering every row on pointer moves", async () => {
  let rowRenderCount = 0;
  const CountedRow = (props: React.HTMLAttributes<HTMLTableRowElement>) => {
    rowRenderCount += 1;
    return React.createElement("tr", props);
  };
  const rendered = await mount(
    React.createElement(Table<Row>, {
      columns: [{ key: "name", title: "名称", dataIndex: "name" }],
      rowKey: "id",
      dataSource: [
        { id: 1, name: "第一行", status: "ready" },
        { id: 2, name: "第二行", status: "ready" },
        { id: 3, name: "第三行", status: "ready" },
      ],
      rowResizable: true,
      minRowHeight: 40,
      maxRowHeight: 100,
      components: { row: CountedRow },
    }),
  );
  try {
    const handle = rendered.host.querySelector<HTMLElement>(".biu-table__row-resize-handle");
    const row = handle?.closest<HTMLTableRowElement>("tr");
    assert.ok(handle && row);
    await act(async () =>
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientY: 100, pointerId: 501 })),
    );
    const rendersAfterStart = rowRenderCount;
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientY: 130, pointerId: 501 })),
    );
    assert.equal(rowRenderCount, rendersAfterStart);
    assert.equal(row.style.height, "70px");
    assert.equal(handle.getAttribute("aria-valuenow"), "70");
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientY: 130, pointerId: 501 })),
    );
  } finally {
    await unmount(rendered);
  }
});

test("Table does not publish a row resize when a handle is clicked without changing height", async () => {
  let changes = 0;
  const rendered = await mount(
    React.createElement(Table<Row>, {
      columns: [{ key: "name", title: "名称", dataIndex: "name" }],
      rowKey: "id",
      dataSource: [{ id: 1, name: "不应提交", status: "ready" }],
      rowResizable: true,
      onRowHeightsChange: () => changes++,
      onRowResize: () => changes++,
    }),
  );
  try {
    const handle = rendered.host.querySelector<HTMLElement>(".biu-table__row-resize-handle");
    assert.ok(handle);
    await act(async () =>
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientY: 100, pointerId: 502 })),
    );
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientY: 100, pointerId: 502 })),
    );
    assert.equal(changes, 0);
  } finally {
    await unmount(rendered);
  }
});

test("Table stops a dynamic-column resize at its neighbor bound instead of creating a large spacer", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const columns: Column<Row>[] = [
    { key: "name", title: "能力名称", dataIndex: "name", width: 190, minWidth: 120, maxWidth: 320, resizable: true },
    { key: "module", title: "模块", dataIndex: "status", width: 150, minWidth: 100, maxWidth: 260, resizable: true },
    { key: "owner", title: "负责人", dataIndex: "status", width: 120, minWidth: 90, maxWidth: 220, resizable: true },
    { key: "status", title: "状态", dataIndex: "status", width: 120, minWidth: 90, maxWidth: 220, resizable: true },
    { key: "updatedAt", title: "最近更新", dataIndex: "status", width: 160, minWidth: 120, resizable: true },
  ];
  let latestWidths: Record<string, number | string> = {};
  function ControlledShowcase() {
    const [widths, setWidths] = React.useState<Record<string, number | string>>({
      name: 190,
      module: 150,
      owner: 120,
      status: 120,
      updatedAt: 160,
    });
    return React.createElement(ProTable<Row>, {
      columns,
      dataSource: [{ id: 1, name: "验证", status: "2026-10-08" }],
      rowKey: "id",
      columnWidths: widths,
      defaultColumnWidths: { name: 190, module: 150, owner: 120, status: 120, updatedAt: 160 },
      onColumnWidthsChange: (next) => {
        latestWidths = next;
        setWidths(next);
      },
      showColumnSettings: false,
      showDensity: false,
      showFullscreen: false,
      pagination: false,
    });
  }
  await act(async () => root.render(React.createElement(ControlledShowcase)));
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1600 });
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
    assert.equal(width("updatedAt"), 1020);
    assert.equal(headerWidth("updatedAt"), 1020);
    assert.equal(cellWidth("updatedAt"), 1020);

    const handle = host.querySelector<HTMLElement>('[aria-label="最近更新列宽"]')!;
    await act(async () =>
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 1200, pointerId: 92 })),
    );
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 300, pointerId: 92 })),
    );
    assert.equal(width("updatedAt"), 1020);
    assert.equal(width("status"), 120);
    assert.equal(headerWidth("updatedAt"), 1020);
    assert.equal(cellWidth("updatedAt"), 1020);
    assert.equal(headerWidth("status"), 120);
    assert.equal(cellWidth("status"), 120);
    const preview = host.querySelector<HTMLElement>(".biu-table__resize-preview--column");
    assert.ok(preview, "the dynamic column keeps a visible resize guide");
    assert.equal(preview.style.display, "");
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "0px");

    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 300, pointerId: 92 })),
    );

    assert.deepEqual(latestWidths, { name: 190, module: 150, owner: 120, status: 220, updatedAt: 920 });
    assert.equal(table.style.width, "1600px");
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]"), null);
    assert.deepEqual(["name", "module", "owner", "status", "updatedAt"].map(width), [190, 150, 120, 220, 920]);
    assert.equal(
      ["name", "module", "owner", "status", "updatedAt"].reduce((sum, key) => sum + width(key), 0),
      1600,
    );
    for (const key of ["name", "module", "owner", "status", "updatedAt"])
      assert.equal(headerWidth(key), cellWidth(key), `${key} header and body widths stay aligned`);

    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1700 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(table.style.width, "1700px");
    assert.equal(width("status"), 220);
    assert.equal(width("updatedAt"), 920);
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "100px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table keeps the configured dynamic column and applies repeated resize deltas to it gradually", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let latestWidths: Record<string, number | string> = {};
  const columns: Column<Row>[] = [
    { key: "name", title: "能力名称", dataIndex: "name", width: 190, resizable: true },
    { key: "module", title: "模块", dataIndex: "status", width: 150, resizable: true },
    { key: "owner", title: "负责人", dataIndex: "status", width: 180, resizable: true },
    { key: "status", title: "状态", dataIndex: "status", width: 120, resizable: true },
    { key: "updatedAt", title: "最近更新", dataIndex: "status", width: 160, resizable: true },
  ];
  function ControlledTable() {
    const [widths, setWidths] = React.useState<Record<string, number | string>>({
      name: 190,
      module: 150,
      owner: 180,
      status: 120,
      updatedAt: 160,
    });
    return React.createElement(Table<Row>, {
      columns,
      dataSource: [{ id: 1, name: "验证", status: "ready" }],
      rowKey: "id",
      elasticColumn: "updatedAt",
      columnWidths: widths,
      onColumnWidthsChange: (next) => {
        latestWidths = next;
        setWidths(next);
      },
    });
  }
  await act(async () => root.render(React.createElement(ControlledTable)));
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1600 });
    await act(async () => window.dispatchEvent(new Event("resize")));

    const width = (key: string) =>
      Number.parseFloat(host.querySelector<HTMLTableColElement>(`col[data-biu-column-key="${key}"]`)!.style.width);
    const resize = async (key: string, from: number, to: number, pointerId: number) => {
      const handle = host.querySelector<HTMLElement>(`[aria-label="${key}列宽"]`)!;
      await act(async () => {
        handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: from, pointerId }));
        window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: to, pointerId }));
        window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: to, pointerId }));
      });
    };

    await resize("最近更新", 2100, 1188, 96);
    assert.deepEqual(latestWidths, { name: 190, module: 150, owner: 180, status: 1032, updatedAt: 48 });

    await resize("负责人", 700, 660, 97);
    assert.deepEqual(latestWidths, { name: 190, module: 150, owner: 140, status: 1032, updatedAt: 88 });
    assert.deepEqual(["owner", "status", "updatedAt"].map(width), [140, 1032, 88]);

    await resize("模块", 700, 670, 98);
    assert.deepEqual(latestWidths, { name: 190, module: 120, owner: 140, status: 1032, updatedAt: 118 });
    assert.deepEqual(["owner", "module", "status", "updatedAt"].map(width), [140, 120, 1032, 118]);

    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1700 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.deepEqual(["owner", "module", "status", "updatedAt"].map(width), [140, 120, 1032, 218]);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table exact-content mode keeps each column header aligned with its body cell", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const columns: Column<Row>[] = [
    { key: "name", title: "能力名称", dataIndex: "name", width: 180, minWidth: 180, maxWidth: 180, fixed: "left" },
    { key: "module", title: "模块", dataIndex: "status", width: 200, minWidth: 100, maxWidth: 800 },
    { key: "updatedAt", title: "最近更新", dataIndex: "status", width: 160, minWidth: 120 },
    {
      key: "actions",
      title: "操作",
      actionColumn: true,
      resizable: true,
      minWidth: 80,
      maxWidth: 260,
      render: () => "查看",
    },
  ];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns,
        fillRemainingSpace: false,
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowKey: "id",
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    const table = host.querySelector<HTMLTableElement>("table")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1500 });
    Object.defineProperty(scroll, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 0, right: 1500, width: 1500 }),
    });
    await act(async () => window.dispatchEvent(new Event("resize")));

    assert.equal(table.style.width, "730px");
    for (const key of ["name", "module", "updatedAt", "actions"]) {
      const col = host.querySelector<HTMLTableColElement>(`col[data-biu-column-key="${key}"]`)!;
      const header = host.querySelector<HTMLTableCellElement>(`thead th[data-biu-column-key="${key}"]`)!;
      const cell = host.querySelector<HTMLTableCellElement>(`tbody td[data-biu-column-key="${key}"]`)!;
      assert.equal(col.style.width, header.style.width, `${key} col and header widths match`);
      assert.equal(col.style.width, cell.style.width, `${key} col and body widths match`);
    }

    assert.equal(
      host.querySelector<HTMLTableCellElement>('thead th[data-biu-column-key="actions"]')!.dataset.biuFixed,
      undefined,
    );
    assert.equal(
      host.querySelector<HTMLTableCellElement>('tbody td[data-biu-column-key="actions"]')!.dataset.biuFixed,
      undefined,
    );
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table fixed resize handles follow their physical inner edge for pointer, keyboard and scrolling in LTR and RTL", async () => {
  const style = document.createElement("style");
  style.textContent = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  document.head.append(style);
  try {
    for (const direction of ["ltr", "rtl"])
      for (const fixed of ["left", "right"] as const) {
        const host = document.createElement("div");
        document.body.append(host);
        const root = createRoot(host);
        const changes: Array<Record<string, number | string>> = [];
        const target: Column<Row> = {
          key: "fixed",
          title: "固定",
          dataIndex: "name",
          width: 180,
          fixed,
          resizable: true,
          minWidth: 100,
          maxWidth: 260,
        };
        const ordinary: Column<Row> = { key: "ordinary", title: "普通", dataIndex: "status", width: 820 };
        await act(async () =>
          root.render(
            React.createElement(Table<Row>, {
              columns: fixed === "left" ? [target, ordinary] : [ordinary, target],
              fillRemainingSpace: false,
              onColumnWidthsChange: (next) => changes.push(next),
              dataSource: [{ id: 1, name: "验证", status: "ready" }],
              rowKey: "id",
            }),
          ),
        );
        try {
          const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
          const table = host.querySelector<HTMLTableElement>("table")!;
          const col = host.querySelector<HTMLTableColElement>('col[data-biu-column-key="fixed"]')!;
          const header = host.querySelector<HTMLElement>('th[data-biu-column-key="fixed"]')!;
          const handle = header.querySelector<HTMLElement>(".biu-table__resize-handle")!;
          scroll.style.direction = direction;
          handle.style.direction = direction;
          Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 800 });
          Object.defineProperty(scroll, "getBoundingClientRect", {
            configurable: true,
            value: () => ({ left: 100, right: 900, width: 800 }),
          });
          Object.defineProperty(header, "getBoundingClientRect", {
            configurable: true,
            value: () => {
              const width = Number.parseFloat(col.style.width) || 180;
              return { left: fixed === "left" ? 100 : 900 - width, right: fixed === "left" ? 100 + width : 900, width };
            },
          });
          await act(async () => window.dispatchEvent(new Event("resize")));
          const computed = window.getComputedStyle(handle);
          assert.equal(computed[fixed === "left" ? "right" : "left"], "0px");
          assert.equal(computed[fixed === "left" ? "left" : "right"], "auto");
          const startX = fixed === "left" ? 275 : 725;
          const growX = startX + (fixed === "left" ? 80 : -80);
          await act(async () => {
            handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: startX, pointerId: 90 }));
            window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: growX, pointerId: 90 }));
          });
          assert.equal(col.style.width, "260px");
          assert.equal(table.style.width, "1080px");
          const boundary = fixed === "left" ? 260 : 540;
          assert.equal(host.querySelector<HTMLElement>(".biu-table__resize-preview")!.style.left, `${boundary}px`);
          assert.equal(changes.length, 0);
          scroll.scrollLeft = direction === "rtl" ? -30 : 30;
          await act(async () => scroll.dispatchEvent(new Event("scroll")));
          assert.equal(
            host.querySelector<HTMLElement>(".biu-table__resize-preview")!.style.left,
            `${boundary + scroll.scrollLeft}px`,
          );
          await act(async () => window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 90 })));
          assert.deepEqual(
            changes.at(-1),
            fixed === "left" ? { fixed: 260, ordinary: 820 } : { ordinary: 820, fixed: 260 },
          );
          await act(async () =>
            handle.dispatchEvent(
              new KeyboardEvent("keydown", { bubbles: true, key: fixed === "left" ? "ArrowLeft" : "ArrowRight" }),
            ),
          );
          assert.equal(col.style.width, "250px");
          await act(async () =>
            handle.dispatchEvent(
              new KeyboardEvent("keydown", { bubbles: true, key: fixed === "left" ? "ArrowRight" : "ArrowLeft" }),
            ),
          );
          assert.equal(col.style.width, "260px");
          await act(async () => handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Home" })));
          assert.equal(col.style.width, "100px");
          assert.equal(
            host.querySelector<HTMLTableColElement>('col[data-biu-column-key="ordinary"]')!.style.width,
            "820px",
          );
        } finally {
          await act(async () => root.unmount());
          host.remove();
          document.body.replaceChildren();
        }
      }
  } finally {
    style.remove();
  }
});

test("Table keeps fixed inner boundaries anchored when exact content becomes shorter than its viewport", async () => {
  for (const direction of ["ltr", "rtl"]) {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () =>
      root.render(
        React.createElement(Table<Row>, {
          columns: [
            { key: "left", title: "左固定", dataIndex: "name", width: 80, fixed: "left" },
            { key: "ordinary", title: "普通", dataIndex: "status", width: 200 },
            {
              key: "right",
              title: "右固定",
              dataIndex: "status",
              width: 120,
              fixed: "right",
              resizable: true,
              minWidth: 80,
            },
          ],
          fillRemainingSpace: false,
          dataSource: [{ id: 1, name: "验证", status: "ready" }],
          rowKey: "id",
        }),
      ),
    );
    try {
      const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
      const table = host.querySelector<HTMLTableElement>("table")!;
      const col = host.querySelector<HTMLTableColElement>('col[data-biu-column-key="right"]')!;
      const header = host.querySelector<HTMLElement>('th[data-biu-column-key="right"]')!;
      const handle = header.querySelector<HTMLElement>(".biu-table__resize-handle")!;
      let viewportWidth = 800;
      scroll.style.direction = direction;
      handle.style.direction = direction;
      Object.defineProperty(scroll, "clientWidth", { configurable: true, get: () => viewportWidth });
      Object.defineProperty(scroll, "getBoundingClientRect", {
        configurable: true,
        value: () => ({ left: 100, right: 100 + viewportWidth, width: viewportWidth }),
      });
      Object.defineProperty(table, "getBoundingClientRect", {
        configurable: true,
        value: () => {
          const width = Number.parseFloat(table.style.width);
          return {
            left: direction === "rtl" ? 100 + viewportWidth - width : 100,
            right: direction === "rtl" ? 100 + viewportWidth : 100 + width,
            width,
          };
        },
      });
      Object.defineProperty(header, "getBoundingClientRect", {
        configurable: true,
        value: () => {
          const width = Number.parseFloat(col.style.width);
          const tableBounds = table.getBoundingClientRect();
          const shift = Number.parseFloat(header.style.getPropertyValue("--biu-table-fixed-shift")) || 0;
          const right = direction === "rtl" ? tableBounds.left + width : tableBounds.right;
          return { left: right + shift - width, right: right + shift, width };
        },
      });
      await act(async () => window.dispatchEvent(new Event("resize")));
      const shiftKey = "--biu-table-fixed-shift";
      assert.equal(header.style.getPropertyValue(shiftKey), direction === "rtl" ? "280px" : "400px");
      await act(async () => {
        handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 785, pointerId: 91 }));
        window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 805, pointerId: 91 }));
      });
      assert.equal(col.style.width, "100px");
      assert.equal(table.style.width, "380px");
      assert.equal(header.style.getPropertyValue(shiftKey), direction === "rtl" ? "280px" : "420px");
      assert.equal(header.getBoundingClientRect().right, 900);
      assert.equal(host.querySelector<HTMLElement>(".biu-table__resize-preview")!.style.left, "700px");
      await act(async () => window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 91 })));
      viewportWidth = 1000;
      await act(async () => window.dispatchEvent(new Event("resize")));
      assert.equal(header.style.getPropertyValue(shiftKey), direction === "rtl" ? "280px" : "620px");
      assert.equal(table.style.width, "380px");
      assert.equal(
        host.querySelector<HTMLTableColElement>('col[data-biu-column-key="ordinary"]')!.style.width,
        "200px",
      );
      assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="left"]')!.style.width, "80px");
    } finally {
      await act(async () => root.unmount());
      host.remove();
      document.body.replaceChildren();
    }
  }
});

test("Table places unequal fixed groups on physical sides without overlapping or reordering ordinary RTL columns", async () => {
  const style = document.createElement("style");
  style.textContent = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  document.head.append(style);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const source: Column<Row>[] = [
    {
      key: "leftGroup",
      title: "左组",
      fixed: "left",
      children: [
        { key: "leftA", title: "左 A", dataIndex: "name", width: 100 },
        { key: "leftB", title: "左 B", dataIndex: "name", width: 80 },
      ],
    },
    {
      key: "ordinaryGroup",
      title: "普通组",
      children: [
        { key: "a", title: "普通 A", dataIndex: "status", width: 200, resizable: true },
        { key: "b", title: "普通 B", dataIndex: "status", width: 120, resizable: true },
      ],
    },
    {
      key: "rightGroup",
      title: "右组",
      fixed: "right",
      children: [
        { key: "rightA", title: "右 A", dataIndex: "status", width: 50 },
        {
          key: "action",
          title: "操作",
          dataIndex: "status",
          width: 130,
          actionColumn: true,
          resizable: true,
          minWidth: 80,
        },
      ],
    },
  ];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: source,
        fillRemainingSpace: false,
        rowSelection: { selectedRowKeys: [], onChange() {} },
        expandable: { expandedRowRender: () => "详情" },
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowKey: "id",
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    const table = host.querySelector<HTMLTableElement>("table")!;
    const tableRoot = host.querySelector<HTMLElement>(".biu-table")!;
    const cols = [...table.querySelectorAll<HTMLTableColElement>("col")];
    const keys = ["selection", "expand", "leftA", "leftB", "a", "b", "rightA", "action"];
    let direction = "rtl";
    let viewportWidth = 1027;
    const widthFor = (key: string) => Number.parseFloat(cols[keys.indexOf(key)]!.style.width);
    const totalWidth = () => keys.reduce((sum, key) => sum + widthFor(key), 0);
    Object.defineProperty(scroll, "clientWidth", { configurable: true, get: () => viewportWidth });
    Object.defineProperty(scroll, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 20, right: 20 + viewportWidth, width: viewportWidth }),
    });
    Object.defineProperty(table, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: direction === "rtl" ? 20 + viewportWidth - totalWidth() : 20,
        right: direction === "rtl" ? 20 + viewportWidth : 20 + totalWidth(),
        width: totalWidth(),
      }),
    });
    const groupKeys: Record<string, string[]> = {
      leftGroup: ["leftA", "leftB"],
      ordinaryGroup: ["a", "b"],
      rightGroup: ["rightA", "action"],
    };
    const baseRange = (key: string) => {
      const before = keys.slice(0, keys.indexOf(key)).reduce((sum, item) => sum + widthFor(item), 0);
      const width = widthFor(key);
      const bounds = table.getBoundingClientRect();
      const left = direction === "rtl" ? bounds.right - before - width : bounds.left + before;
      return { left, right: left + width, width };
    };
    for (const cell of table.querySelectorAll<HTMLElement>("th, td")) {
      const key =
        cell.dataset.biuColumnKey ?? (cell.classList.contains("biu-table__selection-cell") ? "selection" : "expand");
      Object.defineProperty(cell, "getBoundingClientRect", {
        configurable: true,
        value: () => {
          const leaves = groupKeys[key] ?? [key];
          const ranges = leaves.map(baseRange);
          const width = ranges.reduce((sum, range) => sum + range.width, 0);
          let left = Math.min(...ranges.map((range) => range.left));
          const side = cell.dataset.biuFixed ?? (key === "selection" || key === "expand" ? "left" : undefined);
          if (side === "left") left = Math.max(left, 20 + Number.parseFloat(cell.style.left));
          else if (side === "right")
            left = Math.min(left + width, 20 + viewportWidth - Number.parseFloat(cell.style.right)) - width;
          const shift =
            Number.parseFloat(
              side
                ? cell.style.getPropertyValue("--biu-table-fixed-shift")
                : scroll.style.getPropertyValue("--biu-table-ordinary-shift"),
            ) || 0;
          return { left: left + shift, right: left + shift + width, width };
        },
      });
    }
    const range = (key: string, header = false) =>
      table
        .querySelector<HTMLElement>(`${header ? "th" : "td"}[data-biu-column-key="${key}"]`)!
        .getBoundingClientRect();
    const verify = () => {
      const leftWidth = 84 + widthFor("leftA") + widthFor("leftB");
      const rightWidth = widthFor("rightA") + widthFor("action");
      assert.equal(range("leftA").left, 104);
      assert.equal(range("leftB").right, 20 + leftWidth);
      assert.equal(range("action").right, 20 + viewportWidth);
      assert.equal(range("rightA").left, 20 + viewportWidth - rightWidth);
      for (const key of ["leftA", "leftB", "rightA", "action"]) assert.deepEqual(range(key, true), range(key));
      assert.equal(range("leftGroup", true).left, 104);
      assert.equal(range("leftGroup", true).right, 20 + leftWidth);
      assert.equal(range("rightGroup", true).right, 20 + viewportWidth);
      const ordinary = direction === "rtl" ? [range("b"), range("a")] : [range("a"), range("b")];
      assert.equal(ordinary[0]!.right, ordinary[1]!.left);
      assert.equal(range("ordinaryGroup", true).left, ordinary[0]!.left);
      assert.equal(range("ordinaryGroup", true).right, ordinary[1]!.right);
      if (viewportWidth >= totalWidth()) {
        assert.ok(ordinary[0]!.left >= 20 + leftWidth);
        assert.ok(ordinary[1]!.right <= range("rightA").left);
        const gap = viewportWidth - totalWidth();
        assert.equal(ordinary[0]!.left - (20 + leftWidth), direction === "rtl" ? gap : 0);
        assert.equal(range("rightA").left - ordinary[1]!.right, direction === "rtl" ? 0 : gap);
      }
      const handle = table.querySelector<HTMLElement>('[aria-label="普通 A列宽"]')!;
      const computed = window.getComputedStyle(handle);
      assert.equal(scroll.dataset.biuDirection, direction);
      assert.equal(computed[direction === "rtl" ? "left" : "right"], "0px");
      assert.equal(computed[direction === "rtl" ? "right" : "left"], direction === "rtl" ? "auto" : "");
      assert.deepEqual(
        [...table.querySelectorAll<HTMLTableColElement>("col[data-biu-column-key]")].map(
          (col) => col.dataset.biuColumnKey,
        ),
        keys.slice(2),
      );
    };
    for (const nextDirection of ["rtl", "ltr", "rtl"]) {
      direction = nextDirection;
      tableRoot.dir = direction;
      scroll.style.direction = direction;
      for (const width of [1027, 764, 600, 1027]) {
        viewportWidth = width;
        await act(async () => window.dispatchEvent(new Event("resize")));
        verify();
        await act(async () => scroll.dispatchEvent(new Event("scroll")));
        verify();
      }
    }
    const handle = table.querySelector<HTMLElement>('[aria-label="操作列宽"]')!;
    handle.style.direction = "rtl";
    await act(async () => handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" })));
    assert.equal(widthFor("action"), 120);
    assert.equal(widthFor("a"), 200);
    assert.equal(widthFor("b"), 120);
    verify();
    const ordinaryHandle = table.querySelector<HTMLElement>('[aria-label="普通 A列宽"]')!;
    ordinaryHandle.style.direction = "rtl";
    const original = range("a", true);
    const startX = original.left + 5;
    await act(async () => {
      ordinaryHandle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: startX, pointerId: 95 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: startX - 40, pointerId: 95 }));
    });
    assert.equal(widthFor("a"), 240);
    assert.equal(range("a", true).left, original.left - 40);
    assert.equal(range("a", true).right, original.right);
    assert.equal(
      host.querySelector<HTMLElement>(".biu-table__resize-preview")!.style.left,
      `${range("a", true).left - 20}px`,
    );
    assert.equal(widthFor("leftA"), 100);
    assert.equal(widthFor("action"), 120);
    await act(async () => window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 95 })));
    verify();
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
    style.remove();
  }
});
