import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { EditableTable } from "../src/index.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
Object.assign(globalThis, {
  document: dom.window.document,
  window: dom.window,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
  HTMLSelectElement: dom.window.HTMLSelectElement,
  HTMLIFrameElement: dom.window.HTMLIFrameElement,
  DocumentFragment: dom.window.DocumentFragment,
  NodeFilter: dom.window.NodeFilter,
  Event: dom.window.Event,
  FocusEvent: dom.window.FocusEvent,
  KeyboardEvent: dom.window.KeyboardEvent,
  MouseEvent: dom.window.MouseEvent,
  PointerEvent: dom.window.PointerEvent ?? dom.window.MouseEvent,
  Node: dom.window.Node,
  CustomEvent: dom.window.CustomEvent,
  MutationObserver: dom.window.MutationObserver,
  getComputedStyle: dom.window.getComputedStyle,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
class TestResizeObserver {
  observe() {}
  disconnect() {}
}
Object.assign(dom.window, {
  ResizeObserver: TestResizeObserver,
  requestAnimationFrame: (callback: FrameRequestCallback) => dom.window.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => dom.window.clearTimeout(id),
});
Object.assign(globalThis, {
  ResizeObserver: TestResizeObserver,
  requestAnimationFrame: (callback: FrameRequestCallback) => dom.window.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => dom.window.clearTimeout(id),
});
Object.assign(dom.window.HTMLElement.prototype, { attachEvent() {}, detachEvent() {} });

// JSDOM cannot produce a device gesture; these events let the real React handler see touch metadata.
function dispatchTouchPointer(target: Element, type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel") {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerType: { configurable: true, value: "touch" },
    pointerId: { configurable: true, value: 1 },
    isPrimary: { configurable: true, value: true },
    clientX: { configurable: true, value: 0 },
    clientY: { configurable: true, value: 0 },
  });
  target.dispatchEvent(event);
}

test("EditableTable supports touch and keyboard entry without hijacking nested actions", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let nestedActionCount = 0;
  await act(async () =>
    root.render(
      React.createElement(EditableTable<{ id: number; name: string }>, {
        columns: [
          {
            key: "name",
            title: "名称",
            dataIndex: "name",
            editable: { type: "text" },
            renderCell: () =>
              React.createElement(
                React.Fragment,
                null,
                "初始值 ",
                React.createElement("button", { type: "button", onClick: () => nestedActionCount++ }, "行内操作"),
              ),
          },
        ],
        rowKey: "id",
        dataSource: [{ id: 1, name: "初始值" }],
      }),
    ),
  );
  try {
    const cell = host.querySelector<HTMLElement>(".biu-editable-table__cell");
    const nestedButton = cell?.querySelector<HTMLButtonElement>("button");
    assert.ok(cell);
    assert.ok(nestedButton);

    await act(async () => {
      dispatchTouchPointer(nestedButton, "pointerdown");
      nestedButton.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    });
    assert.equal(nestedActionCount, 1);
    assert.equal(host.querySelector(".biu-editable-table__editor"), null);

    await act(async () => {
      dispatchTouchPointer(cell, "pointerdown");
      cell.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    });
    assert.ok(host.querySelector(".biu-editable-table__editor input"));
    const cancel = host.querySelector<HTMLButtonElement>('button[aria-label="取消编辑"]');
    assert.ok(cancel);
    await act(async () => cancel.click());

    await act(async () => {
      cell.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    assert.ok(host.querySelector(".biu-editable-table__editor input"));

    const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
    assert.match(styles, /\.biu-editable-table__cell:focus-visible\s*\{/);
    assert.doesNotMatch(
      styles,
      /@media \(hover: none\), \(pointer: coarse\)[\s\S]*?\.biu-table__resize-handle\s*\{[^}]*opacity:\s*0\.55;/s,
      "column resize icons keep their shared hover/focus visibility instead of being permanently shown on touch layouts",
    );
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});
