import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { ProTable, Table, TableColumnSettings, type Column } from "../src/index.js";
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
        onChange: setCurrent,
      },
    });
  }
  await act(async () => root.render(React.createElement(ControlledTable)));
  try {
    const next = [...host.querySelectorAll<HTMLButtonElement>(".biu-table__pagination button")].find(
      (button) => button.textContent?.trim() === "下一页",
    );
    const jumper = host.querySelector<HTMLInputElement>(".biu-table__quick-jumper input");
    assert.ok(next);
    assert.ok(jumper);
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
    const next = [...host.querySelectorAll<HTMLButtonElement>(".biu-table__pagination button")].find(
      (button) => button.textContent?.trim() === "下一页",
    );
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
    assert.equal(host.querySelector<HTMLElement>("thead th")?.style.width, "200px");
    assert.deepEqual(widths.at(-1), ["name", 200]);
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
      ["180px", "96px", "140px"],
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
