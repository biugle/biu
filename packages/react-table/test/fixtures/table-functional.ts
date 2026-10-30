import * as React from "react";
import { type Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { Table, type Column } from "../../src/index.js";

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

export type Row = { id: number; name: string; status: string };
export const columns: Column<Row>[] = [
  { key: "name", title: "名称", dataIndex: "name", sortable: true },
  {
    key: "status",
    title: "状态",
    dataIndex: "status",
    filters: [
      { label: "启用", value: "enabled" },
      { label: "停用", value: "disabled" },
    ],
  },
];

export function renderTable(onSelect: (keys: React.Key[]) => void) {
  const host = document.createElement("div");
  document.body.append(host);
  let root!: Root;
  const node = React.createElement(Table<Row>, {
    columns,
    rowKey: "id",
    dataSource: [
      { id: 1, name: "Beta", status: "enabled" },
      { id: 2, name: "Alpha", status: "disabled" },
      { id: 3, name: "Gamma", status: "enabled" },
    ],
    pagination: { current: 1, pageSize: 2, total: 3 },
    rowSelection: { selectedRowKeys: [1], onChange: (keys) => onSelect(keys) },
    expandable: { expandedRowRender: (record) => React.createElement("span", null, `详情：${record.name}`) },
  });
  return { host, root, node };
}
