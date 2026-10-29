import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  Box,
  ColorPicker,
  ContextMenu,
  Image,
  List,
  Notification,
  notification,
  ResizeBox,
  Space,
  Spin,
  Timeline,
  Typography,
} from "../src/ui/index.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>");
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  HTMLImageElement: dom.window.HTMLImageElement,
  PointerEvent: dom.window.PointerEvent ?? dom.window.MouseEvent,
  IS_REACT_ACT_ENVIRONMENT: true,
});

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

test("utility components expose semantic structure and compact layout contracts", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(Typography, { strong: true }, "文本"),
      React.createElement(Typography, { color: "primary" }, "Primary"),
      React.createElement(
        Space,
        { size: "middle" },
        React.createElement("span", null, "一"),
        React.createElement("span", null, "二"),
      ),
      React.createElement(Timeline, { items: [{ title: "节点", content: "内容" }] }),
      React.createElement(Timeline, { direction: "horizontal", items: [{ title: "横向节点" }] }),
      React.createElement(Spin, { tip: "加载中" }),
      React.createElement(Notification, { title: "通知", description: "多行通知内容", duration: 0 }),
      React.createElement(Image, { src: "/demo.png", alt: "示例" }),
      React.createElement(ResizeBox, { width: 200, height: 100 }, "容器"),
      React.createElement(Box, { css: { color: "red" }, sx: [{ padding: 4 }, { color: "blue" }] }, "样式"),
      React.createElement(List, { dataSource: ["一", "二"] }),
      React.createElement(ColorPicker, { defaultValue: "#ff0000", presets: ["#00ff00"] }),
      React.createElement(ContextMenu, { items: [{ key: "copy", label: "复制" }] }, "右键区域"),
    ),
  );
  try {
    assert.equal(rendered.host.querySelectorAll(".biu-ui-typography").length, 2);
    assert.equal(rendered.host.querySelector(".biu-ui-typography--primary")?.textContent, "Primary");
    assert.equal(rendered.host.querySelectorAll(".biu-ui-space__item").length, 2);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-timeline__item").length, 2);
    assert.equal(
      rendered.host.querySelector(".biu-ui-timeline--horizontal"),
      rendered.host.querySelectorAll(".biu-ui-timeline")[1],
    );
    assert.equal(rendered.host.querySelector(".biu-ui-spin")?.getAttribute("role"), "status");
    assert.equal(
      rendered.host
        .querySelector(".biu-ui-notification__icon")
        ?.parentElement?.classList.contains("biu-ui-notification"),
      true,
    );
    assert.equal(rendered.host.querySelector(".biu-ui-image img")?.getAttribute("alt"), "示例");
    assert.equal(
      rendered.host.querySelector(".biu-ui-resize-box")?.getAttribute("style")?.includes("width: 200px"),
      true,
    );
    const boxStyle = rendered.host.querySelector(".biu-ui-box")?.getAttribute("style") ?? "";
    assert.equal(boxStyle.includes("color: blue"), true);
    assert.equal(boxStyle.includes("padding: 4px"), true);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-list__item").length, 2);
    assert.equal(
      rendered.host.querySelector(".biu-ui-color-picker__swatch")?.getAttribute("style")?.includes("255, 0, 0"),
      true,
    );
    assert.equal(rendered.host.querySelector(".biu-ui-context-menu__target")?.textContent, "右键区域");
  } finally {
    await unmount(rendered);
  }
});

test("Notification keeps explicit RTL on both the floating host and card", async () => {
  let closeNotification: (() => void) | undefined;
  await act(async () => {
    closeNotification = notification.open({
      dir: "rtl",
      title: "RTL 通知",
      description: "方向由调用方指定。",
      duration: 0,
    }).close;
  });
  try {
    const host = document.querySelector<HTMLElement>('[data-biu-notification-host="rtl"]');
    assert.equal(host?.getAttribute("dir"), "rtl");
    assert.equal(host?.style.insetInlineEnd, "16px");
    assert.equal(host?.querySelector<HTMLElement>(".biu-ui-notification")?.getAttribute("dir"), "rtl");
  } finally {
    await act(async () => closeNotification?.());
    document.body.replaceChildren();
  }
});

test("ContextMenu portals into body and keeps viewport pointer coordinates", async () => {
  const rendered = await mount(
    React.createElement(ContextMenu, { items: [{ key: "copy", label: "复制" }] }, "右键区域"),
  );
  try {
    const target = rendered.host.querySelector<HTMLElement>(".biu-ui-context-menu__target");
    assert.ok(target);
    await act(async () => {
      target.dispatchEvent(
        new dom.window.MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: 320,
          clientY: 240,
        }),
      );
    });
    const menu = document.querySelector<HTMLElement>(".biu-ui-context-menu");
    assert.ok(menu);
    assert.equal(menu.parentElement, document.body);
    assert.equal(menu.style.left, "320px");
    assert.equal(menu.style.top, "240px");
  } finally {
    await unmount(rendered);
  }
});

test("ResizeBox ends its pointer session on pointercancel", async () => {
  const rendered = await mount(React.createElement(ResizeBox, { width: 200, height: 100 }, "容器"));
  const handle = rendered.host.querySelector<HTMLElement>(".biu-ui-resize-box__handle");
  assert.ok(handle);
  const pointerEvent = (type: string, clientX: number, clientY: number) => {
    const event = new dom.window.MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY });
    Object.defineProperty(event, "pointerId", { value: 7 });
    Object.defineProperty(event, "isPrimary", { value: true });
    return event;
  };
  try {
    await act(async () => handle.dispatchEvent(pointerEvent("pointerdown", 10, 10)));
    await act(async () => window.dispatchEvent(pointerEvent("pointermove", 40, 20)));
    assert.equal(rendered.host.querySelector<HTMLElement>(".biu-ui-resize-box")?.style.width, "230px");
    await act(async () => window.dispatchEvent(pointerEvent("pointercancel", 40, 20)));
    await act(async () => window.dispatchEvent(pointerEvent("pointermove", 90, 40)));
    assert.equal(rendered.host.querySelector<HTMLElement>(".biu-ui-resize-box")?.style.width, "230px");
  } finally {
    await unmount(rendered);
  }
});
