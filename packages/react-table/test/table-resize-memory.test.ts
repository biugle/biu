import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { Table } from "../src/index.js";

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
  DocumentFragment: dom.window.DocumentFragment,
  Event: dom.window.Event,
  KeyboardEvent: dom.window.KeyboardEvent,
  MouseEvent: dom.window.MouseEvent,
  PointerEvent: dom.window.PointerEvent ?? dom.window.MouseEvent,
  Node: dom.window.Node,
  CustomEvent: dom.window.CustomEvent,
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

type Row = { id: number; name: string; status: string };

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

test("column previews touch only cells in resized and fill-compensation columns", async () => {
  const rendered = await mount(
    React.createElement(Table<Row>, {
      columns: [
        { key: "name", title: "名称", dataIndex: "name", width: 120, resizable: true },
        { key: "status", title: "状态", dataIndex: "status", width: 120, resizable: true },
        { key: "meta", title: "辅助信息", width: 120, render: () => "保持不变" },
      ],
      dataSource: Array.from({ length: 40 }, (_, index) => ({
        id: index + 1,
        name: `记录 ${index + 1}`,
        status: "ready",
      })),
      rowKey: "id",
      defaultColumnWidths: { name: 120, status: 120, meta: 120 },
      elasticColumn: false,
      fillRemainingSpace: false,
      scroll: { x: "max-content" },
    }),
  );
  try {
    const nameCells = [...rendered.host.querySelectorAll<HTMLTableCellElement>('tbody td[data-biu-column-key="name"]')];
    const statusCells = [
      ...rendered.host.querySelectorAll<HTMLTableCellElement>('tbody td[data-biu-column-key="status"]'),
    ];
    const metaCells = [...rendered.host.querySelectorAll<HTMLTableCellElement>('tbody td[data-biu-column-key="meta"]')];
    const handle = rendered.host
      .querySelector<HTMLTableCellElement>('thead th[data-biu-column-key="name"]')
      ?.querySelector<HTMLElement>(".biu-table__resize-handle");
    assert.equal(nameCells.length, 40);
    assert.equal(statusCells.length, 40);
    assert.equal(metaCells.length, 40);
    assert.ok(handle);

    await act(async () =>
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 100, pointerId: 509 })),
    );
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 120, pointerId: 509 })),
    );
    assert.ok(nameCells.every((cell) => cell.style.width === "140px"));
    assert.ok(statusCells.every((cell) => cell.style.width === "120px"));
    assert.ok(metaCells.every((cell) => cell.style.width === "120px"));

    await act(async () => window.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: 509 })));
    assert.ok(nameCells.every((cell) => cell.style.width === "120px"));
    assert.ok(statusCells.every((cell) => cell.style.width === "120px"));
    assert.ok(metaCells.every((cell) => cell.style.width === "120px"));
  } finally {
    await unmount(rendered);
  }
});
