import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { EditableTable, ProTable, Table, TableColumnSettings, type Column } from "../src/index.js";
import { useQueryTable } from "../src/use-query-table.js";

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
  HTMLIFrameElement: dom.window.HTMLIFrameElement,
  DocumentFragment: dom.window.DocumentFragment,
  NodeFilter: dom.window.NodeFilter,
  Event: dom.window.Event,
  FocusEvent: dom.window.FocusEvent,
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
  {
    key: "status",
    title: "状态",
    dataIndex: "status",
    filters: [
      { label: "启用", value: "enabled" },
      { label: "停用", value: "disabled" },
    ],
  },
];

function renderTable(onSelect: (keys: React.Key[]) => void) {
  const host = document.createElement("div");
  document.body.append(host);
  let root!: Root;
  const node = React.createElement(Table<Row>, {
    columns,
    rowKey: "id",
    dataSource: [
      { id: 1, name: "Beta", status: "enabled" },
      { id: 2, name: "Alpha", status: "disabled" },
      { id: 3, name: "Gamma", status: "enabled" },
    ],
    pagination: { current: 1, pageSize: 2, total: 3 },
    rowSelection: { selectedRowKeys: [1], onChange: (keys) => onSelect(keys) },
    expandable: { expandedRowRender: (record) => React.createElement("span", null, `详情：${record.name}`) },
  });
  return { host, root, node };
}

test("Table supports numeric row keys, sorting, filters, expansion and pagination", async () => {
  const selected: React.Key[][] = [];
  const rendered = renderTable((keys) => selected.push(keys));
  await act(async () => {
    rendered.root = createRoot(rendered.host);
    rendered.root.render(rendered.node);
  });
  try {
    const checkboxes = rendered.host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    assert.equal(checkboxes[1]?.checked, true);
    assert.deepEqual(
      [...rendered.host.querySelectorAll("tbody tr")].map((row) => row.textContent?.trim()),
      ["Betaenabled", "Alphadisabled"],
    );
    assert.equal(rendered.host.querySelectorAll('button[aria-label="展开行"]').length, 2);

    const sortButton = rendered.host.querySelector<HTMLButtonElement>(".biu-table__sort-button");
    assert.ok(sortButton);
    await act(async () => sortButton.click());
    assert.equal(rendered.host.querySelector("tbody tr")?.textContent?.includes("Alpha"), true);

    const expandButton = rendered.host.querySelector<HTMLButtonElement>('button[aria-label="展开行"]');
    assert.ok(expandButton);
    await act(async () => expandButton.click());
    assert.equal(rendered.host.textContent?.includes("详情：Alpha"), true);

    const filterButton = rendered.host.querySelector<HTMLButtonElement>(
      '.biu-table__filter-button[aria-label="筛选状态"]',
    );
    assert.ok(filterButton);
    assert.equal(rendered.host.querySelector(".biu-table__filter-select"), null);
    await act(async () => filterButton.click());
    const filter = document.body.querySelector<HTMLElement>('.biu-table__filter-select [role="combobox"]');
    assert.ok(filter);
    await act(async () => filter.click());
    const enabledOption = [...document.body.querySelectorAll<HTMLButtonElement>('[role="option"]')].find(
      (option) => option.textContent?.trim() === "启用",
    );
    assert.ok(enabledOption);
    await act(async () => enabledOption.click());
    const apply = [...document.body.querySelectorAll<HTMLButtonElement>(".biu-table__filter-actions button")].find(
      (button) => button.textContent?.trim() === "应用",
    );
    assert.ok(apply);
    await act(async () => apply.click());
    assert.equal(rendered.host.textContent?.includes("Alpha"), false);
    assert.equal(rendered.host.textContent?.includes("Beta"), true);

    const next = [...rendered.host.querySelectorAll(".biu-table__pagination button")].at(-1);
    assert.ok(next);
    await act(async () => next?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  } finally {
    await act(async () => rendered.root.unmount());
    rendered.host.remove();
    document.body.replaceChildren();
  }
  assert.deepEqual(selected, []);
});

test("Table renders a tooltip trigger beside a column title", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [{ key: "name", title: "名称", tooltip: "用于展示能力名称", dataIndex: "name" }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "ready" }],
      }),
    ),
  );
  try {
    assert.equal(host.querySelectorAll(".biu-table__header-tooltip").length, 1);
    assert.equal(
      host.querySelector<HTMLButtonElement>(".biu-table__header-tooltip")?.getAttribute("aria-label"),
      "用于展示能力名称",
    );
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table centers text and every tooltip wrapper in plain, grouped and sortable headers", async () => {
  const style = document.createElement("style");
  style.textContent =
    readFileSync(new URL("../../react-components/src/ui/tooltip/styles.css", import.meta.url), "utf8") +
    readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  document.head.append(style);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          {
            key: "group",
            title: "基本信息",
            tooltip: "分组说明",
            children: [{ key: "name", title: "名称", sortable: true, tooltip: "名称说明", dataIndex: "name" }],
          },
          {
            key: "status",
            title: React.createElement("strong", null, "状态"),
            tooltip: "状态说明",
            dataIndex: "status",
          },
        ],
        rowKey: "id",
        dataSource: [{ id: 1, name: "能力", status: "ready" }],
      }),
    ),
  );
  try {
    const headers = host.querySelectorAll<HTMLElement>(".biu-table__header-content");
    assert.equal(headers.length, 3);
    for (const header of headers) {
      const title = header.querySelector<HTMLElement>(".biu-table__header-title");
      const tooltip = header.querySelector<HTMLElement>(":scope > .biu-table__header-tooltip-root");
      const trigger = tooltip?.querySelector<HTMLElement>(":scope > .biu-table__header-tooltip-trigger");
      const icon = trigger?.querySelector(".biu-table__header-tooltip > svg");
      assert.ok(title);
      assert.ok(tooltip);
      assert.ok(trigger);
      assert.ok(icon);
      assert.equal(window.getComputedStyle(header).alignItems, "center");
      assert.equal(window.getComputedStyle(title).display, "block");
      for (const layer of [tooltip, trigger]) {
        const computed = window.getComputedStyle(layer);
        assert.equal(computed.display, "inline-flex");
        assert.equal(computed.alignItems, "center");
        assert.equal(computed.lineHeight, "1");
      }
      assert.equal(window.getComputedStyle(icon).display, "block");
    }
    const sortButton = host.querySelector<HTMLElement>(".biu-table__sort-button");
    const sortIcon = sortButton?.querySelector<HTMLElement>(".biu-table__sort-icon");
    assert.ok(sortButton?.querySelector(":scope > .biu-table__header-title"));
    assert.ok(sortIcon);
    assert.equal(window.getComputedStyle(sortIcon).display, "inline-flex");
    assert.equal(window.getComputedStyle(sortIcon).alignItems, "center");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
    style.remove();
  }
});

test("Table emits controlled pagination changes and renders the selected page", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const rows = [
    { id: 1, name: "第一行", status: "enabled" },
    { id: 2, name: "第二行", status: "enabled" },
    { id: 3, name: "第三行", status: "enabled" },
  ];
  function ControlledTable() {
    const [current, setCurrent] = React.useState(1);
    return React.createElement(Table<Row>, {
      columns,
      rowKey: "id",
      dataSource: rows,
      pagination: { current, pageSize: 2, total: rows.length, onChange: setCurrent },
    });
  }
  const root = createRoot(host);
  await act(async () => root.render(React.createElement(ControlledTable)));
  try {
    assert.equal(host.textContent?.includes("第一行"), true);
    assert.equal(host.textContent?.includes("第三行"), false);
    const next = host.querySelector<HTMLButtonElement>(".biu-table__pagination button:not(:disabled):last-of-type");
    assert.ok(next);
    await act(async () => next.click());
    assert.equal(host.textContent?.includes("第一行"), false);
    assert.equal(host.textContent?.includes("第三行"), true);
    assert.equal(host.querySelector('.biu-table__pagination button[aria-current="page"]')?.textContent, "2");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table keeps a controlled page size visible even when it is outside default options", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns,
        rowKey: "id",
        dataSource: [
          { id: 1, name: "第一行", status: "enabled" },
          { id: 2, name: "第二行", status: "enabled" },
          { id: 3, name: "第三行", status: "enabled" },
          { id: 4, name: "第四行", status: "enabled" },
          { id: 5, name: "第五行", status: "enabled" },
        ],
        pagination: { current: 1, pageSize: 4, total: 5, showSizeChanger: true },
      }),
    ),
  );
  try {
    const trigger = host.querySelector<HTMLElement>('.biu-table__pagination-select [role="combobox"]');
    assert.ok(trigger);
    assert.equal(trigger.textContent?.trim(), "4 条/页");
    assert.ok(host.querySelector(".biu-table__pagination-select.biu-ui-select--small"));
    assert.ok(host.querySelector(".biu-table__pagination--responsive.biu-ui-pagination--responsive"));
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table quick jumper follows controlled pagination after navigation", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const rows = Array.from({ length: 30 }, (_, index) => ({ id: index + 1, name: `行${index + 1}`, status: "enabled" }));
  const root = createRoot(host);
  function ControlledTable() {
    const [current, setCurrent] = React.useState(1);
    return React.createElement(Table<Row>, {
      columns,
      rowKey: "id",
      dataSource: rows,
      pagination: {
        current,
        pageSize: 10,
        total: rows.length,
        showQuickJumper: true,
        quickJumperWidth: 96,
        onChange: setCurrent,
      },
    });
  }
  await act(async () => root.render(React.createElement(ControlledTable)));
  try {
    const next = host.querySelector<HTMLButtonElement>('.biu-table__pagination button[aria-label="下一页"]');
    const jumper = host.querySelector<HTMLInputElement>(".biu-table__quick-jumper input");
    assert.ok(next);
    assert.ok(jumper);
    assert.ok(host.querySelector(".biu-table__quick-jumper-input.biu-ui-textfield"));
    assert.match(
      host.querySelector(".biu-table__quick-jumper")?.getAttribute("style") ?? "",
      /--biu-pagination-jumper-width: 96px/,
    );
    assert.equal(jumper.value, "1");
    await act(async () => next.click());
    assert.equal(jumper.value, "2");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table keeps implicit row keys stable across client pagination", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const selected: React.Key[][] = [];
  const root = createRoot(host);
  function ImplicitKeyTable() {
    const [current, setCurrent] = React.useState(1);
    return React.createElement(Table<Row>, {
      columns,
      dataSource: [
        { id: 1, name: "第一页", status: "enabled" },
        { id: 2, name: "第一页第二行", status: "enabled" },
        { id: 3, name: "第二页", status: "enabled" },
      ],
      pagination: { current, pageSize: 2, total: 3, onChange: setCurrent },
      rowSelection: { selectedRowKeys: [], onChange: (keys) => selected.push(keys) },
    });
  }
  await act(async () => root.render(React.createElement(ImplicitKeyTable)));
  try {
    const next = host.querySelector<HTMLButtonElement>('.biu-table__pagination button[aria-label="下一页"]');
    assert.ok(next);
    await act(async () => next.click());
    const rowCheckboxes = host.querySelectorAll<HTMLInputElement>('tbody input[type="checkbox"]');
    assert.equal(rowCheckboxes.length, 1);
    await act(async () => rowCheckboxes[0]?.click());
    assert.deepEqual(selected.at(-1), ["2"]);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table marks fixed cells with side-specific classes and no inherited background", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", fixed: "left", width: 120 },
          { key: "status", title: "状态", dataIndex: "status", fixed: "right", width: 120 },
        ],
        rowKey: "id",
        dataSource: [{ id: 1, name: "固定列", status: "启用" }],
      }),
    ),
  );
  try {
    const leftCell = host.querySelector<HTMLElement>("tbody td.biu-table__cell--fixed-left");
    const rightCell = host.querySelector<HTMLElement>("tbody td.biu-table__cell--fixed-right");
    assert.ok(leftCell);
    assert.ok(rightCell);
    assert.equal(leftCell.style.background, "");
    assert.equal(rightCell.style.background, "");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

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
  const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
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

test("Table supports a custom filterDropdown with apply and clear controls", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const rows = [
    { id: 1, name: "平台", status: "ready" },
    { id: 2, name: "业务", status: "review" },
  ];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          {
            key: "name",
            title: "名称",
            dataIndex: "name",
            filters: [{ label: "平台", value: "ready" }],
            filterDropdown: ({ selectedKeys, setSelectedKeys, confirm, clearFilters }) =>
              React.createElement(
                "div",
                { "data-testid": "custom-filter" },
                React.createElement(
                  "button",
                  { type: "button", onClick: () => setSelectedKeys(["平台"]) },
                  `选中 ${selectedKeys.length}`,
                ),
                React.createElement("button", { type: "button", onClick: () => confirm() }, "应用"),
                React.createElement("button", { type: "button", onClick: clearFilters }, "清除"),
              ),
          },
          { key: "status", title: "状态", dataIndex: "status" },
        ],
        rowKey: "id",
        dataSource: rows,
      }),
    ),
  );
  try {
    const trigger = host.querySelector<HTMLButtonElement>('.biu-table__filter-button[aria-label="筛选名称"]');
    assert.ok(trigger);
    await act(async () => trigger.click());
    assert.ok(document.body.querySelector('[data-testid="custom-filter"]'));
    const choose = document.body.querySelector<HTMLButtonElement>('[data-testid="custom-filter"] button');
    assert.ok(choose);
    await act(async () => choose.click());
    assert.equal(choose.textContent, "选中 1");
    const apply = [...document.body.querySelectorAll<HTMLButtonElement>('[data-testid="custom-filter"] button')].find(
      (button) => button.textContent === "应用",
    );
    assert.ok(apply);
    await act(async () => apply.click());
    assert.equal(host.textContent?.includes("平台"), true);
    assert.equal(host.textContent?.includes("业务"), false);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

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
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 447, pointerId: 28 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 497, pointerId: 28 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 497, pointerId: 28 }));
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

test("Table grows the last column while preserving preceding widths and following the pointer", async () => {
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
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 420, pointerId: 22 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 1000, pointerId: 22 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 1000, pointerId: 22 }));
    });
    assert.deepEqual(widths.at(-1), ["status", 820]);
    assert.deepEqual(widthMaps.at(-1), { name: 180, status: 820 });
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table renders a trailing handle for the last column", async () => {
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
    assert.equal(handle.classList.contains("biu-table__resize-handle--leading"), false);
    assert.equal(host.querySelectorAll<HTMLElement>(".biu-table__resize-handle").length, 2);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 420, pointerId: 25 }));
    });
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 460, pointerId: 25 }));
    });
    assert.equal(host.querySelector<HTMLElement>(".biu-table__resize-preview")?.style.left, "460px");
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 460, pointerId: 25 }));
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

test("Table anchors the guide to the actual boundary and keeps a full-width filler during preview", async () => {
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
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 515, pointerId: 55 }));
    });
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 565, pointerId: 55 }));
    });
    assert.equal(host.querySelector<HTMLElement>(".biu-table__resize-preview")?.style.left, "470px");
    assert.equal(table.style.width, "600px");
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "130px");
    assert.ok(host.querySelector("thead .biu-table__resize-fill-cell"));
    assert.ok(host.querySelector("tbody .biu-table__resize-fill-cell"));
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 565, pointerId: 55 }));
    });
    assert.deepEqual(widthMaps.at(-1), { name: 310, status: 290 });
    assert.equal(table.style.width, "600px");
    assert.equal(host.querySelector("col[data-biu-resize-fill]"), null);
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
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 515, pointerId: 56 }));
    });
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 565, pointerId: 56 }));
    });
    assert.equal(table.style.width, "600px");
    assert.equal(actionColumn.style.width, "80px");
    assert.equal(host.querySelector<HTMLTableCellElement>('th[data-biu-column-key="actions"]')?.style.width, "80px");
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "50px");
    const fillerHeader = host.querySelector("thead .biu-table__resize-fill-cell");
    assert.equal(fillerHeader?.nextElementSibling?.getAttribute("data-biu-column-key"), "actions");
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 565, pointerId: 56 }));
    });
    assert.equal(widthMaps.at(-1)?.actions, 80);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table commits a minimum-width trailing resize by filling the wide viewport after pointerup", async () => {
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
    await act(async () => {
      target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: startX, pointerId: 57 }));
    });
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: endX, pointerId: 57 }));
    });
    assert.equal(widthFor("updatedAt"), 120);
    await act(async () => {
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: endX, pointerId: 57 }));
    });

    const totalWidth = Object.values(publishedWidths).reduce<number>(
      (sum, width) => sum + Number.parseFloat(String(width)),
      0,
    );
    assert.equal(publishedWidths.updatedAt, 120);
    assert.equal(totalWidth, viewportWidth);
    assert.equal(widthFor("updatedAt"), 120);
    assert.equal(
      keys.reduce((sum, key) => sum + widthFor(key), 0),
      viewportWidth,
    );
    assert.equal(table.style.width, `${viewportWidth}px`);
    assert.ok(widthFor("status") > 220);

    const statusHandle = host.querySelector<HTMLElement>('[aria-label="状态列宽"]');
    assert.ok(statusHandle);
    const statusWidth = widthFor("status");
    const updatedAtWidth = widthFor("updatedAt");
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

test("Table does not shrink the previous column when the last column grows", async () => {
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
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 420, pointerId: 23 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 1000, pointerId: 23 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 1000, pointerId: 23 }));
    });
    assert.deepEqual(widthMaps.at(-1), { name: 180, status: 820 });
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
      firstHandle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 420, pointerId: 31 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 500, pointerId: 31 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 500, pointerId: 31 }));
    });

    const secondHandle = host.querySelectorAll<HTMLElement>(".biu-table__resize-handle")[1];
    assert.ok(secondHandle);
    await act(async () => {
      secondHandle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 500, pointerId: 32 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 450, pointerId: 32 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 450, pointerId: 32 }));
    });

    assert.deepEqual(changes, [
      ["status", 320],
      ["status", 270],
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
      handle()?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 500, pointerId: 33 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 550, pointerId: 33 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 550, pointerId: 33 }));
    });
    await act(async () => {
      handle()?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 550, pointerId: 34 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 500, pointerId: 34 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 500, pointerId: 34 }));
    });
    assert.deepEqual(changes, [
      { name: 180, status: 350 },
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

test("Table keeps striped rows opt-in", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name" }],
        dataSource: [
          { id: 1, name: "第一行", status: "ready" },
          { id: 2, name: "第二行", status: "ready" },
        ],
        striped: true,
      }),
    ),
  );
  try {
    assert.equal(host.querySelector(".biu-table")?.classList.contains("biu-table--striped"), true);
    assert.equal(host.querySelectorAll("tbody tr").length, 2);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

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

test("EditableTable enters a text editor on double click and saves on blur", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let changed: unknown;
  await act(async () =>
    root.render(
      React.createElement(EditableTable<{ id: number; name: string }>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name", editable: { type: "text" } }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "初始值" }],
        onChange: (data) => {
          changed = data[0]?.name;
        },
      }),
    ),
  );
  try {
    const cell = host.querySelector<HTMLElement>(".biu-editable-table__cell");
    assert.ok(cell);
    await act(async () => cell.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    const input = host.querySelector<HTMLInputElement>("input");
    assert.ok(input);
    await act(async () => {
      input.value = "已修改";
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    assert.equal(changed, "已修改");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("EditableTable cancels a queued blur save when the edit session is cancelled", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: unknown[] = [];
  await act(async () =>
    root.render(
      React.createElement(EditableTable<{ id: number; name: string }>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name", editable: { type: "text" } }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "初始值" }],
        onChange: (data) => changes.push(data[0]?.name),
      }),
    ),
  );
  try {
    const cell = host.querySelector<HTMLElement>(".biu-editable-table__cell");
    assert.ok(cell);
    await act(async () => cell.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    const input = host.querySelector<HTMLInputElement>("input");
    assert.ok(input);
    input.value = "不应保存";
    await act(async () => {
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
      const cancel = host.querySelector<HTMLButtonElement>('button[aria-label="取消编辑"]');
      cancel?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      cancel?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual(changes, []);
    assert.equal(host.querySelector(".biu-editable-table__editor"), null);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("EditableTable exposes mouse cancel, clear and save actions", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: unknown[] = [];
  await act(async () =>
    root.render(
      React.createElement(EditableTable<{ id: number; name: string }>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name", editable: { type: "text" } }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "初始值" }],
        onChange: (data) => changes.push(data[0]?.name),
      }),
    ),
  );
  try {
    const cell = host.querySelector<HTMLElement>(".biu-editable-table__cell");
    assert.ok(cell);
    await act(async () => cell.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    assert.equal(host.querySelectorAll("button[aria-label]").length >= 3, true);
    for (const label of ["取消编辑", "清空编辑值", "保存编辑"]) {
      assert.ok(host.querySelector(`button[aria-label="${label}"].biu-ui-button--variant-outlined`));
    }
    await act(async () => {
      const button = host.querySelector<HTMLButtonElement>('button[aria-label="取消编辑"]');
      button?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    assert.deepEqual(changes, []);

    await act(async () => cell.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    const input = host.querySelector<HTMLInputElement>("input");
    assert.ok(input);
    await act(async () => {
      input.value = "待清空";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      const button = host.querySelector<HTMLButtonElement>('button[aria-label="清空编辑值"]');
      button?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(host.querySelectorAll("button[aria-label]").length >= 3, true);
    assert.equal(document.activeElement, host.querySelector(".biu-editable-table__editor input"));
    await act(async () => {
      const button = host.querySelector<HTMLButtonElement>('button[aria-label="保存编辑"]');
      button?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    assert.equal(changes.at(-1), "");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("EditableTable exposes action callbacks without changing the default edit flow", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const actions: string[] = [];
  await act(async () =>
    root.render(
      React.createElement(EditableTable<{ id: number; name: string }>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name", editable: { type: "text" } }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "初始值" }],
        onEditAction: ({ action }) => actions.push(action),
        onEditStart: () => actions.push("start-specific"),
        onEditClear: () => actions.push("clear-specific"),
      }),
    ),
  );
  try {
    const cell = host.querySelector<HTMLElement>(".biu-editable-table__cell");
    assert.ok(cell);
    await act(async () => cell.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    const clear = host.querySelector<HTMLButtonElement>('button[aria-label="清空编辑值"]');
    assert.ok(clear);
    await act(async () => {
      clear.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      clear.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    assert.deepEqual(actions.slice(0, 4), ["start", "start-specific", "clear", "clear-specific"]);
    assert.equal(host.querySelector(".biu-editable-table__editor") !== null, true);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

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

test("Table defaults to wrapping cells and exposes an explicit noWrap contract", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name" },
          { key: "status", title: "状态", dataIndex: "status", noWrap: true },
          { key: "status-ellipsis", title: "状态省略", dataIndex: "status", ellipsis: true },
        ],
        rowKey: "id",
        dataSource: [{ id: 1, name: "这是一段允许自动换行的长文本", status: "保持单行" }],
      }),
    ),
  );
  try {
    const cells = [...host.querySelectorAll<HTMLTableCellElement>("tbody td")];
    assert.equal(cells[0]?.classList.contains("biu-table__cell--nowrap"), false);
    assert.equal(cells[1]?.classList.contains("biu-table__cell--nowrap"), true);
    assert.equal(cells[2]?.classList.contains("biu-table__cell--ellipsis"), true);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table distributes a resize across neighboring columns up to their combined minimum capacity", async () => {
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
    assert.deepEqual(widthMaps.at(-1), { name: 220, status: 60, owner: 60, updated: 60 });
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

test("Table stops its last-column guide at minWidth before it reaches any preceding column", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
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
      }),
    ),
  );
  try {
    const handle = host.querySelector<HTMLElement>('[aria-label="状态列宽"]')!;
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 420, pointerId: 72 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: -1000, pointerId: 72 }));
    });
    assert.equal(host.querySelector<HTMLElement>(".biu-table__resize-preview")?.style.left, "300px");
    assert.equal(host.querySelector<HTMLTableElement>("table")?.style.width, "380px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "180px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="actions"]')?.style.width, "80px");
    await act(async () => window.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: 72 })));
    assert.equal(host.querySelector(".biu-table__resize-preview"), null);
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="actions"]')?.style.width, "80px");
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

test("Table cancels an in-flight drag when its viewport moves or changes width", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let commits = 0;
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 120, resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 240 },
        ],
        onColumnWidthsChange: () => commits++,
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowKey: "id",
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    let viewportLeft = 100;
    let viewportWidth = 600;
    Object.defineProperty(scroll, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: viewportLeft, width: viewportWidth }),
    });
    const handle = () => host.querySelector<HTMLElement>('[aria-label="名称列宽"]')!;
    for (const dimension of ["left", "width"]) {
      await act(async () =>
        handle().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 220, pointerId: 76 })),
      );
      if (dimension === "left") viewportLeft += 20;
      else viewportWidth += 200;
      await act(async () =>
        window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 260, pointerId: 76 })),
      );
      assert.equal(host.querySelector(".biu-table__resize-preview"), null);
      assert.equal(document.body.classList.contains("biu-table-resizing-global"), false);
      assert.equal(commits, 0);
    }
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table fillRemainingSpace false skips compensation and retains exact content widths after commit", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 240 },
          { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right" },
        ],
        fillRemainingSpace: false,
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
    assert.equal(table.style.width, "500px");
    const handle = host.querySelector<HTMLElement>('[aria-label="名称列宽"]')!;
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 180, pointerId: 77 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 280, pointerId: 77 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 280, pointerId: 77 }));
    });
    assert.deepEqual(changes.at(-1), { name: 280, status: 240, actions: 80 });
    assert.equal(table.style.width, "600px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "240px");
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1200 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(table.style.width, "600px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table mirrors pointer and keyboard resize directions in RTL including negative scroll offsets", async () => {
  const host = document.createElement("div");
  host.dir = "rtl";
  document.body.append(host);
  const root = createRoot(host);
  const changes: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, minWidth: 120, resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 240, minWidth: 120 },
        ],
        onColumnWidthsChange: (next) => changes.push(next),
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowKey: "id",
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    const handle = host.querySelector<HTMLElement>('[aria-label="名称列宽"]')!;
    handle.style.direction = "rtl";
    await act(async () =>
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 320, pointerId: 78 })),
    );
    scroll.scrollLeft = -20;
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 300, pointerId: 78 })),
    );
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "220px");
    assert.equal(host.querySelector<HTMLElement>(".biu-table__resize-preview")?.style.left, "280px");
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 300, pointerId: 78 })),
    );
    assert.deepEqual(changes.at(-1), { name: 220, status: 200 });
    await act(async () => handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" })));
    assert.deepEqual(changes.at(-1), { name: 230, status: 190 });
    await act(async () => handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" })));
    assert.deepEqual(changes.at(-1), { name: 220, status: 200 });
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table fills other ordinary columns after a last-column commit and preserves its target across viewport changes", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: Array<Record<string, number | string>> = [];
  const targets: Array<[string, number]> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 240, minWidth: 120, resizable: true },
          { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right" },
        ],
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowKey: "id",
        onColumnWidthsChange: (next) => changes.push(next),
        onColumnResize: (key, width) => targets.push([key, width]),
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 800 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    const table = host.querySelector<HTMLTableElement>("table")!;
    const handle = host.querySelector<HTMLElement>('[aria-label="状态列宽"]')!;
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "540px");
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 720, pointerId: 79 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 620, pointerId: 79 }));
    });
    assert.equal(table.style.width, "800px");
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "100px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "180px");
    assert.equal(changes.length, 0);
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 620, pointerId: 79 })),
    );
    assert.equal(table.style.width, "800px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "280px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "440px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="actions"]')?.style.width, "80px");
    assert.deepEqual(changes, [{ name: 280, status: 440, actions: 80 }]);
    assert.deepEqual(targets, [["status", 440]]);
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1000 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(table.style.width, "1000px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "440px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "480px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table target fill protection waits for controlled acceptance, respects refusal and clears on reset", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const columns: Column<Row>[] = [
    { key: "name", title: "名称", dataIndex: "name", width: 180 },
    { key: "status", title: "状态", dataIndex: "status", width: 240, minWidth: 120, resizable: true },
    { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right" },
  ];
  const initial = { name: 180, status: 240 };
  let pending: Record<string, number | string> | undefined;
  const render = (columnWidths: Record<string, number | string>, changeGeometry = false) =>
    React.createElement(Table<Row>, {
      columns: columns.map((column) => ({
        ...column,
        render: (value: unknown) => String(value),
        minWidth: changeGeometry && column.key === "status" ? 200 : column.minWidth,
      })),
      columnWidths,
      onColumnWidthsChange: (next) => (pending = next),
      dataSource: [{ id: 1, name: "验证", status: "ready" }],
      rowKey: "id",
    });
  await act(async () => root.render(render(initial)));
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 800 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    const table = host.querySelector<HTMLTableElement>("table")!;
    const handle = host.querySelector<HTMLElement>('[aria-label="状态列宽"]')!;
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 720, pointerId: 80 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 620, pointerId: 80 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 620, pointerId: 80 }));
    });
    assert.equal(table.style.width, "800px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "540px");
    assert.equal(pending?.status, 440);
    assert.equal(pending?.name, 280);
    await act(async () => root.render(render(pending!)));
    assert.equal(table.style.width, "800px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "440px");
    await act(async () => root.render(render({ ...pending! })));
    assert.equal(table.style.width, "800px");
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1000 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(table.style.width, "1000px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "440px");
    await act(async () => root.render(render(pending!, true)));
    assert.equal(table.style.width, "1000px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "640px");
    await act(async () => root.render(render(initial)));
    assert.equal(table.style.width, "1000px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "740px");
    await act(async () => root.render(render(pending!)));
    assert.equal(table.style.width, "1000px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "640px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table keeps ordinary percentage widths responsive after a no-op pointer session", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let commits = 0;
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: "50%", resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 120 },
          { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right" },
        ],
        onColumnWidthsChange: () => commits++,
        onColumnResize: () => commits++,
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowKey: "id",
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 800 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    const handle = host.querySelector<HTMLElement>('[aria-label="名称列宽"]')!;
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 400, pointerId: 81 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 400, pointerId: 81 }));
    });
    assert.equal(commits, 0);
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "400px");
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1000 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "500px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table commits a live final width after an equivalent parent rerender without restoring stale DOM", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let rerender!: () => void;
  function ControlledTable() {
    const [widths, setWidths] = React.useState<Record<string, number | string>>({ name: 180, status: 240 });
    const [, setRenderCount] = React.useState(0);
    rerender = () => setRenderCount((count) => count + 1);
    return React.createElement(Table<Row>, {
      columns: [
        { key: "name", title: "名称", dataIndex: "name", width: 180 },
        { key: "status", title: "状态", dataIndex: "status", width: 240, minWidth: 120, resizable: true },
        { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right" },
      ],
      columnWidths: { ...widths },
      onColumnWidthsChange: setWidths,
      dataSource: [{ id: 1, name: "验证", status: "ready" }],
      rowKey: "id",
    });
  }
  await act(async () => root.render(React.createElement(ControlledTable)));
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 800 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    const table = host.querySelector<HTMLTableElement>("table")!;
    const handle = host.querySelector<HTMLElement>('[aria-label="状态列宽"]')!;
    await act(async () =>
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 720, pointerId: 82 })),
    );
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 620, pointerId: 82 })),
    );
    await act(async () => rerender());
    assert.equal(table.style.width, "800px");
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "100px");
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 620, pointerId: 82 })),
    );
    assert.equal(table.style.width, "800px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "440px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "280px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="actions"]')?.style.width, "80px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table always cleans a committed resize when an external callback throws", async () => {
  const failures: string[] = [];
  const captureError = (event: ErrorEvent) => {
    failures.push(event.message);
    event.preventDefault();
  };
  window.addEventListener("error", captureError);
  try {
    for (const stage of ["widths", "resize"]) {
      const host = document.createElement("div");
      document.body.append(host);
      const root = createRoot(host);
      const fail = () => {
        throw new Error(`Resize ${stage} callback failed`);
      };
      await act(async () =>
        root.render(
          React.createElement(Table<Row>, {
            columns: [
              { key: "name", title: "名称", dataIndex: "name", width: 180 },
              { key: "status", title: "状态", dataIndex: "status", width: 240, minWidth: 120, resizable: true },
              { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right" },
            ],
            onColumnWidthsChange: stage === "widths" ? fail : undefined,
            onColumnResize: stage === "resize" ? fail : undefined,
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
        await act(async () => {
          handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 720, pointerId: 83 }));
          window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 620, pointerId: 83 }));
          window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 620, pointerId: 83 }));
        });
        assert.equal(document.body.classList.contains("biu-table-resizing-global"), false);
        assert.equal(host.querySelector(".biu-table__resize-preview"), null);
        assert.equal(host.querySelector(".biu-table__resize-target"), null);
        assert.equal(host.querySelector<HTMLTableElement>("table")?.style.width, "800px");
        assert.equal(
          host.querySelector<HTMLTableColElement>('col[data-biu-column-key="actions"]')?.style.width,
          "80px",
        );
      } finally {
        await act(async () => root.unmount());
        host.remove();
        document.body.replaceChildren();
      }
    }
    assert.deepEqual(failures, ["Resize widths callback failed", "Resize resize callback failed"]);
  } finally {
    window.removeEventListener("error", captureError);
  }
});

test("Table preserves controlled action widths with grouped Showcase columns through final and ordinary drags", async () => {
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
    const handle = host.querySelector<HTMLElement>('[aria-label="状态列宽"]')!;
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 900, pointerId: 84 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 650, pointerId: 84 }));
    });
    assert.equal(width("action"), "190px");
    assert.equal(width("name"), "180px");
    await act(async () => window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 84 })));
    assert.equal(table.style.width, "1100px");
    assert.equal(width("status"), "190px");
    assert.equal(width("version"), "360px");
    assert.equal(Object.hasOwn(latest, "action"), false);
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1300 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(width("status"), "190px");
    assert.equal(width("version"), "560px");
    assert.equal(width("action"), "190px");
    await act(async () => setExternalWidths({ ...latest, action: 120 }));
    const ownerHandle = host.querySelector<HTMLElement>('[aria-label="归属团队列宽"]')!;
    await act(async () => {
      ownerHandle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 360, pointerId: 85 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 460, pointerId: 85 }));
    });
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

test("Table keeps grouped headers in step with the live fill column beside a fixed action column", async () => {
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
    const actionColumn = host.querySelector<HTMLTableColElement>('col[data-biu-column-key="actions"]');
    const actionHeader = host.querySelector<HTMLTableCellElement>('thead th[data-biu-column-key="actions"]');
    assert.ok(scroll);
    assert.ok(table);
    assert.ok(groupHeader);
    assert.ok(updatedAtHeader);
    assert.ok(actionColumn);
    assert.ok(actionHeader);
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1000 });
    await act(async () => window.dispatchEvent(new Event("resize")));

    const startGroupWidth = Number.parseFloat(groupHeader.style.width);
    const startTargetWidth = Number.parseFloat(updatedAtHeader.style.width);
    const startActionWidth = actionColumn.style.width;
    const handle = updatedAtHeader.querySelector<HTMLElement>(".biu-table__resize-handle");
    assert.ok(handle);
    assert.equal(groupHeader.colSpan, 2);

    await act(async () =>
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 500, pointerId: 87 })),
    );
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 420, pointerId: 87 })),
    );

    const fillColumn = table.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]");
    assert.ok(fillColumn);
    assert.equal(Number.parseFloat(updatedAtHeader.style.width), startTargetWidth - 80);
    assert.equal(Number.parseFloat(groupHeader.style.width), startGroupWidth - 80);
    assert.equal(groupHeader.colSpan, 2);
    assert.equal(actionColumn.style.width, startActionWidth);
    assert.equal(actionHeader.style.width, startActionWidth);
    assert.equal(fillColumn.style.width, "80px");

    await act(async () => window.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: 87 })));
    assert.equal(table.querySelector("col[data-biu-resize-fill]"), null);
    assert.equal(Number.parseFloat(groupHeader.style.width), startGroupWidth);
    assert.equal(Number.parseFloat(updatedAtHeader.style.width), startTargetWidth);
    assert.equal(actionHeader.style.width, startActionWidth);

    await act(async () =>
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 500, pointerId: 88 })),
    );
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 420, pointerId: 88 })),
    );
    assert.equal(table.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "80px");
    assert.equal(Number.parseFloat(groupHeader.style.width), startGroupWidth - 80);
    await act(async () => window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 88 })));
    assert.equal(table.style.width, "1000px");
    assert.equal(table.querySelector("col[data-biu-resize-fill]"), null);
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

test("ProTable fills the space left by a narrowed final ordinary column without moving fixed columns", async () => {
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
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 600, pointerId: 91 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 500, pointerId: 91 }));
    });
    assert.ok(host.querySelector("col[data-biu-resize-fill]"));
    assert.equal(
      host.querySelector<HTMLTableCellElement>('thead th[data-biu-column-key="updatedAt"]')?.style.width,
      "330px",
    );

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
    assert.equal(width("module"), 400);
    assert.equal(width("updatedAt"), 330);
    assert.equal(width("actions"), actionWidth);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("TableResizeShowcase bounds do not leave a right gap after the final column is narrowed", async () => {
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

    const handle = host.querySelector<HTMLElement>('[aria-label="最近更新列宽"]')!;
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 1200, pointerId: 92 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 300, pointerId: 92 }));
    });
    assert.equal(width("updatedAt"), 120);
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "900px");

    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 300, pointerId: 92 })),
    );

    assert.deepEqual(latestWidths, { name: 320, module: 260, owner: 220, status: 680, updatedAt: 120 });
    assert.equal(table.style.width, "1600px");
    assert.equal(host.querySelector("col[data-biu-resize-fill]"), null);
    assert.deepEqual(["name", "module", "owner", "status", "updatedAt"].map(width), [320, 260, 220, 680, 120]);
    assert.equal(
      ["name", "module", "owner", "status", "updatedAt"].reduce((sum, key) => sum + width(key), 0),
      1600,
    );
    for (const key of ["name", "module", "owner", "status", "updatedAt"])
      assert.equal(headerWidth(key), cellWidth(key), `${key} header and body widths stay aligned`);

    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1700 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(table.style.width, "1700px");
    assert.equal(width("status"), 780);
    assert.equal(width("updatedAt"), 120);

    const expandedHandle = host.querySelector<HTMLElement>('[aria-label="状态列宽"]')!;
    assert.equal(expandedHandle.getAttribute("aria-valuenow"), "780");
    assert.equal(expandedHandle.getAttribute("aria-valuemax"), "780");
    await act(async () =>
      expandedHandle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 1000, pointerId: 93 })),
    );
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 990, pointerId: 93 })),
    );
    assert.equal(width("status"), 770);
    assert.equal(host.querySelector<HTMLElement>(".biu-table__resize-preview")?.style.left, "990px");
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 990, pointerId: 93 })),
    );
    assert.equal(table.style.width, "1700px");
    assert.equal(width("status"), 770);
    assert.equal(width("updatedAt"), 130);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table inherited fixed and action groups never absorb a final-column commit or viewport surplus", async () => {
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
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 820, pointerId: 86 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 720, pointerId: 86 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 86 }));
    });
    assert.deepEqual(widths(), ["42px", "42px", "70px", "90px", "220px", "346px", "190px"]);
    assert.deepEqual(changes, [{ leftA: 70, leftB: 90, name: 220, status: 346 }]);
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1200 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.deepEqual(widths(), ["42px", "42px", "70px", "90px", "420px", "346px", "190px"]);
    assert.equal(host.querySelector<HTMLElement>('th[data-biu-column-key="leftA"]')!.style.position, "sticky");
    assert.equal(host.querySelector<HTMLElement>('th[data-biu-column-key="action"]')!.style.position, "sticky");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table preserves an over-limit autofill target when no other ordinary column can absorb space", async () => {
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
    assert.equal(host.querySelector<HTMLTableElement>("table")!.style.width, "750px");
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1200 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(host.querySelector<HTMLTableElement>("table")!.style.width, "750px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="action"]')!.style.width, "80px");
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
