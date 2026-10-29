import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../src/ui/index.js";

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

    await act(async () => panel.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    assert.deepEqual(changes, []);
    await act(async () => overlay.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    assert.deepEqual(changes.at(-1), [false, "overlay"]);
    await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    assert.deepEqual(changes.at(-1), [false, "escape"]);
  } finally {
    await unmount(rendered);
  }
  assert.equal(document.body.style.overflow, "");
});

test("Dialog is draggable from its header by default and stays clamped without offset drift", async () => {
  const renderDialog = (open: boolean) =>
    React.createElement(
      Dialog,
      { open },
      React.createElement(
        DialogContent,
        null,
        React.createElement(
          DialogHeader,
          null,
          React.createElement(DialogTitle, null, "可拖动标题"),
          React.createElement("button", { type: "button" }, "关闭"),
        ),
        React.createElement("p", null, "初始位置保持现状。"),
      ),
    );
  const rendered = await mount(renderDialog(true));
  try {
    const panel = document.querySelector<HTMLElement>(".biu-ui-dialog__panel");
    const header = panel?.querySelector<HTMLElement>(".biu-ui-dialog__header");
    const button = header?.querySelector<HTMLButtonElement>("button");
    assert.ok(panel && header && button);
    assert.equal(panel.dataset.biuDialogDraggable, "true");

    let renderedOffset = { x: 0, y: 0 };
    Object.defineProperty(panel, "getBoundingClientRect", {
      configurable: true,
      value: () => {
        const match = panel.style.transform.match(/translate\((-?[\d.]+)px, (-?[\d.]+)px\)/);
        if (match) renderedOffset = { x: Number(match[1]), y: Number(match[2]) };
        const left = 300 + renderedOffset.x;
        const top = 200 + renderedOffset.y;
        return {
          x: left,
          y: top,
          left,
          top,
          right: left + 400,
          bottom: top + 300,
          width: 400,
          height: 300,
          toJSON: () => ({}),
        } as DOMRect;
      },
    });

    await act(async () => {
      button.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 20, clientY: 20 }));
      header.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 800, clientY: 700 }));
    });
    assert.equal(panel.style.transform, "");

    await act(async () => {
      header.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100 }));
      header.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 5000, clientY: 5000 }));
    });
    const maxX = window.innerWidth - 400 - 8 - 300;
    const maxY = window.innerHeight - 300 - 8 - 200;
    assert.equal(panel.style.transform, `translate(${maxX}px, ${maxY}px)`);

    await act(async () => {
      header.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 5001, clientY: 5001 }));
    });
    assert.equal(panel.style.transform, `translate(${maxX}px, ${maxY}px)`);

    await act(async () => rendered.root.render(renderDialog(false)));
    await act(async () => rendered.root.render(renderDialog(true)));
    const reopenedPanel = document.querySelector<HTMLElement>(".biu-ui-dialog__panel");
    assert.equal(reopenedPanel?.style.transform, "");
  } finally {
    await unmount(rendered);
  }
});
