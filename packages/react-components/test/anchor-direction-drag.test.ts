import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Anchor } from "../src/ui/index.js";

test("Anchor direction styles are scoped to the Anchor direction contract", () => {
  const styles = readFileSync(new URL("../src/ui/anchor/styles.css", import.meta.url), "utf8");
  assert.match(styles, /\.biu-ui-anchor\[dir="rtl"\] \.biu-ui-anchor__toggle/);
  assert.match(styles, /\.biu-ui-anchor\[dir="rtl"\] \.biu-ui-anchor__list/);
  assert.match(styles, /\.biu-ui-anchor\[dir="rtl"\] \.biu-ui-anchor__node-toggle/);
  assert.doesNotMatch(styles, /:dir\(rtl\) \.biu-ui-anchor__/);
});

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
const browserWindow = dom.window;
Object.assign(globalThis, {
  window: browserWindow,
  document: browserWindow.document,
  HTMLElement: browserWindow.HTMLElement,
  Element: browserWindow.Element,
  HTMLButtonElement: browserWindow.HTMLButtonElement,
  Node: browserWindow.Node,
  NodeFilter: browserWindow.NodeFilter,
  Event: browserWindow.Event,
  MouseEvent: browserWindow.MouseEvent,
  MutationObserver: browserWindow.MutationObserver,
  getComputedStyle: browserWindow.getComputedStyle,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: browserWindow.navigator });
Object.assign(browserWindow, {
  requestAnimationFrame: (callback: FrameRequestCallback) => browserWindow.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => browserWindow.clearTimeout(id),
});
Object.assign(globalThis, {
  requestAnimationFrame: (callback: FrameRequestCallback) => browserWindow.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => browserWindow.clearTimeout(id),
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

function pointerEvent(type: string, clientX: number, clientY: number) {
  const event = new MouseEvent(type, { bubbles: true, button: 0, clientX, clientY });
  Object.defineProperties(event, {
    pointerId: { value: 1 },
    isPrimary: { value: true },
  });
  return event;
}

test("a dragged logical Anchor returns to the matching viewport edge when direction changes", async () => {
  const originalRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({
      left: 100,
      top: 100,
      right: 340,
      bottom: 220,
      width: 240,
      height: 120,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    }) as DOMRect;

  const renderAnchor = (dir: "ltr" | "rtl") =>
    React.createElement(
      React.Fragment,
      null,
      React.createElement("h2", { id: "anchor-direction-heading" }, "方向切换标题"),
      React.createElement(Anchor, {
        id: "anchor-direction-drag-regression",
        dir,
        mode: "fixed",
        position: "end",
        draggable: true,
        title: "组件目录",
      }),
    );
  const rendered = await mount(renderAnchor("ltr"));

  try {
    const anchor = document.body.querySelector<HTMLElement>(".biu-ui-anchor");
    const handle = anchor?.querySelector<HTMLElement>(".biu-ui-anchor__drag-handle");
    assert.ok(anchor && handle);

    await act(async () => {
      handle.dispatchEvent(pointerEvent("pointerdown", 120, 120));
    });
    await act(async () => {
      handle.dispatchEvent(pointerEvent("pointermove", 170, 130));
    });
    assert.equal(anchor.style.left, "150px");

    await act(async () => {
      rendered.root.render(renderAnchor("rtl"));
    });

    const rtlAnchor = document.body.querySelector<HTMLElement>(".biu-ui-anchor");
    assert.ok(rtlAnchor?.classList.contains("biu-ui-anchor--left"));
    assert.equal(rtlAnchor?.style.left, "");
  } finally {
    await unmount(rendered);
    HTMLElement.prototype.getBoundingClientRect = originalRect;
  }
});
