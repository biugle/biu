import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Alert, Button, ButtonGroup, CheckboxGroup, Divider, DropdownMenu, RadioGroup } from "../src/ui/index.js";
import { message } from "../src/message.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
  HTMLSelectElement: dom.window.HTMLSelectElement,
  HTMLIFrameElement: dom.window.HTMLIFrameElement,
  Event: dom.window.Event,
  KeyboardEvent: dom.window.KeyboardEvent,
  MouseEvent: dom.window.MouseEvent,
  PointerEvent: dom.window.PointerEvent ?? dom.window.MouseEvent,
  DocumentFragment: dom.window.DocumentFragment,
  Node: dom.window.Node,
  NodeFilter: dom.window.NodeFilter,
  CustomEvent: dom.window.CustomEvent,
  MutationObserver: dom.window.MutationObserver,
  getComputedStyle: dom.window.getComputedStyle,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
Object.assign(dom.window, {
  requestAnimationFrame: (callback: FrameRequestCallback) => dom.window.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => dom.window.clearTimeout(id),
});
Object.assign(globalThis, {
  requestAnimationFrame: (callback: FrameRequestCallback) => dom.window.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => dom.window.clearTimeout(id),
});
class TestResizeObserver {
  observe() {}
  disconnect() {}
}
Object.assign(globalThis, { ResizeObserver: TestResizeObserver });
Object.assign(dom.window, { ResizeObserver: TestResizeObserver });

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

test("Alert supports custom icon, description, action and slot class names", async () => {
  const rendered = await mount(
    React.createElement(Alert, {
      status: "error",
      title: "保存失败",
      description: "请检查网络连接",
      icon: React.createElement("span", { className: "custom-icon" }, "!"),
      action: React.createElement(Button, { type: "error", size: "small" }, "重试"),
      classNames: { root: "alert-root", description: "alert-description", action: "alert-action" },
    }),
  );
  try {
    assert.ok(rendered.host.querySelector(".biu-ui-alert.alert-root"));
    assert.equal(rendered.host.querySelector(".custom-icon")?.textContent, "!");
    assert.ok(rendered.host.querySelector(".alert-description"));
    assert.ok(rendered.host.querySelector(".alert-action"));
  } finally {
    await unmount(rendered);
  }
});

test("Alert keeps the close button on the right and Divider renders a real separator", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(Alert, {
        status: "error",
        title: "多行错误",
        description: React.createElement(React.Fragment, null, "第一行", React.createElement("br"), "第二行"),
        closable: true,
      }),
      React.createElement(Divider, { dashed: true }, "分组标题"),
    ),
  );
  try {
    assert.ok(rendered.host.querySelector(".biu-ui-alert__icon svg"));
    assert.ok(rendered.host.querySelector(".biu-ui-alert__close"));
    assert.equal(rendered.host.querySelector('[role="separator"]')?.textContent, "分组标题");
    assert.ok(rendered.host.querySelector(".biu-ui-divider--dashed"));
  } finally {
    await unmount(rendered);
  }
});

test("Message keeps multiline content between its icon and right-side close button", async () => {
  const id = message.show("第一行\n第二行", { type: "warning", duration: 0 });
  try {
    const host = document.querySelector<HTMLElement>("[data-biu-message-host]");
    const item = host?.querySelector<HTMLElement>(".biu-message");
    assert.ok(item);
    assert.ok(item.querySelector(".biu-message__icon"));
    assert.equal(item.querySelector(".biu-message__content")?.textContent, "第一行\n第二行");
    assert.ok(item.querySelector(".biu-message__close"));
    assert.equal(item.children[0]?.classList.contains("biu-message__icon"), true);
    assert.equal(item.children[1]?.classList.contains("biu-message__content"), true);
    assert.equal(item.children[2]?.classList.contains("biu-message__close"), true);
  } finally {
    message.close(id);
    document.body.replaceChildren();
  }
});

test("Message complex mode exposes its semantic surface contract", () => {
  const id = message.show("复杂错误\n请重试", { type: "error", complex: true, duration: 0 });
  try {
    const item =
      document.querySelector<HTMLElement>(`[data-biu-message-host] #${id}`) ??
      document.querySelector<HTMLElement>("[data-biu-message-host] .biu-message");
    assert.ok(item);
    assert.equal(item.classList.contains("biu-message--complex"), true);
    assert.equal(item.classList.contains("biu-message-error"), true);
    assert.equal(item.querySelector(".biu-message__content")?.textContent, "复杂错误\n请重试");
  } finally {
    message.close(id);
    document.body.replaceChildren();
  }
});

test("Message action has an independent refresh button before the fixed close affordance", () => {
  let clicked = false;
  const id = message.info("检测到新版本\n请确认后刷新", {
    duration: 0,
    action: { label: "刷新页面", icon: "refresh", onClick: () => (clicked = true) },
  });
  try {
    const item = document.querySelector<HTMLElement>(`[data-biu-message-host] #${id}`);
    assert.ok(item);
    const action = item.querySelector<HTMLButtonElement>(".biu-message__action");
    const close = item.querySelector<HTMLButtonElement>(".biu-message__close");
    assert.ok(action);
    assert.ok(close);
    assert.equal(action.getAttribute("aria-label"), "刷新页面");
    assert.equal(item.children[2]?.classList.contains("biu-message__action"), true);
    assert.equal(item.children[3]?.classList.contains("biu-message__close"), true);
    action.click();
    assert.equal(clicked, true);
  } finally {
    message.close(id);
    document.body.replaceChildren();
  }
});

test("ButtonGroup and form groups expose root/item contracts and vertical custom rendering", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(
        ButtonGroup,
        { classNames: { root: "group-root", item: "group-item" } },
        React.createElement(Button, null, "一个"),
        React.createElement(Button, null, "两个"),
      ),
      React.createElement(CheckboxGroup, {
        options: [{ label: "平台", value: "platform" }],
        direction: "vertical",
        optionRender: (option) => React.createElement("b", { className: "checkbox-render" }, option.label),
      }),
      React.createElement(RadioGroup, {
        options: [{ label: "组件", value: "components" }],
        direction: "vertical",
        optionRender: (option) => React.createElement("b", { className: "radio-render" }, option.label),
      }),
    ),
  );
  try {
    assert.ok(rendered.host.querySelector(".biu-ui-button-group.group-root"));
    assert.equal(rendered.host.querySelectorAll(".biu-ui-button.group-item").length, 2);
    assert.ok(rendered.host.querySelector(".biu-ui-checkbox-group--vertical .checkbox-render"));
    assert.ok(rendered.host.querySelector(".biu-ui-radio-group--vertical .radio-render"));
  } finally {
    await unmount(rendered);
  }
});

test("Button keeps focus after activation so every semantic type shows the shared focus feedback", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      ...(["primary", "warning", "error", "success", "secondary", "dark", "default"] as const).map((type) =>
        React.createElement(Button, { key: type, type }, type),
      ),
    ),
  );
  try {
    for (const button of rendered.host.querySelectorAll<HTMLButtonElement>(".biu-ui-button")) {
      await act(async () => button.click());
      assert.equal(document.activeElement, button);
      assert.equal(button.classList.contains("biu-ui-button--pressed"), true);
    }
  } finally {
    await unmount(rendered);
  }
});

test("Button onlyIcon owns square geometry and moves its label into Tooltip", async () => {
  const rendered = await mount(
    React.createElement(Button, {
      onlyIcon: true,
      icon: React.createElement("span", null, "S"),
      tooltip: "列设置",
      "aria-label": "列设置",
    }),
  );
  try {
    const button = rendered.host.querySelector<HTMLButtonElement>("button.biu-ui-button");
    assert.ok(button);
    assert.equal(button?.classList.contains("biu-ui-button--only-icon"), true);
    assert.equal(button?.querySelector(".biu-ui-button__content"), null);
    assert.equal(button?.querySelector(".biu-ui-button__icon") !== null, true);
    assert.equal(rendered.host.querySelector(".biu-ui-tooltip") !== null, true);
  } finally {
    await unmount(rendered);
  }
});

test("DropdownMenu can wrap the generated menu with header and footer content", async () => {
  const rendered = await mount(
    React.createElement(DropdownMenu, {
      open: true,
      trigger: React.createElement(Button, null, "打开"),
      dropdownHeader: React.createElement("strong", null, "快捷操作"),
      dropdownFooter: React.createElement("small", null, "更多设置"),
      dropdownRender: (menu: React.ReactNode) => React.createElement("section", { className: "custom-menu" }, menu),
      items: [{ key: "one", label: "第一项" }],
    }),
  );
  try {
    assert.equal(document.querySelector(".biu-ui-dropdown__header")?.textContent, "快捷操作");
    assert.equal(document.querySelector(".biu-ui-dropdown__footer")?.textContent, "更多设置");
    assert.ok(document.querySelector(".custom-menu"));
    assert.equal(document.querySelector('[role="menuitem"]')?.textContent, "第一项");
  } finally {
    await unmount(rendered);
  }
});
