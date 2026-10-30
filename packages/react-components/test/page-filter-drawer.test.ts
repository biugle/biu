import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { Select, TextField } from "../src/ui/index.js";
import { PageFilter, PageFilterItem } from "../src/pro/index.js";
import { createTestDom } from "./fixtures/react-dom.js";
import { mockPageFilterWidth } from "./fixtures/page-filter-width.js";

const { mount, unmount } = createTestDom("overlay");

test("PageFilter opens advanced fields in a body-mounted Drawer and keeps it controllable", async () => {
  const changes: boolean[] = [];
  const rendered = await mount(
    React.createElement(
      PageFilter,
      {
        drawerTitle: "高级筛选",
        onDrawerOpenChange: (open: boolean) => changes.push(open),
        moreFields: React.createElement(
          PageFilterItem,
          { label: "创建人" },
          React.createElement("input", { placeholder: "请输入创建人" }),
        ),
        actions: React.createElement("button", { type: "button" }, "查询"),
      },
      React.createElement(
        PageFilterItem,
        { label: "关键字" },
        React.createElement("input", { placeholder: "请输入关键字" }),
      ),
    ),
  );
  try {
    const more = rendered.host.querySelector<HTMLButtonElement>(".biu-pro-page-filter__more");
    assert.ok(more);
    await act(async () => more.click());
    assert.deepEqual(changes, [true]);
    const drawer = document.querySelector(".biu-pro-drawer");
    const content = document.querySelector(".biu-ui-dialog__content");
    const panel = document.querySelector(".biu-ui-dialog__panel");
    assert.ok(drawer);
    assert.ok(content);
    assert.ok(panel);
    assert.equal(content?.parentElement, document.body);
    assert.equal(document.body.textContent?.includes("高级筛选"), true);
    assert.equal(document.querySelector<HTMLInputElement>('input[placeholder="请输入创建人"]') !== null, true);
    assert.equal(document.querySelector<HTMLInputElement>('input[placeholder="请输入关键字"]') !== null, true);
    assert.equal(
      document.querySelector('[data-biu-slot="page-filter-drawer-fields"]')?.querySelectorAll("input").length,
      2,
    );
    const close = document.querySelector<HTMLButtonElement>('[data-biu-slot="dialog-close"]');
    assert.ok(close);
    await act(async () => close.click());
    assert.deepEqual(changes, [true, false]);
  } finally {
    await unmount(rendered);
  }
});

test("PageFilter keeps the body-mounted Drawer fields synchronized with controlled filter state", async () => {
  const makeFilter = (keyword: string, category: string) =>
    React.createElement(
      PageFilter,
      {
        moreFields: React.createElement(
          PageFilterItem,
          { label: "扩展关键词" },
          React.createElement(TextField, { value: keyword, onChange: () => undefined }),
        ),
        actions: React.createElement("button", { type: "button" }, "查询"),
      },
      React.createElement(
        PageFilterItem,
        { label: "关键词" },
        React.createElement(TextField, { value: keyword, onChange: () => undefined }),
      ),
      React.createElement(
        PageFilterItem,
        { label: "分类" },
        React.createElement(
          "select",
          { value: category, onChange: () => undefined },
          React.createElement("option", { value: "all" }, "全部"),
          React.createElement("option", { value: "book" }, "图书"),
        ),
      ),
    );

  const rendered = await mount(makeFilter("", "all"));
  try {
    await act(async () => rendered.host.querySelector<HTMLButtonElement>(".biu-pro-page-filter__more")?.click());
    const drawerFields = document.querySelector<HTMLElement>('[data-biu-slot="page-filter-drawer-fields"]');
    assert.ok(drawerFields);
    const input = drawerFields.querySelector<HTMLInputElement>("input");
    const select = drawerFields.querySelector<HTMLSelectElement>("select");
    assert.ok(input);
    assert.ok(select);

    await act(async () => rendered.root.render(makeFilter("同步后的关键词", "book")));
    const updatedInput = document
      .querySelector<HTMLElement>('[data-biu-slot="page-filter-drawer-fields"]')
      ?.querySelector<HTMLInputElement>("input");
    const updatedSelect = document
      .querySelector<HTMLElement>('[data-biu-slot="page-filter-drawer-fields"]')
      ?.querySelector<HTMLSelectElement>("select");
    assert.equal(updatedInput?.value, "同步后的关键词");
    assert.equal(updatedSelect?.value, "book");
    assert.equal(
      rendered.host.querySelector<HTMLInputElement>('[data-biu-page-filter-index="0"] input')?.value,
      "同步后的关键词",
      "the inline controlled field should receive the same filter state",
    );
  } finally {
    await unmount(rendered);
  }
});

test("PageFilter keeps Drawer input focus and mirrors each controlled change to the inline field", async () => {
  const restoreWidth = mockPageFilterWidth(900);
  function FilterHarness() {
    const [keyword, setKeyword] = React.useState("");
    const [category, setCategory] = React.useState("all");
    return React.createElement(
      PageFilter,
      {
        actions: React.createElement("button", { type: "button" }, "查询"),
        moreFields: React.createElement(
          PageFilterItem,
          { label: "扩展" },
          React.createElement("input", { placeholder: "扩展条件" }),
        ),
      },
      React.createElement(
        PageFilterItem,
        { label: "关键词" },
        React.createElement(TextField, {
          value: keyword,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => setKeyword(event.currentTarget.value),
          onInput: (event: React.FormEvent<HTMLInputElement>) => setKeyword(event.currentTarget.value),
        }),
      ),
      React.createElement(
        PageFilterItem,
        { label: "分类" },
        React.createElement(Select, {
          value: category,
          options: [
            { label: "全部分类", value: "all" },
            { label: "图书", value: "book" },
          ],
          onChange: (value: string | string[] | undefined) => setCategory(String(value ?? "all")),
        }),
      ),
    );
  }

  const rendered = await mount(React.createElement(FilterHarness));
  try {
    await act(async () => rendered.host.querySelector<HTMLButtonElement>(".biu-pro-page-filter__more")?.click());
    const drawerFields = document.querySelector<HTMLElement>('[data-biu-slot="page-filter-drawer-fields"]');
    assert.ok(drawerFields);
    const input = drawerFields.querySelector<HTMLInputElement>("input");
    assert.ok(input);
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    input.focus();
    for (const value of ["测", "测试", "测试项"]) {
      await act(async () => {
        setter?.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      assert.equal(document.activeElement, input, `Drawer input should keep focus after ${value}`);
      assert.equal(rendered.host.querySelector<HTMLInputElement>("input")?.value, value);
    }

    const categoryTrigger = drawerFields.querySelector<HTMLElement>('[role="combobox"]');
    assert.ok(categoryTrigger);
    await act(async () => categoryTrigger.click());
    const bookOption = [...document.querySelectorAll<HTMLButtonElement>('[role="option"]')].find(
      (option) => option.textContent?.trim() === "图书",
    );
    assert.ok(bookOption);
    await act(async () => bookOption.click());
    assert.equal(categoryTrigger.textContent?.includes("图书"), true);
    assert.equal(
      [...rendered.host.querySelectorAll<HTMLElement>('[role="combobox"]')].some((trigger) =>
        trigger.textContent?.includes("图书"),
      ),
      true,
      "the inline Select should receive the same controlled value",
    );
  } finally {
    restoreWidth();
    await unmount(rendered);
  }
});

test("PageFilter flattens Fragment fields for maxRows measurement and Drawer reuse", async () => {
  const restoreWidth = mockPageFilterWidth(300);
  const rendered = await mount(
    React.createElement(
      PageFilter,
      { maxRows: 2, actions: React.createElement("button", { type: "button" }, "查询") },
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          PageFilterItem,
          { label: "关键字" },
          React.createElement("input", { placeholder: "关键字" }),
        ),
        React.createElement(PageFilterItem, { label: "状态" }, React.createElement("input", { placeholder: "状态" })),
        React.createElement(
          PageFilterItem,
          { label: "负责人" },
          React.createElement("input", { placeholder: "负责人" }),
        ),
      ),
    ),
  );
  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    assert.equal(rendered.host.querySelectorAll("[data-biu-page-filter-index]").length, 1);
    assert.ok(rendered.host.querySelector<HTMLButtonElement>(".biu-pro-page-filter__more"));
    await act(async () => rendered.host.querySelector<HTMLButtonElement>(".biu-pro-page-filter__more")?.click());
    const drawerFields = document.querySelector<HTMLElement>('[data-biu-slot="page-filter-drawer-fields"]');
    assert.ok(drawerFields);
    assert.equal(drawerFields.querySelectorAll('[data-biu-component="page-filter-item"]').length, 3);
  } finally {
    restoreWidth();
    await unmount(rendered);
  }
});

test("PageFilter recalculates capacity for changed item widths and shares collapsed fields with the Drawer", async () => {
  const restoreWidth = mockPageFilterWidth(900, 100);
  const renderFilter = (itemMinWidth: number) =>
    React.createElement(
      PageFilter,
      { itemMinWidth, maxRows: 2, onSearch: () => undefined },
      ...["关键字", "状态", "负责人", "版本", "归属团队"].map((label) =>
        React.createElement(PageFilterItem, { key: label, label }, React.createElement(TextField)),
      ),
    );
  const rendered = await mount(renderFilter(170));
  try {
    const fields = rendered.host.querySelector<HTMLElement>(".biu-pro-page-filter__fields");
    assert.equal(fields?.style.getPropertyValue("--biu-page-filter-columns"), "3");
    await act(async () => rendered.root.render(renderFilter(360)));
    assert.equal(fields?.style.getPropertyValue("--biu-page-filter-columns"), "2");
    assert.equal(fields?.querySelectorAll('[data-biu-component="page-filter-item"]').length, 3);
    const more = rendered.host.querySelector<HTMLButtonElement>(".biu-pro-page-filter__more");
    assert.ok(more);
    await act(async () => more.click());
    assert.equal(
      document.querySelector('[data-biu-slot="page-filter-drawer-fields"]')?.querySelectorAll("input").length,
      5,
    );
  } finally {
    restoreWidth();
    await unmount(rendered);
  }
});

test("PageFilter honors a one-row narrow layout by offering all fields in the Drawer", async () => {
  const restoreWidth = mockPageFilterWidth(300, 100);
  const rendered = await mount(
    React.createElement(
      PageFilter,
      { maxRows: 1, onSearch: () => undefined },
      React.createElement(PageFilterItem, { label: "关键字" }, React.createElement(TextField)),
      React.createElement(PageFilterItem, { label: "状态" }, React.createElement(TextField)),
    ),
  );
  try {
    const fields = rendered.host.querySelector<HTMLElement>(".biu-pro-page-filter__fields");
    assert.equal(fields?.querySelectorAll('[data-biu-component="page-filter-item"]').length, 0);
    assert.equal(fields?.children.length, 1);
    assert.ok(fields?.querySelector(".biu-pro-page-filter__more"));
  } finally {
    restoreWidth();
    await unmount(rendered);
  }
});

test("PageFilter excludes visible Drawer fields when requested but retains collapsed and explicit extra fields", async () => {
  const restoreWidth = mockPageFilterWidth(300, 100);
  const labels = ["关键字", "状态", "负责人"];
  const rendered = await mount(
    React.createElement(
      PageFilter,
      {
        includeVisibleFieldsInDrawer: false,
        onSearch: () => undefined,
        moreFields: React.createElement(
          PageFilterItem,
          { label: "扩展" },
          React.createElement(TextField, { name: "扩展" }),
        ),
      },
      ...labels.map((label) =>
        React.createElement(PageFilterItem, { key: label, label }, React.createElement(TextField, { name: label })),
      ),
    ),
  );
  try {
    const more = rendered.host.querySelector<HTMLButtonElement>(".biu-pro-page-filter__more");
    assert.ok(more);
    await act(async () => more.click());
    const drawerFields = document.querySelector<HTMLElement>('[data-biu-slot="page-filter-drawer-fields"]');
    assert.deepEqual(
      [...(drawerFields?.querySelectorAll<HTMLInputElement>("input") ?? [])].map((input) => input.name),
      ["状态", "负责人", "扩展"],
    );
    assert.equal(rendered.host.querySelector<HTMLInputElement>("input")?.name, "关键字");
  } finally {
    restoreWidth();
    await unmount(rendered);
  }
});

test("PageFilter keeps an open Drawer and its input focus when resizing removes automatic overflow", async () => {
  let width = 300;
  const restoreWidth = mockPageFilterWidth(() => width, 100);
  const changes: boolean[] = [];
  const rendered = await mount(
    React.createElement(
      PageFilter,
      { onSearch: () => undefined, onDrawerOpenChange: (open: boolean) => changes.push(open) },
      ...["关键字", "状态", "负责人"].map((label) =>
        React.createElement(PageFilterItem, { key: label, label }, React.createElement(TextField, { name: label })),
      ),
    ),
  );
  try {
    const more = rendered.host.querySelector<HTMLButtonElement>(".biu-pro-page-filter__more");
    assert.ok(more);
    await act(async () => more.click());
    const input = document.querySelector<HTMLInputElement>('[data-biu-slot="page-filter-drawer-fields"] input');
    assert.ok(input);
    input.focus();
    width = 900;
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(document.activeElement, input);
    assert.equal(document.querySelector('[data-biu-slot="page-filter-drawer-fields"] input'), input);
    assert.deepEqual(changes, [true]);
    const close = document.querySelector<HTMLButtonElement>('[data-biu-slot="dialog-close"]');
    assert.ok(close);
    await act(async () => close.click());
    assert.deepEqual(changes, [true, false]);
    assert.equal(rendered.host.querySelector(".biu-pro-page-filter__more"), null);
    width = 300;
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(document.querySelector('[data-biu-slot="page-filter-drawer-fields"]'), null);
    assert.ok(rendered.host.querySelector(".biu-pro-page-filter__more"));
  } finally {
    restoreWidth();
    await unmount(rendered);
  }
});

test("PageFilter keeps standard controls compact in the inline area and Drawer", async () => {
  const restoreWidth = mockPageFilterWidth(500);
  const rendered = await mount(
    React.createElement(
      PageFilter,
      { defaultDrawerOpen: true, moreFields: React.createElement(PageFilterItem, { label: "负责人" }, "负责人") },
      React.createElement(
        PageFilterItem,
        { label: "关键词" },
        React.createElement(TextField, { placeholder: "关键词" }),
      ),
      React.createElement(
        PageFilterItem,
        { label: "状态" },
        React.createElement(Select, { options: [{ value: "ready", label: "可用" }] }),
      ),
    ),
  );
  try {
    const renderedFields = [
      ...document.querySelectorAll<HTMLElement>(
        ".biu-pro-page-filter__fields .biu-ui-textfield--small, [data-biu-slot='page-filter-drawer-fields'] .biu-ui-textfield--small",
      ),
    ];
    const renderedSelects = [
      ...document.querySelectorAll<HTMLElement>(
        ".biu-pro-page-filter__fields .biu-ui-select--small, [data-biu-slot='page-filter-drawer-fields'] .biu-ui-select--small",
      ),
    ];
    assert.equal(renderedFields.length, 2);
    assert.equal(renderedSelects.length, 2);
  } finally {
    restoreWidth();
    await unmount(rendered);
  }
});

test("PageFilter Drawer keeps portalled Select options interactive", async () => {
  const changes: Array<string | string[] | undefined> = [];
  const rendered = await mount(
    React.createElement(PageFilter, {
      drawerTitle: "高级筛选",
      moreFields: React.createElement(
        PageFilterItem,
        { label: "状态" },
        React.createElement(Select, {
          options: [
            { label: "已完成", value: "ready" },
            { label: "草稿", value: "draft" },
          ],
          onChange: (value: string | string[] | undefined) => changes.push(value),
        }),
      ),
    }),
  );
  try {
    await act(async () => rendered.host.querySelector<HTMLButtonElement>(".biu-pro-page-filter__more")?.click());
    const trigger = document.querySelector<HTMLElement>('[role="combobox"]');
    assert.ok(trigger);
    await act(async () => trigger.click());
    const option = document.querySelector<HTMLButtonElement>('[role="option"][aria-selected="false"]');
    assert.ok(option);
    await act(async () => option.click());
    assert.deepEqual(changes, ["ready"]);
    assert.ok(document.querySelector(".biu-pro-drawer"));
    assert.equal(document.querySelector('[data-biu-slot="dialog-close"]') !== null, true);
  } finally {
    await unmount(rendered);
  }
});
