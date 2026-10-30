import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement, useMemo } from "react";
import { createRoot, type Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { createI18n, i18n } from "@biugle/biu-i18n";
import { useBiuAuthStore, useBiuMenuStore, useBiuPreferenceStore } from "@biugle/biu-store";
import { BiuShell, useBiuContext, useBiuI18n, type BiuRuntimeConfig } from "../src/index.js";

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

async function mountDeferredLocalePage(memoized: boolean, withMenu = false) {
  const dom = new JSDOM("<!doctype html><html><body><div id='locale-test'></div></body></html>", {
    url: `https://locale.example/${withMenu ? "Review" : ""}`,
  });
  const globals = { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true };
  const previousGlobals = new Map(
    [...Object.keys(globals), "fetch"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  Object.assign(globalThis, globals);
  const previousPreferences = useBiuPreferenceStore.getState();
  const previousAuth = useBiuAuthStore.getState();
  const previousMenus = useBiuMenuStore.getState();
  const previousEnglish = i18n.getResource("en-US")!;
  const previousLocale = i18n.getLocale();
  const base = createI18n("zh-CN");
  i18n.addLocale(base.getResource("en-US")!);
  useBiuPreferenceStore.getState().initialize({ locale: "en-US", theme: "light" }, "LocaleTest:local");
  const pendingResponses: Array<(response: Response) => void> = [];
  let requests = 0;
  globalThis.fetch = (async () => {
    requests += 1;
    return new Promise<Response>((resolve) => pendingResponses.push(resolve));
  }) as typeof fetch;
  let reloadLocale = () => {};
  function Page() {
    const { $t } = useBiuI18n();
    reloadLocale = useBiuContext().reloadLocale;
    const memo = useMemo(() => [$t("业务说明"), $t("刷新页面"), $t("搜索菜单")].join("|"), [$t]);
    const text = memoized ? memo : [$t("业务说明"), $t("刷新页面"), $t("搜索菜单")].join("|");
    return createElement("output", null, text);
  }
  const config: BiuRuntimeConfig = {
    appId: "LocaleTest",
    projectType: "PORTAL",
    locale: "en-US",
    localeUrl: "/business-locale.json",
    auth: { enabled: false },
    updateCheck: { enabled: false },
    routes: [],
    fallbackMenus: withMenu
      ? [{ code: "Review", type: "MENU", target: "PORTAL", path: "/Review", titleKey: "业务菜单" }]
      : [],
    pageRegistry: {},
    layoutComponent: () => createElement(Page),
  };
  const root = createRoot(dom.window.document.getElementById("locale-test")!);
  await act(async () => root.render(createElement(BiuShell, { config })));
  return {
    get requests() {
      return requests;
    },
    text: () => dom.window.document.querySelector("output")?.textContent,
    title: () => dom.window.document.title,
    reload: async () => act(async () => reloadLocale()),
    respond: async (translation: Record<string, string>) => {
      const resolve = pendingResponses.shift();
      assert.ok(resolve, "a locale request must be pending");
      await act(async () => {
        resolve(new Response(JSON.stringify({ key: "en-US", desc: "English", translation }), { status: 200 }));
      });
    },
    close: async () => {
      await act(async () => root.unmount());
      useBiuPreferenceStore.setState(previousPreferences, true);
      useBiuAuthStore.setState(previousAuth, true);
      useBiuMenuStore.setState(previousMenus, true);
      i18n.addLocale(previousEnglish).setLocale(previousLocale);
      dom.window.close();
      for (const [name, descriptor] of previousGlobals) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else Reflect.deleteProperty(globalThis, name);
      }
    },
  };
}

test("partial business locale resources preserve built-in English and reset removed overrides", async () => {
  const page = await mountDeferredLocalePage(false);
  try {
    await page.respond({ 业务说明: "Business description", 搜索菜单: "Business search" });
    assert.equal(page.text(), "Business description|Refresh page|Business search");
    assert.equal(i18n.$t("首页", undefined, "en-US"), "Home");
    await page.reload();
    await page.respond({ 业务说明: "Updated description" });
    assert.equal(page.text(), "Updated description|Refresh page|Search menu");
    await page.reload();
    await page.respond({});
    assert.equal(page.text(), "业务说明|Refresh page|Search menu");
    assert.equal(i18n.has("业务说明", "en-US"), false);
    assert.equal(page.requests, 3);
  } finally {
    await page.close();
  }
});

test("memoized translations refresh after asynchronous locale loading and same-language reload", async () => {
  const page = await mountDeferredLocalePage(true);
  try {
    assert.equal(page.text(), "业务说明|Refresh page|Search menu");
    await page.respond({ 业务说明: "Loaded after mount" });
    assert.equal(page.text(), "Loaded after mount|Refresh page|Search menu");
    assert.equal(page.requests, 1);
    await page.reload();
    await page.respond({ 业务说明: "Reloaded in the same language" });
    assert.equal(page.text(), "Reloaded in the same language|Refresh page|Search menu");
    assert.equal(page.requests, 2);
  } finally {
    await page.close();
  }
});

test("document title refreshes after delayed menu resources and same-language reload", async () => {
  const page = await mountDeferredLocalePage(false, true);
  try {
    assert.equal(page.title(), "LocaleTest - 业务菜单");
    await page.respond({ 业务菜单: "Business menu" });
    assert.equal(page.title(), "LocaleTest - Business menu");
    assert.equal(page.requests, 1);
    await page.reload();
    await page.respond({ 业务菜单: "Updated business menu" });
    assert.equal(page.title(), "LocaleTest - Updated business menu");
    assert.equal(page.requests, 2);
  } finally {
    await page.close();
  }
});
