import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Breadcrumb } from "../src/ui/index.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  Node: dom.window.Node,
  Event: dom.window.Event,
  CustomEvent: dom.window.CustomEvent,
  MouseEvent: dom.window.MouseEvent,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });

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

test("Breadcrumb blocks executable URL schemes but preserves safe links and actions", async () => {
  let activated = false;
  const rendered = await mount(
    React.createElement(Breadcrumb, {
      items: [
        { key: "unsafe", label: "不安全链接", href: "javascript:alert(1)" },
        { key: "safe", label: "安全链接", href: "/safe-path" },
        {
          key: "action",
          label: "回调操作",
          href: "data:text/html,<script>throw 1</script>",
          onClick: () => (activated = true),
        },
      ],
    }),
  );
  try {
    const breadcrumb = rendered.host.querySelector(".biu-ui-breadcrumb");
    assert.ok(breadcrumb);
    assert.equal(breadcrumb.querySelector('a[href^="javascript:"]'), null);
    assert.equal(breadcrumb.querySelector('a[href^="data:"]'), null);
    assert.equal(breadcrumb.querySelector('a[href="/safe-path"]')?.textContent, "安全链接");
    const fallbackAction = [...breadcrumb.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent === "回调操作",
    );
    assert.ok(fallbackAction);
    await act(async () => fallbackAction.click());
    assert.equal(activated, true);
  } finally {
    await unmount(rendered);
  }
});
