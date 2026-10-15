import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  DrawerContent,
  DropdownMenu,
  CopyText,
  Detail,
  Ellipsis,
  Popconfirm,
  Popover,
  Pagination,
  Progress,
  Select,
  Tabs,
  TextField,
  Tooltip,
} from "../src/ui/index.js";
import { FilePreviewDialog } from "../src/ui/file/index.js";
import { Dialog as ProDialog, Drawer as ProDrawer } from "../src/pro/index.js";
import { PageFilter, PageFilterItem } from "../src/pro/index.js";
import { fire, type FireHandle } from "../src/fire.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
const browserWindow = dom.window;
Object.assign(globalThis, {
  window: browserWindow,
  document: browserWindow.document,
  HTMLElement: browserWindow.HTMLElement,
  HTMLButtonElement: browserWindow.HTMLButtonElement,
  HTMLInputElement: browserWindow.HTMLInputElement,
  HTMLTextAreaElement: browserWindow.HTMLTextAreaElement,
  HTMLSelectElement: browserWindow.HTMLSelectElement,
  HTMLIFrameElement: browserWindow.HTMLIFrameElement,
  DocumentFragment: browserWindow.DocumentFragment,
  NodeFilter: browserWindow.NodeFilter,
  KeyboardEvent: browserWindow.KeyboardEvent,
  MouseEvent: browserWindow.MouseEvent,
  PointerEvent: browserWindow.PointerEvent ?? browserWindow.MouseEvent,
  Node: browserWindow.Node,
  Event: browserWindow.Event,
  CustomEvent: browserWindow.CustomEvent,
  MutationObserver: browserWindow.MutationObserver,
  getComputedStyle: browserWindow.getComputedStyle,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: browserWindow.navigator });
Object.defineProperty(browserWindow.HTMLElement.prototype, "attachEvent", {
  configurable: true,
  value: () => undefined,
});
Object.defineProperty(browserWindow.HTMLElement.prototype, "detachEvent", {
  configurable: true,
  value: () => undefined,
});
class TestResizeObserver {
  observe() {}
  disconnect() {}
}
Object.assign(browserWindow, {
  ResizeObserver: TestResizeObserver,
  requestAnimationFrame: (callback: FrameRequestCallback) => browserWindow.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => browserWindow.clearTimeout(id),
});
Object.assign(globalThis, { ResizeObserver: TestResizeObserver });

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

function mockPageFilterWidth(width: number | (() => number), actionWidth: number | (() => number) = 0) {
  const original = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    const rect = original.call(this);
    if (this.hasAttribute("data-biu-page-filter-actions")) {
      const measuredActionWidth = typeof actionWidth === "function" ? actionWidth() : actionWidth;
      return {
        x: rect.x,
        y: rect.y,
        width: measuredActionWidth,
        height: rect.height,
        top: rect.top,
        right: rect.left + measuredActionWidth,
        bottom: rect.bottom,
        left: rect.left,
        toJSON: () => ({}),
      } as DOMRect;
    }
    if (!this.classList.contains("biu-pro-page-filter__fields")) return rect;
    const measuredWidth = typeof width === "function" ? width() : width;
    return {
      x: rect.x,
      y: rect.y,
      width: measuredWidth,
      height: rect.height,
      top: rect.top,
      right: rect.left + measuredWidth,
      bottom: rect.bottom,
      left: rect.left,
      toJSON: () => ({}),
    } as DOMRect;
  };
  return () => {
    HTMLElement.prototype.getBoundingClientRect = original;
  };
}

function dispatchPointerMove(target: Element) {
  const event = new browserWindow.MouseEvent("pointermove", { bubbles: true });
  Object.defineProperty(event, "pointerType", { configurable: true, value: "mouse" });
  target.dispatchEvent(event);
}

test("FilePreviewDialog ignores an empty file after the last upload is removed", async () => {
  const rendered = await mount(
    React.createElement(FilePreviewDialog, {
      open: false,
      onOpenChange: () => undefined,
      file: undefined as never,
    }),
  );
  try {
    assert.equal(rendered.host.textContent, "");
    assert.equal(document.querySelector(".biu-ui-dialog__content"), null);
  } finally {
    await unmount(rendered);
  }
});

test("Dialog portals content, keeps the panel separate from the overlay, and restores body scrolling", async () => {
  const changes: Array<[boolean, string | undefined]> = [];
  const rendered = await mount(
    React.createElement(
      Dialog,
      {
        open: true,
        onOpenChange: (open: boolean, reason?: string) => changes.push([open, reason]),
      },
      React.createElement(
        DialogContent,
        null,
        React.createElement(DialogTitle, null, "测试 Dialog"),
        React.createElement("button", { type: "button" }, "确定"),
      ),
    ),
  );
  try {
    const content = document.querySelector(".biu-ui-dialog__content");
    const overlay = document.querySelector(".biu-ui-dialog__overlay");
    const panel = document.querySelector(".biu-ui-dialog__panel");
    assert.ok(content);
    assert.ok(overlay);
    assert.ok(panel);
    assert.equal(content.parentElement, document.body);
    assert.equal(panel.parentElement, content);
    assert.equal(overlay.nextElementSibling, panel);
    assert.equal(document.body.style.overflow, "hidden");

    await act(async () => {
      panel.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    assert.deepEqual(changes, []);

    await act(async () => {
      overlay.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    assert.deepEqual(changes.at(-1), [false, "overlay"]);

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    assert.deepEqual(changes.at(-1), [false, "escape"]);
  } finally {
    await unmount(rendered);
  }
  assert.equal(document.body.style.overflow, "");
});

test("Drawer portals placement classes and its requested dimension to the viewport layer", async () => {
  for (const placement of ["left", "right", "top", "bottom"] as const) {
    const rendered = await mount(
      React.createElement(
        Drawer,
        { open: true, placement, size: placement === "left" || placement === "right" ? 560 : 360 },
        React.createElement(DrawerContent, null, React.createElement("p", null, "抽屉内容")),
      ),
    );
    try {
      const content = document.querySelector(".biu-ui-dialog__content");
      const panel = document.querySelector(".biu-ui-dialog__panel");
      assert.ok(content);
      assert.ok(panel);
      assert.equal(content.parentElement, document.body);
      assert.equal(content.classList.contains(`biu-ui-drawer--${placement}`), true);
      assert.equal(panel.parentElement, content);
      const style = content.getAttribute("style") ?? "";
      assert.match(
        style,
        placement === "left" || placement === "right" ? /--biu-drawer-size: 560px/ : /--biu-drawer-height: 360px/,
      );
    } finally {
      await unmount(rendered);
    }
  }
});

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

test("Tabs does not reserve an empty panel when tab items have no content", async () => {
  const rendered = await mount(
    React.createElement(Tabs, {
      items: [
        { key: "all", label: "全部" },
        { key: "ready", label: "已完成" },
      ],
    }),
  );
  try {
    assert.equal(rendered.host.querySelector('[role="tabpanel"]'), null);
  } finally {
    await unmount(rendered);
  }
});

test("Tabs stretches its tab list across the parent width by default", async () => {
  const rendered = await mount(
    React.createElement(Tabs, {
      items: [
        { key: "all", label: "全部" },
        { key: "ready", label: "已完成" },
      ],
    }),
  );
  try {
    const tabs = rendered.host.querySelector<HTMLElement>(".biu-ui-tabs");
    const bar = rendered.host.querySelector<HTMLElement>(".biu-ui-tabs__bar");
    const list = rendered.host.querySelector<HTMLElement>(".biu-ui-tabs__list");
    assert.equal(tabs?.style.width, "100%");
    assert.ok(bar);
    assert.ok(list);
    const styles = readFileSync(new URL("../src/ui/tabs/styles.css", import.meta.url), "utf8");
    assert.match(styles, /\.biu-ui-tabs\s*\{[^}]*display:\s*block;[^}]*flex:\s*1 1 auto;[^}]*width:\s*100%;/s);
    assert.match(styles, /\.biu-ui-tabs__bar\s*\{[^}]*width:\s*100%;/s);
    assert.match(styles, /\.biu-ui-tabs__list\s*\{[^}]*flex:\s*1 1 0%;/s);
  } finally {
    await unmount(rendered);
  }
});

test("PageToolbar reserves the standard gap before its table content", () => {
  const styles = readFileSync(new URL("../src/ui/page/styles.css", import.meta.url), "utf8");
  assert.match(styles, /\.biu-ui-page__toolbar\s*\{[^}]*margin-bottom:\s*6px;/s);
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

test("Tooltip and Ellipsis expose complete text only after real overflow", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(
        Tooltip,
        { content: "完整提示", onlyOverflow: true },
        React.createElement("span", null, "短文本"),
      ),
      React.createElement(Ellipsis, { content: "一段需要截断后提示的长文本", style: { width: "40px" } }),
    ),
  );
  try {
    const tooltipHost = document.querySelector(".biu-ui-tooltip");
    const ellipsis = document.querySelector(".biu-ui-ellipsis");
    assert.ok(tooltipHost);
    assert.ok(ellipsis);
    Object.defineProperties(tooltipHost, {
      scrollWidth: { configurable: true, value: 120 },
      clientWidth: { configurable: true, value: 40 },
    });
    Object.defineProperties(ellipsis, {
      scrollWidth: { configurable: true, value: 40 },
      clientWidth: { configurable: true, value: 40 },
      scrollHeight: { configurable: true, value: 40 },
      clientHeight: { configurable: true, value: 40 },
    });
    const ellipsisContent = ellipsis.firstElementChild;
    assert.ok(ellipsisContent);
    Object.defineProperties(ellipsisContent, {
      scrollWidth: { configurable: true, value: 40 },
      clientWidth: { configurable: true, value: 40 },
      scrollHeight: { configurable: true, value: 240 },
      clientHeight: { configurable: true, value: 40 },
    });
    await act(async () => {
      window.dispatchEvent(new Event("resize"));
      const trigger = tooltipHost.querySelector(".biu-ui-tooltip__trigger");
      if (trigger) {
        trigger.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
        dispatchPointerMove(trigger);
      }
      await new Promise((resolve) => browserWindow.setTimeout(resolve, 0));
    });
    assert.equal(document.querySelector('[role="tooltip"]')?.textContent, "完整提示");
    await act(async () => {
      const ellipsisTarget = document.querySelector(".biu-ui-ellipsis");
      if (ellipsisTarget) dispatchPointerMove(ellipsisTarget);
      await new Promise((resolve) => browserWindow.setTimeout(resolve, 0));
    });
    assert.equal(document.querySelector(".biu-ui-ellipsis")?.getAttribute("data-biu-ellipsis-active"), "true");
  } finally {
    await unmount(rendered);
  }
});

test("Tooltip does not render content for a non-overflowing target", async () => {
  const rendered = await mount(
    React.createElement(
      Tooltip,
      { content: "不应显示", onlyOverflow: true },
      React.createElement("span", null, "短文本"),
    ),
  );
  try {
    const host = document.querySelector(".biu-ui-tooltip");
    assert.ok(host);
    await act(async () => {
      const trigger = host.querySelector(".biu-ui-tooltip__trigger");
      if (trigger) dispatchPointerMove(trigger);
      await Promise.resolve();
    });
    assert.equal(document.querySelector('[role="tooltip"]'), null);
  } finally {
    await unmount(rendered);
  }
});

test("Ellipsis alwaysTooltip opens for a fitting value", async () => {
  const rendered = await mount(React.createElement(Ellipsis, { content: "短文本", alwaysTooltip: true }));
  try {
    const host = document.querySelector<HTMLElement>(".biu-ui-tooltip");
    const ellipsis = document.querySelector<HTMLElement>(".biu-ui-ellipsis");
    assert.ok(host);
    assert.ok(ellipsis);
    assert.equal(ellipsis.getAttribute("data-biu-ellipsis-always"), "true");
    const trigger = host.querySelector<HTMLElement>(".biu-ui-tooltip__trigger");
    assert.ok(trigger);
    await act(async () => {
      dispatchPointerMove(trigger);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    });
    assert.equal(document.querySelector('[role="tooltip"]')?.textContent, "短文本");
  } finally {
    await unmount(rendered);
  }
});

test("CopyText renders a copy action and supports hover-only visibility", async () => {
  const copied: string[] = [];
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async (value: string) => copied.push(value) },
  });
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(CopyText, { text: "复制内容", copyOnHover: true }),
      React.createElement(CopyText, { text: "默认显示" }),
    ),
  );
  try {
    const copyButtons = rendered.host.querySelectorAll<HTMLButtonElement>(".biu-ui-copy-text__button");
    assert.equal(copyButtons.length, 2);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-copy-text--hover").length, 1);
    await act(async () => copyButtons[1]?.click());
    assert.deepEqual(copied, ["默认显示"]);
    assert.equal(rendered.host.querySelectorAll('[data-biu-copy-state="copied"]').length, 1);
  } finally {
    await unmount(rendered);
  }
});

test("Detail renders configured sections, dotted values, spans and field tooltips", async () => {
  const rendered = await mount(
    React.createElement(Detail, {
      data: { station: { name: "Jeddah Station" }, status: "开启", address: "很长的地址" },
      columns: 4,
      sections: [
        {
          key: "basic",
          title: "核心信息",
          items: [
            { key: "station.name", title: "站点名称", tooltip: "站点的业务名称" },
            { key: "status", title: "状态", span: 2 },
            { key: "address", title: "地址", ellipsis: true },
          ],
        },
      ],
    }),
  );
  try {
    assert.equal(document.querySelector('[data-biu-component="detail"]')?.classList.contains("biu-ui-detail"), true);
    assert.equal(document.querySelector('[data-biu-detail-section="basic"] h3')?.textContent, "核心信息");
    assert.equal(
      document.querySelector('[data-biu-detail-item="station.name"] .biu-ui-detail__value')?.textContent,
      "Jeddah Station",
    );
    assert.equal(
      document.querySelector('[data-biu-detail-item="status"]')?.getAttribute("style"),
      "grid-column: span 2 / span 2;",
    );
    assert.equal(document.querySelectorAll(".biu-ui-detail__tooltip").length, 1);
  } finally {
    await unmount(rendered);
  }
});

test("PageFilterItem and Detail center explicit label text with every tooltip layer", async () => {
  const style = document.createElement("style");
  style.textContent = [
    "../src/ui/tooltip/styles.css",
    "../src/pro/page-filter/styles.css",
    "../src/ui/detail/styles.css",
  ]
    .map((path) => readFileSync(new URL(path, import.meta.url), "utf8"))
    .join("\n");
  document.head.append(style);
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(
        PageFilterItem,
        { label: "负责人", required: true, tooltip: "筛选说明" },
        React.createElement(TextField),
      ),
      React.createElement(Detail, {
        data: { owner: "业务团队" },
        sections: [{ items: [{ key: "owner", title: "负责人", tooltip: "详情说明" }] }],
      }),
    ),
  );
  try {
    for (const [labelSelector, textSelector, rootSelector, triggerSelector, iconSelector] of [
      [
        ".biu-pro-page-filter__item-label",
        ".biu-pro-page-filter__item-label-text",
        ".biu-pro-page-filter__tooltip-root",
        ".biu-pro-page-filter__tooltip-trigger",
        ".biu-pro-page-filter__item-tooltip > svg",
      ],
      [
        ".biu-ui-detail__label",
        ".biu-ui-detail__label-text",
        ".biu-ui-detail__tooltip-root",
        ".biu-ui-detail__tooltip-trigger",
        ".biu-ui-detail__tooltip > svg",
      ],
    ]) {
      const label = rendered.host.querySelector<HTMLElement>(labelSelector!);
      const text = label?.querySelector<HTMLElement>(textSelector!);
      const tooltip = label?.querySelector<HTMLElement>(`:scope > ${rootSelector}`);
      const trigger = tooltip?.querySelector<HTMLElement>(`:scope > ${triggerSelector}`);
      const icon = trigger?.querySelector(iconSelector!);
      assert.ok(label);
      assert.ok(text);
      assert.ok(tooltip);
      assert.ok(trigger);
      assert.ok(icon);
      assert.equal(window.getComputedStyle(label).alignItems, "center");
      assert.equal(window.getComputedStyle(text).display, "block");
      for (const layer of [tooltip, trigger]) {
        const computed = window.getComputedStyle(layer);
        assert.equal(computed.display, "inline-flex");
        assert.equal(computed.alignItems, "center");
        assert.equal(computed.lineHeight, "1");
      }
      assert.equal(window.getComputedStyle(icon).display, "block");
    }
  } finally {
    await unmount(rendered);
    style.remove();
  }
});

test("Popover and Popconfirm open when the trigger is an interactive button", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(Popover, {
        content: React.createElement("p", null, "弹出内容"),
        children: React.createElement("button", null, "打开"),
      }),
      React.createElement(Popconfirm, { title: "确认吗？", children: React.createElement("button", null, "确认") }),
    ),
  );
  try {
    const triggers = document.querySelectorAll<HTMLButtonElement>(".biu-ui-popover__trigger button");
    assert.equal(triggers.length, 2);
    await act(async () => triggers[0]?.click());
    assert.equal(document.querySelectorAll(".biu-ui-popover")[0]?.getAttribute("data-state"), "open");
    assert.ok(document.querySelector('.biu-ui-popover__content[data-biu-slot="popover-content"]'));
    await act(async () => triggers[1]?.click());
    assert.equal(document.querySelectorAll(".biu-ui-popover")[1]?.getAttribute("data-state"), "open");
    assert.equal(document.querySelector(".biu-ui-popconfirm")?.textContent?.includes("确定"), true);
    assert.ok(document.querySelector(".biu-ui-popconfirm__popover-content"));
  } finally {
    await unmount(rendered);
  }
});

test("DropdownMenu keeps checkbox and radio items interactive and controllable", async () => {
  const checkedChanges: string[][] = [];
  const radioChanges: Array<[string, string]> = [];
  const itemActions: string[] = [];
  const rendered = await mount(
    React.createElement(DropdownMenu, {
      trigger: React.createElement("button", null, "更多"),
      open: true,
      defaultCheckedKeys: ["compact"],
      defaultRadioValue: "light",
      onCheckedChange: (keys: string[]) => checkedChanges.push(keys),
      onRadioChange: (value: string, group: string) => radioChanges.push([value, group]),
      items: [
        { key: "compact", type: "checkbox", label: "紧凑模式", onClick: () => itemActions.push("compact") },
        { key: "line", type: "separator" },
        { key: "light", type: "radio", radioGroup: "theme", label: "浅色" },
        { key: "dark", type: "radio", radioGroup: "theme", label: "深色" },
      ],
    }),
  );
  try {
    await act(async () => {
      await new Promise((resolve) => browserWindow.setTimeout(resolve, 20));
    });
    const checkbox = document.querySelector<HTMLElement>('[role="menuitemcheckbox"]');
    const radios = document.querySelectorAll<HTMLElement>('[role="menuitemradio"]');
    assert.ok(checkbox);
    assert.equal(checkbox.getAttribute("data-state"), "checked");
    assert.equal(radios.length, 2);
    await act(async () => checkbox.click());
    assert.equal(checkbox.getAttribute("data-state"), "unchecked");
    assert.deepEqual(checkedChanges.at(-1), []);
    assert.deepEqual(itemActions, ["compact"]);
    const darkRadio = document.querySelectorAll<HTMLElement>('[role="menuitemradio"]')[1];
    await act(async () => darkRadio?.click());
    assert.equal(
      document.querySelectorAll<HTMLElement>('[role="menuitemradio"]')[1]?.getAttribute("data-state"),
      "checked",
    );
    assert.deepEqual(radioChanges.at(-1), ["dark", "theme"]);
  } finally {
    await unmount(rendered);
  }
});

test("Pagination and Progress attach classNames to the actual slots", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(Pagination, {
        current: 2,
        pageSize: 10,
        total: 80,
        showQuickJumper: true,
        quickJumperWidth: 96,
        classNames: { root: "pagination-root", jumper: "pagination-jumper" },
      }),
      React.createElement(Progress, {
        percent: 45,
        classNames: { root: "progress-root", track: "progress-track", fill: "progress-fill" },
      }),
    ),
  );
  try {
    assert.ok(document.querySelector(".biu-ui-pagination.pagination-root"));
    assert.ok(document.querySelector(".biu-ui-pagination__jumper.pagination-jumper"));
    assert.ok(document.querySelector(".biu-ui-pagination__jumper .biu-ui-textfield"));
    assert.ok(document.querySelector('.biu-ui-pagination__jumper .biu-ui-textfield__input[type="number"]'));
    assert.match(
      document.querySelector(".biu-ui-pagination__jumper")?.getAttribute("style") ?? "",
      /--biu-pagination-jumper-width: 96px/,
    );
    assert.ok(document.querySelector(".biu-ui-progress.progress-root .progress-track"));
    assert.ok(document.querySelector(".progress-track .progress-fill"));
  } finally {
    await unmount(rendered);
  }
});

test("Pro Dialog uses Chinese defaults, honors maskClosable and waits for async confirmation", async () => {
  const changes: Array<[boolean, string | undefined]> = [];
  let resolveOk!: () => void;
  const ok = new Promise<void>((resolve) => {
    resolveOk = resolve;
  });
  const rendered = await mount(
    React.createElement(
      ProDialog,
      {
        open: true,
        title: "确认操作",
        maskClosable: false,
        onOk: () => ok,
        onOpenChange: (open: boolean, reason?: string) => changes.push([open, reason]),
      },
      React.createElement("p", null, "内容"),
    ),
  );
  try {
    assert.equal(document.querySelector(".biu-pro-dialog--medium") !== null, true);
    assert.equal(document.querySelectorAll(".biu-ui-button")[0]?.textContent, "取消");
    assert.equal(document.querySelectorAll(".biu-ui-button")[1]?.textContent, "确定");
    const overlay = document.querySelector(".biu-ui-dialog__overlay");
    assert.ok(overlay);
    await act(async () => {
      overlay.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    assert.deepEqual(changes, []);
    const confirm = document.querySelectorAll<HTMLButtonElement>(".biu-ui-button")[1];
    assert.ok(confirm);
    await act(async () => {
      confirm.click();
      await Promise.resolve();
    });
    assert.equal(confirm.disabled, true);
    resolveOk();
    await act(async () => {
      await ok;
      await Promise.resolve();
    });
    assert.deepEqual(changes.at(-1), [false, "programmatic"]);
  } finally {
    await unmount(rendered);
  }
});

test("Pro Drawer maps semantic sizes, keeps the viewport layer and supports non-closable masks", async () => {
  const changes: Array<[boolean, string | undefined]> = [];
  const rendered = await mount(
    React.createElement(
      ProDrawer,
      {
        open: true,
        placement: "left",
        size: "large",
        maskClosable: false,
        title: "抽屉",
        onOpenChange: (open: boolean, reason?: string) => changes.push([open, reason]),
      },
      React.createElement("p", null, "长内容"),
    ),
  );
  try {
    const content = document.querySelector(".biu-ui-dialog__content");
    const panel = document.querySelector(".biu-ui-dialog__panel");
    const overlay = document.querySelector(".biu-ui-dialog__overlay");
    assert.ok(content);
    assert.ok(panel);
    assert.ok(overlay);
    assert.equal(content.classList.contains("biu-ui-drawer--left"), true);
    assert.equal(content.classList.contains("biu-pro-drawer"), true);
    assert.match(content.getAttribute("style") ?? "", /--biu-drawer-size: 720px/);
    assert.equal(panel.parentElement, content);
    assert.equal(overlay.nextElementSibling, panel);
    await act(async () => {
      overlay.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    assert.deepEqual(changes, []);
  } finally {
    await unmount(rendered);
  }
});

test("UI and Pro Drawer default to the right placement", async () => {
  const rendered = await mount(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(Drawer, { open: true }, React.createElement(DrawerContent, null, "UI")),
      React.createElement(ProDrawer, { open: true }, React.createElement("p", null, "Pro")),
    ),
  );
  try {
    const contents = [...document.querySelectorAll<HTMLElement>('[data-biu-slot="dialog-content"]')];
    assert.equal(contents.length, 2);
    assert.ok(contents.every((content) => content.classList.contains("biu-ui-drawer--right")));
  } finally {
    await unmount(rendered);
  }
});

test("fire mounts, updates and destroys a Pro component", async () => {
  let handle!: FireHandle;
  await act(async () => {
    handle = fire(ProDialog)({ title: "初始标题", children: React.createElement("p", null, "内容") });
    await Promise.resolve();
  });
  try {
    assert.equal(document.querySelector(".biu-pro-dialog__heading")?.textContent, "初始标题");
    await act(async () => {
      handle.update({ title: "更新标题" });
      await Promise.resolve();
    });
    assert.equal(document.querySelector(".biu-pro-dialog__heading")?.textContent, "更新标题");
  } finally {
    await act(async () => {
      handle.destroy();
      fire.destroyAll();
    });
  }
  assert.equal(document.querySelector(".biu-fire-root"), null);
});

test("fire close hides an instance without destroying it and preserves the caller callback", async () => {
  const changes: boolean[] = [];
  let handle!: FireHandle;
  await act(async () => {
    handle = fire(ProDialog)({
      title: "可重新打开",
      onOpenChange: (open: boolean) => changes.push(open),
    });
    await Promise.resolve();
  });
  try {
    await act(async () => {
      await Promise.resolve();
    });
    assert.ok(document.querySelector(".biu-fire-root"));
    assert.ok(document.querySelector(".biu-pro-dialog__heading"));
    await act(async () => handle.close());
    assert.ok(document.querySelector(".biu-fire-root"));
    assert.equal(document.querySelector(".biu-pro-dialog__heading"), null);
    await act(async () => handle.update({ open: true }));
    assert.ok(document.querySelector(".biu-pro-dialog__heading"));
    const dialog = document.querySelector(".biu-ui-dialog__content");
    assert.ok(dialog);
    const overlay = document.querySelector(".biu-ui-dialog__overlay");
    assert.ok(overlay);
    await act(async () => overlay.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    assert.deepEqual(changes, [false]);
  } finally {
    await act(async () => handle.destroy());
  }
});
