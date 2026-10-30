import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { Select, TextField } from "../src/ui/index.js";
import { PageFilter, PageFilterItem } from "../src/pro/index.js";
import { createTestDom } from "./fixtures/react-dom.js";
import { mockPageFilterWidth } from "./fixtures/page-filter-width.js";
import { dispatchPointerMove } from "./fixtures/pointer.js";

const { browserWindow, mount, unmount } = createTestDom("overlay");

test("PageFilter automatically collapses fields beyond the responsive two-row capacity", async () => {
  const restoreWidth = mockPageFilterWidth(300);
  const field = (label: string) =>
    React.createElement(PageFilterItem, { key: label, label }, React.createElement("input", { placeholder: label }));
  const rendered = await mount(
    React.createElement(
      PageFilter,
      { actions: React.createElement("button", { type: "button" }, "查询") },
      field("关键字"),
      field("状态"),
      field("负责人"),
      field("版本"),
      field("归属团队"),
    ),
  );
  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    assert.ok(rendered.host.querySelector(".biu-pro-page-filter__more"));
    assert.equal(
      rendered.host.querySelector<HTMLButtonElement>(".biu-pro-page-filter__more")?.textContent?.trim(),
      "更多",
    );
    assert.equal(rendered.host.querySelectorAll(".biu-pro-page-filter__fields > .biu-pro-page-filter__item").length, 1);
  } finally {
    restoreWidth();
    await unmount(rendered);
  }
});

test("PageFilter measures the action cluster by its content width instead of its grid track", async () => {
  const restoreWidth = mockPageFilterWidth(900, 220);
  const field = (label: string) =>
    React.createElement(PageFilterItem, { key: label, label }, React.createElement("input", { placeholder: label }));
  const rendered = await mount(
    React.createElement(
      PageFilter,
      { actions: React.createElement("button", { type: "button" }, "查询") },
      field("关键字"),
      field("状态"),
      field("负责人"),
      field("版本"),
      field("归属团队"),
    ),
  );
  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    const fields = rendered.host.querySelector<HTMLElement>(".biu-pro-page-filter__fields");
    assert.equal(fields?.style.getPropertyValue("--biu-page-filter-columns"), "3");
    assert.equal(rendered.host.querySelectorAll(".biu-pro-page-filter__fields > .biu-pro-page-filter__item").length, 5);
    assert.equal(rendered.host.querySelector(".biu-pro-page-filter__more"), null);
  } finally {
    restoreWidth();
    await unmount(rendered);
  }
});

test("PageFilter keeps actions in the final explicit track without mounting hidden copies of controls", async () => {
  const restoreWidth = mockPageFilterWidth(1168, 104);
  const style = document.createElement("style");
  style.textContent = readFileSync(new URL("../src/pro/page-filter/styles.css", import.meta.url), "utf8");
  document.head.append(style);
  let mountedFields = 0;
  function Field() {
    React.useEffect(() => {
      mountedFields += 1;
      return () => {
        mountedFields -= 1;
      };
    }, []);
    return React.createElement(TextField);
  }
  const rendered = await mount(
    React.createElement(
      PageFilter,
      { onSearch: () => undefined },
      ...["关键字", "状态", "负责人", "版本", "归属团队"].map((label) =>
        React.createElement(PageFilterItem, { key: label, label }, React.createElement(Field)),
      ),
    ),
  );
  try {
    const fields = rendered.host.querySelector<HTMLElement>(".biu-pro-page-filter__fields");
    const action = rendered.host.querySelector<HTMLElement>("[data-biu-page-filter-actions]");
    assert.ok(fields);
    assert.ok(action);
    assert.equal(fields.style.getPropertyValue("--biu-page-filter-columns"), "3");
    assert.equal(window.getComputedStyle(action).gridColumn, "-2 / -1");
    assert.equal(mountedFields, 5);
    assert.equal(rendered.host.querySelectorAll("input").length, 5);
  } finally {
    await unmount(rendered);
    restoreWidth();
    style.remove();
  }
});

test("PageFilter recalculates columns when its actions become wider without changing the container", async () => {
  let actionWidth = 100;
  const restoreWidth = mockPageFilterWidth(900, () => actionWidth);
  const filterFields = ["关键字", "状态", "负责人", "版本", "归属团队"].map((label) =>
    React.createElement(PageFilterItem, { key: label, label }, React.createElement(TextField)),
  );
  const renderFilter = (buttonText: string) =>
    React.createElement(
      PageFilter,
      { actions: React.createElement("button", { type: "button" }, buttonText) },
      filterFields,
    );
  const rendered = await mount(renderFilter("查询"));
  try {
    const fields = rendered.host.querySelector<HTMLElement>(".biu-pro-page-filter__fields");
    assert.equal(fields?.style.getPropertyValue("--biu-page-filter-columns"), "3");
    actionWidth = 400;
    await act(async () => rendered.root.render(renderFilter("Search with all current filters")));
    assert.equal(fields?.style.getPropertyValue("--biu-page-filter-columns"), "2");
    assert.equal(fields?.querySelectorAll('[data-biu-component="page-filter-item"]').length, 3);
    assert.ok(fields?.querySelector(".biu-pro-page-filter__more"));
  } finally {
    restoreWidth();
    await unmount(rendered);
  }
});

test("PageFilter does not reserve space when no fields or actions are supplied", async () => {
  const rendered = await mount(React.createElement(PageFilter));
  try {
    assert.equal(rendered.host.children.length, 0);
  } finally {
    await unmount(rendered);
  }
});

test("PageFilter generates reset and search actions with callbacks when actions are omitted", async () => {
  const calls: string[] = [];
  const rendered = await mount(
    React.createElement(
      PageFilter,
      {
        onReset: () => calls.push("reset"),
        onSearch: () => calls.push("search"),
      },
      React.createElement(PageFilterItem, { label: "关键字" }, React.createElement("input")),
    ),
  );
  try {
    const buttons = [...rendered.host.querySelectorAll<HTMLButtonElement>(".biu-pro-page-filter__actions button")];
    assert.deepEqual(
      buttons.map((button) => button.textContent?.trim()),
      ["重置", "查询"],
    );
    await act(async () => buttons[0]?.click());
    await act(async () => buttons[1]?.click());
    assert.deepEqual(calls, ["reset", "search"]);
  } finally {
    await unmount(rendered);
  }
});

test("PageFilterItem applies w-full to its field control while preserving custom classes", async () => {
  const rendered = await mount(
    React.createElement(
      PageFilterItem,
      { label: "关键字", tooltip: "按名称筛选" },
      React.createElement("input", { className: "custom-field", placeholder: "请输入关键字" }),
    ),
  );
  try {
    const field = rendered.host.querySelector<HTMLInputElement>('input[placeholder="请输入关键字"]');
    assert.ok(field);
    assert.equal(field?.classList.contains("w-full"), true);
    assert.equal(field?.classList.contains("custom-field"), true);
    assert.equal(rendered.host.querySelectorAll(".biu-pro-page-filter__item-tooltip").length, 1);
    const tooltipTrigger = rendered.host.querySelector<HTMLElement>(".biu-ui-tooltip__trigger");
    assert.ok(tooltipTrigger);
    await act(async () => {
      tooltipTrigger.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
      dispatchPointerMove(tooltipTrigger);
      await new Promise((resolve) => browserWindow.setTimeout(resolve, 0));
    });
    assert.equal(document.querySelector('[role="tooltip"]')?.textContent, "按名称筛选");
  } finally {
    await unmount(rendered);
  }
});

test("PageFilterItem supports a fixed width without dropping its field contract", async () => {
  const rendered = await mount(
    React.createElement(
      PageFilterItem,
      { label: "关键字", width: 260 },
      React.createElement("input", { placeholder: "请输入关键字" }),
    ),
  );
  try {
    const item = rendered.host.querySelector<HTMLElement>('[data-biu-component="page-filter-item"]');
    assert.ok(item);
    assert.equal(item?.getAttribute("data-biu-page-filter-item-width"), "260");
    assert.match(item?.getAttribute("style") ?? "", /--biu-page-filter-item-width: 260px/);
    assert.equal(item?.querySelector("input")?.classList.contains("w-full"), true);
  } finally {
    await unmount(rendered);
  }
});

test("PageFilterItem tooltip does not block a Select trigger or its options", async () => {
  const changes: Array<string | string[] | undefined> = [];
  const rendered = await mount(
    React.createElement(
      PageFilterItem,
      { label: "状态", tooltip: "筛选示例状态" },
      React.createElement(Select, {
        options: [
          { label: "已完成", value: "ready" },
          { label: "草稿", value: "draft" },
        ],
        onChange: (value: string | string[] | undefined) => changes.push(value),
      }),
    ),
  );
  try {
    const trigger = rendered.host.querySelector<HTMLElement>('[role="combobox"]');
    assert.ok(trigger);
    await act(async () => trigger.click());
    const option = document.querySelector<HTMLButtonElement>('[role="option"][aria-selected="false"]');
    assert.ok(option);
    await act(async () => option.click());
    assert.deepEqual(changes, ["ready"]);
  } finally {
    await unmount(rendered);
  }
});
