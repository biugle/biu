import assert from "node:assert/strict";
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
  Tooltip,
} from "../src/ui/index.js";
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

function dispatchPointerMove(target: Element) {
  const event = new browserWindow.MouseEvent("pointermove", { bubbles: true });
  Object.defineProperty(event, "pointerType", { configurable: true, value: "mouse" });
  target.dispatchEvent(event);
}

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
    assert.equal(ellipsis.getAttribute("data-biu-ellipsis-active"), "true");
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
