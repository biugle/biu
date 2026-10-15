import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { BiuShell, type BiuRuntimeConfig } from "../src/index.js";

test("默认语言资源加载后的重渲染不会重复请求同一语言", async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
  const globalNames = [
    "window",
    "document",
    "HTMLElement",
    "Event",
    "Node",
    "navigator",
    "IS_REACT_ACT_ENVIRONMENT",
    "fetch",
  ];
  const previousGlobals = new Map(globalNames.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  for (const [name, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Event: dom.window.Event,
    Node: dom.window.Node,
    navigator: dom.window.navigator,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    Object.defineProperty(globalThis, name, { configurable: true, value });
  }

  let localeRequests = 0;
  globalThis.fetch = (async (input) => {
    const url = new URL(String(input), dom.window.location.origin);
    if (url.pathname === "/demo-locale.json") localeRequests += 1;
    return new Response(JSON.stringify({ key: "zh-CN", desc: "简体中文", translation: { 首页: "首页" } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  const config: BiuRuntimeConfig = {
    appId: "locale-resource-stability-test",
    auth: { enabled: false },
    localeUrl: "/demo-locale.json",
    updateCheck: { enabled: false },
    routes: [],
    pageRegistry: {},
    homePage: () => createElement("div", null, "首页"),
    layoutComponent: ({ children }) => createElement("main", null, children),
  };
  const host = dom.window.document.createElement("div");
  dom.window.document.body.append(host);
  let root: Root | undefined;

  try {
    root = createRoot(host);
    await act(async () => {
      root?.render(createElement(BiuShell, { config }));
      await new Promise<void>((resolve) => setTimeout(resolve, 30));
    });
    await act(async () => new Promise<void>((resolve) => setTimeout(resolve, 30)));

    assert.equal(localeRequests, 1);
  } finally {
    if (root) await act(async () => root?.unmount());
    dom.window.close();
    for (const [name, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});
