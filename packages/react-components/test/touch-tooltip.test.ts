import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Detail } from "../src/ui/detail/index.js";
import { Menu } from "../src/ui/navigation/menu.js";
import { Ellipsis, Tooltip } from "../src/ui/index.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
const browserWindow = dom.window;
Object.assign(globalThis, {
  window: browserWindow,
  document: browserWindow.document,
  HTMLElement: browserWindow.HTMLElement,
  Element: browserWindow.Element,
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

// JSDOM has no physical touch device, so expose pointer metadata on synthetic events.
function dispatchTouchPointer(
  target: Element,
  type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
  clientX = 0,
  clientY = 0,
) {
  const event = new browserWindow.Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerType: { configurable: true, value: "touch" },
    pointerId: { configurable: true, value: 1 },
    isPrimary: { configurable: true, value: true },
    clientX: { configurable: true, value: clientX },
    clientY: { configurable: true, value: clientY },
  });
  target.dispatchEvent(event);
}

function setOverflow(target: HTMLElement) {
  Object.defineProperties(target, {
    scrollWidth: { configurable: true, value: 160 },
    clientWidth: { configurable: true, value: 40 },
    scrollHeight: { configurable: true, value: 20 },
    clientHeight: { configurable: true, value: 20 },
  });
}

function setFits(target: HTMLElement) {
  Object.defineProperties(target, {
    scrollWidth: { configurable: true, value: 40 },
    clientWidth: { configurable: true, value: 40 },
    scrollHeight: { configurable: true, value: 20 },
    clientHeight: { configurable: true, value: 20 },
  });
}

test("Tooltip uses a cancellable touch long press without changing short-tap actions", async () => {
  let clicks = 0;
  const rendered = await mount(
    React.createElement(
      Tooltip,
      { content: "触屏帮助" },
      React.createElement("button", { type: "button", onClick: () => clicks++ }, "执行操作"),
    ),
  );
  try {
    const button = rendered.host.querySelector<HTMLButtonElement>("button");
    assert.ok(button);

    await act(async () => {
      dispatchTouchPointer(button, "pointerdown");
      dispatchTouchPointer(button, "pointerup");
      button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    });
    assert.equal(clicks, 1);
    assert.equal(document.querySelector('[data-biu-slot="tooltip-content"]'), null);

    await act(async () => {
      dispatchTouchPointer(button, "pointerdown");
      await new Promise((resolve) => window.setTimeout(resolve, 720));
    });
    assert.equal(document.querySelector('[data-biu-slot="tooltip-content"]')?.textContent, "触屏帮助");

    await act(async () => {
      dispatchTouchPointer(button, "pointerup");
      button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    });
    assert.equal(clicks, 1);
  } finally {
    await unmount(rendered);
  }
});

test("Tooltip can disable touch long press without swallowing the wrapped short-tap action", async () => {
  let clicks = 0;
  const rendered = await mount(
    React.createElement(
      Tooltip,
      { content: "触屏长按已关闭", touchActivation: false },
      React.createElement("button", { type: "button", onClick: () => clicks++ }, "仍可短按"),
    ),
  );
  try {
    const button = rendered.host.querySelector<HTMLButtonElement>("button");
    assert.ok(button);
    await act(async () => {
      dispatchTouchPointer(button, "pointerdown");
      await new Promise((resolve) => window.setTimeout(resolve, 720));
      dispatchTouchPointer(button, "pointerup");
      button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    });
    assert.equal(document.querySelector('[data-biu-slot="tooltip-content"]'), null);
    assert.equal(clicks, 1);
  } finally {
    await unmount(rendered);
  }
});

test("Tooltip cancels touch help when a press turns into a scroll gesture", async () => {
  const rendered = await mount(
    React.createElement(
      Tooltip,
      { content: "不应覆盖滚动", disabled: false },
      React.createElement("span", null, "长内容"),
    ),
  );
  try {
    const trigger = rendered.host.querySelector<HTMLElement>(".biu-ui-tooltip");
    assert.ok(trigger);
    await act(async () => {
      dispatchTouchPointer(trigger, "pointerdown", 0, 0);
      dispatchTouchPointer(trigger, "pointermove", 20, 0);
      await new Promise((resolve) => window.setTimeout(resolve, 720));
    });
    assert.equal(document.querySelector('[data-biu-slot="tooltip-content"]'), null);
  } finally {
    await unmount(rendered);
  }
});

test("Ellipsis measures real overflow before opening its touch Tooltip", async () => {
  const rendered = await mount(
    React.createElement(Ellipsis, { content: "一段真实溢出的完整长文本", style: { width: "40px" } }),
  );
  try {
    const ellipsis = rendered.host.querySelector<HTMLElement>(".biu-ui-ellipsis");
    assert.ok(ellipsis);
    Object.defineProperties(ellipsis, {
      scrollWidth: { configurable: true, value: 160 },
      clientWidth: { configurable: true, value: 40 },
      scrollHeight: { configurable: true, value: 20 },
      clientHeight: { configurable: true, value: 20 },
    });
    await act(async () => {
      dispatchTouchPointer(ellipsis, "pointerdown");
      await new Promise((resolve) => window.setTimeout(resolve, 720));
    });
    assert.equal(document.querySelector(".biu-ui-ellipsis")?.getAttribute("data-biu-ellipsis-active"), "true");
    assert.equal(document.querySelector('[data-biu-slot="tooltip-content"]')?.textContent, "一段真实溢出的完整长文本");
  } finally {
    await unmount(rendered);
  }
});

test("Detail Ellipsis opens on touch when an ancestor clips an otherwise fitting value", async () => {
  const fullValue = "一段在详情区域中被截断的完整说明文本";
  const rendered = await mount(
    React.createElement(Detail, {
      data: { description: fullValue },
      sections: [{ title: "详情", items: [{ key: "description", title: "说明", ellipsis: true }] }],
    }),
  );
  try {
    const ellipsis = rendered.host.querySelector<HTMLElement>(".biu-ui-detail__ellipsis");
    assert.ok(ellipsis);
    const value = ellipsis.closest<HTMLElement>(".biu-ui-detail__value");
    assert.ok(value);
    value.style.overflow = "hidden";
    setFits(ellipsis);
    setOverflow(value);
    await act(async () => {
      dispatchTouchPointer(ellipsis, "pointerdown");
      await new Promise((resolve) => window.setTimeout(resolve, 720));
    });
    assert.equal(
      rendered.host.querySelector<HTMLElement>(".biu-ui-detail__ellipsis")?.dataset.biuEllipsisActive,
      "true",
    );
    assert.equal(document.querySelector('[data-biu-slot="tooltip-content"]')?.textContent, fullValue);
    await act(async () => dispatchTouchPointer(ellipsis, "pointerup"));
  } finally {
    await unmount(rendered);
  }
});

test("Ellipsis supports a short touch reveal without stealing menu item taps", async () => {
  const fullValue = "仅查看时完整显示的长文本";
  const detail = await mount(
    React.createElement(Detail, {
      data: { description: fullValue },
      sections: [{ title: "详情", items: [{ key: "description", title: "说明", ellipsis: true }] }],
    }),
  );
  try {
    const ellipsis = detail.host.querySelector<HTMLElement>(".biu-ui-detail__ellipsis");
    assert.ok(ellipsis);
    setOverflow(ellipsis);
    await act(async () => {
      dispatchTouchPointer(ellipsis, "pointerdown");
      dispatchTouchPointer(ellipsis, "pointerup");
      ellipsis.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    });
    assert.equal(document.querySelector('[data-biu-slot="tooltip-content"]')?.textContent, fullValue);
  } finally {
    await unmount(detail);
  }

  let selectedKey = "";
  const menu = await mount(
    React.createElement(Menu, {
      items: [{ key: "read-only", label: fullValue }],
      onSelect: (key) => {
        selectedKey = key;
      },
    }),
  );
  try {
    const ellipsis = menu.host.querySelector<HTMLElement>(".biu-ui-menu__label");
    assert.ok(ellipsis);
    setOverflow(ellipsis);
    await act(async () => {
      dispatchTouchPointer(ellipsis, "pointerdown");
      dispatchTouchPointer(ellipsis, "pointerup");
      ellipsis.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    });
    assert.equal(selectedKey, "read-only");
    assert.equal(document.querySelector('[data-biu-slot="tooltip-content"]'), null);

    const menuStyles = readFileSync(new URL("../src/ui/menu/styles.css", import.meta.url), "utf8");
    assert.match(menuStyles, /\.biu-ui-menu__item:not\(:disabled\) \.biu-ui-menu__label\s*\{[^}]*cursor:\s*pointer/s);
    assert.match(menuStyles, /\.biu-ui-menu__item:disabled \.biu-ui-menu__label\s*\{[^}]*cursor:\s*not-allowed/s);
  } finally {
    await unmount(menu);
  }
});
