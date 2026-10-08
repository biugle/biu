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
