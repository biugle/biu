import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { ProTable, Table } from "../src/index.js";
import { columns, renderTable, type Row } from "./fixtures/table-functional.js";
import { readTableStyles } from "./fixtures/styles.js";

test("Table and ProTable use explicit direction with an LTR default", async () => {
  const host = document.createElement("div");
  host.dir = "rtl";
  document.body.append(host);
  const root = createRoot(host);
  const renderTableWithDirection = (dir?: "ltr" | "rtl") =>
    React.createElement(Table<Row>, {
      dir,
      columns,
      rowKey: "id",
      dataSource: [{ id: 1, name: "方向", status: "enabled" }],
      pagination: false,
    });
  try {
    await act(async () => root.render(renderTableWithDirection()));
    assert.equal(host.querySelector(".biu-table")?.getAttribute("dir"), "ltr");

    await act(async () => root.render(renderTableWithDirection("rtl")));
    assert.equal(host.querySelector(".biu-table")?.getAttribute("dir"), "rtl");

    await act(async () =>
      root.render(
        React.createElement(ProTable<Row>, {
          dir: "rtl",
          columns,
          dataSource: [{ id: 1, name: "方向", status: "enabled" }],
          rowKey: "id",
          showColumnSettings: false,
          showDensity: false,
          showFullscreen: false,
          pagination: false,
        }),
      ),
    );
    assert.equal(host.querySelector(".biu-pro-table")?.getAttribute("dir"), "rtl");
    assert.equal(host.querySelector(".biu-table")?.getAttribute("dir"), "rtl");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

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
    readTableStyles();
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
