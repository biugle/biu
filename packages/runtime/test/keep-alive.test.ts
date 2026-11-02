import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { i18n } from "@biugle/biu-i18n";
import { useBiuAuthStore, useBiuMenuStore, useBiuPreferenceStore } from "@biugle/biu-store";
import {
  BiuShell,
  useBiuContext,
  type BiuContextValue,
  type BiuRuntimeConfig,
  type LayoutContentProps,
} from "../src/index.js";

function mountKeepAliveShell(keepAlive: boolean, remote = false) {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "https://portal.example/PageA",
  });
  const globals = { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true };
  const descriptors = new Map(
    Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  Object.assign(globalThis, globals);
  const previousPreferences = useBiuPreferenceStore.getState();
  const previousAuth = useBiuAuthStore.getState();
  const previousMenus = useBiuMenuStore.getState();
  const previousLocale = i18n.getLocale();
  const mounts = { PageA: 0, PageB: 0 };
  const unmounts = { PageA: 0, PageB: 0 };
  const renders = { PageA: 0, PageB: 0 };
  const remoteLifecycle: string[] = [];
  let context!: BiuContextValue;
  let closeTab: (code: string) => void = () => undefined;
  let refreshTab: (code: string) => void = () => undefined;

  function PageA() {
    renders.PageA += 1;
    const [count, setCount] = useState(0);
    useEffect(() => {
      mounts.PageA += 1;
      return () => {
        unmounts.PageA += 1;
      };
    }, []);
    return createElement(
      "button",
      { "data-page": "PageA", onClick: () => setCount((value) => value + 1) },
      String(count),
    );
  }

  function PageB() {
    renders.PageB += 1;
    useEffect(() => {
      mounts.PageB += 1;
      return () => {
        unmounts.PageB += 1;
      };
    }, []);
    return createElement("output", { "data-page": "PageB" }, "Page B");
  }

  function Layout({ children, history, onCloseTab, onRefreshTab }: LayoutContentProps) {
    context = useBiuContext();
    closeTab = (code) => {
      const node = history.find((item) => item.code === code);
      if (node) onCloseTab?.(node);
    };
    refreshTab = (code) => {
      const node = history.find((item) => item.code === code);
      if (node) onRefreshTab?.(node);
    };
    return createElement("main", null, children);
  }

  const config: BiuRuntimeConfig = {
    appId: "KeepAliveTest",
    projectType: "PORTAL",
    routes: [
      {
        code: "PageA",
        type: "MENU",
        target: remote ? "APP" : "PORTAL",
        source: remote ? "APP" : "PORTAL",
        ...(remote ? { appId: "ChildTest" } : {}),
        ...(keepAlive ? { keepAlive: true } : {}),
      },
      { code: "PageB", type: "MENU", target: "PORTAL", source: "PORTAL" },
    ],
    pageRegistry: {
      ...(!remote ? { PageA: async () => ({ default: PageA }) } : {}),
      PageB: async () => ({ default: PageB }),
    },
    fallbackMenus: [
      {
        code: "PageA",
        type: "MENU",
        target: remote ? "APP" : "PORTAL",
        path: "/PageA",
        ...(remote ? { appId: "ChildTest" } : {}),
      },
      { code: "PageB", type: "MENU", target: "PORTAL", path: "/PageB" },
    ],
    ...(remote
      ? {
          remoteApps: {
            ChildTest: { APP_URL: "https://child.example.test", ALLOWED_ORIGINS: ["https://child.example.test"] },
          },
        }
      : {}),
    layout: { tabs: true },
    layoutComponent: Layout,
    auth: { enabled: false },
    updateCheck: { enabled: false },
    onRemoteAppLifecycle: (event) => remoteLifecycle.push(event.EVENT),
  };
  const root = createRoot(dom.window.document.getElementById("root")!);

  return {
    config,
    context: () => context,
    mounts,
    unmounts,
    renders,
    remoteLifecycle,
    dom,
    root,
    closeTab: (code: string) => closeTab(code),
    refreshTab: (code: string) => refreshTab(code),
    async mount() {
      await act(async () => {
        root.render(createElement(BiuShell, { config }));
      });
    },
    async navigate(path: string) {
      await act(async () => {
        assert.equal(context.navigate(path), true);
      });
    },
    async back() {
      await act(async () => {
        const popped = new Promise<void>((resolve) =>
          dom.window.addEventListener("popstate", () => resolve(), { once: true }),
        );
        dom.window.history.back();
        await popped;
      });
    },
    async rerender() {
      await act(async () => root.render(createElement(BiuShell, { config })));
    },
    async close() {
      await act(async () => root.unmount());
      useBiuPreferenceStore.setState(previousPreferences, true);
      useBiuAuthStore.setState(previousAuth, true);
      useBiuMenuStore.setState(previousMenus, true);
      i18n.setLocale(previousLocale);
      dom.window.close();
      for (const [key, descriptor] of descriptors) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}

test("route keepAlive defaults off and keeps an opted-in page instance mounted", async () => {
  const ordinary = mountKeepAliveShell(false);
  try {
    await ordinary.mount();
    const initial = ordinary.dom.window.document.querySelector<HTMLButtonElement>('[data-page="PageA"]');
    assert.ok(initial);
    await act(async () => initial.click());
    assert.equal(initial.textContent, "1");
    await ordinary.navigate("/PageB");
    assert.equal(ordinary.dom.window.document.querySelector('[data-page="PageA"]'), null);
    assert.equal(ordinary.unmounts.PageA, 1);
    await ordinary.navigate("/PageA");
    assert.equal(ordinary.dom.window.document.querySelector('[data-page="PageA"]')?.textContent, "0");
    assert.equal(ordinary.mounts.PageA, 2);
  } finally {
    await ordinary.close();
  }

  const cached = mountKeepAliveShell(true);
  try {
    await cached.mount();
    const initial = cached.dom.window.document.querySelector<HTMLButtonElement>('[data-page="PageA"]');
    assert.ok(initial);
    await act(async () => initial.click());
    const pageRenderCount = cached.renders.PageA;
    await cached.navigate("/PageB");
    assert.equal(cached.renders.PageA, pageRenderCount);
    assert.equal(cached.dom.window.document.querySelector('[data-page="PageA"]'), initial);
    assert.equal(cached.dom.window.document.querySelector('[data-page="PageA"]')?.textContent, "1");
    assert.equal(cached.unmounts.PageA, 0);
    assert.equal(initial.parentElement?.getAttribute("aria-hidden"), "true");
    assert.equal((initial.parentElement as HTMLElement).style.display, "none");
    const hiddenPageRenderCount = cached.renders.PageA;
    await cached.rerender();
    assert.equal(cached.renders.PageA, hiddenPageRenderCount);
    await cached.navigate("/PageA");
    assert.equal(cached.dom.window.document.querySelector('[data-page="PageA"]'), initial);
    assert.equal(cached.mounts.PageA, 1);
    assert.equal(initial.parentElement?.getAttribute("aria-hidden"), "false");
    assert.equal((initial.parentElement as HTMLElement).style.display, "contents");
  } finally {
    await cached.close();
  }
});

test("closing a kept-alive route tab releases its page instance", async () => {
  const fixture = mountKeepAliveShell(true);
  try {
    await fixture.mount();
    const initial = fixture.dom.window.document.querySelector<HTMLButtonElement>('[data-page="PageA"]');
    assert.ok(initial);
    await fixture.navigate("/PageB");
    assert.equal(fixture.unmounts.PageA, 0);
    await act(async () => fixture.closeTab("PageA"));
    assert.equal(fixture.dom.window.document.querySelector('[data-page="PageA"]'), null);
    assert.equal(fixture.unmounts.PageA, 1);
    await fixture.navigate("/PageA");
    const reopened = fixture.dom.window.document.querySelector<HTMLButtonElement>('[data-page="PageA"]');
    assert.ok(reopened);
    assert.notEqual(reopened, initial);
    assert.equal(reopened.textContent, "0");
    assert.equal(fixture.mounts.PageA, 2);
  } finally {
    await fixture.close();
  }
});

test("browser back returns to the preserved page and tab refresh starts a fresh instance", async () => {
  const fixture = mountKeepAliveShell(true);
  try {
    await fixture.mount();
    const initial = fixture.dom.window.document.querySelector<HTMLButtonElement>('[data-page="PageA"]');
    assert.ok(initial);
    await act(async () => initial.click());
    await fixture.navigate("/PageB");
    await fixture.back();
    assert.equal(fixture.context().currentPath, "/PageA");
    assert.equal(fixture.dom.window.document.querySelector('[data-page="PageA"]'), initial);
    assert.equal(initial.textContent, "1");
    assert.equal(fixture.mounts.PageA, 1);

    await act(async () => fixture.refreshTab("PageA"));
    const refreshed = fixture.dom.window.document.querySelector<HTMLButtonElement>('[data-page="PageA"]');
    assert.ok(refreshed);
    assert.notEqual(refreshed, initial);
    assert.equal(refreshed.textContent, "0");
    assert.equal(fixture.mounts.PageA, 2);
    assert.equal(fixture.unmounts.PageA, 1);
  } finally {
    await fixture.close();
  }
});

test("remote APP keepAlive retains its iframe and reports host activation until closed", async () => {
  const fixture = mountKeepAliveShell(true, true);
  try {
    await fixture.mount();
    let iframe = fixture.dom.window.document.querySelector<HTMLIFrameElement>("iframe");
    assert.ok(iframe);
    const frameWindow = iframe.contentWindow;
    assert.ok(frameWindow);
    const messages: Array<{ TYPE: string; PAYLOAD?: { HOST_ACTIVE?: boolean } }> = [];
    frameWindow.postMessage = ((message: { TYPE: string; PAYLOAD?: { HOST_ACTIVE?: boolean } }) => {
      messages.push(message);
    }) as typeof frameWindow.postMessage;
    await act(async () => {
      fixture.dom.window.dispatchEvent(
        new fixture.dom.window.MessageEvent("message", {
          origin: "https://child.example.test",
          source: frameWindow,
          data: { CHANNEL: "BIU", TYPE: "BIU_READY", APP_ID: "ChildTest" },
        }),
      );
    });
    assert.equal(messages.at(-1)?.PAYLOAD?.HOST_ACTIVE, true);
    assert.equal(fixture.remoteLifecycle.includes("READY"), true);

    await fixture.navigate("/PageB");
    assert.strictEqual(fixture.dom.window.document.querySelector("iframe"), iframe);
    const remoteHost = fixture.dom.window.document.querySelector<HTMLElement>('[data-biu-remote-keepalive="PageA"]');
    assert.equal(remoteHost?.style.display, "none");
    assert.equal(remoteHost?.getAttribute("aria-hidden"), "true");
    assert.equal(remoteHost?.hasAttribute("inert"), true);
    assert.equal(messages.at(-1)?.PAYLOAD?.HOST_ACTIVE, false);
    assert.equal(fixture.remoteLifecycle.includes("DEACTIVATE"), true);

    await fixture.navigate("/PageA");
    assert.strictEqual(fixture.dom.window.document.querySelector("iframe"), iframe);
    assert.equal(remoteHost?.style.display, "contents");
    assert.equal(messages.at(-1)?.PAYLOAD?.HOST_ACTIVE, true);
    assert.equal(fixture.remoteLifecycle.includes("ACTIVATE"), true);

    await fixture.navigate("/PageB");
    await fixture.back();
    assert.equal(fixture.context().currentPath, "/PageA");
    assert.strictEqual(fixture.dom.window.document.querySelector("iframe"), iframe);
    assert.equal(messages.at(-1)?.PAYLOAD?.HOST_ACTIVE, true);

    await act(async () => fixture.refreshTab("PageA"));
    const refreshed = fixture.dom.window.document.querySelector<HTMLIFrameElement>("iframe");
    assert.ok(refreshed);
    assert.notStrictEqual(refreshed, iframe);
    assert.equal(fixture.remoteLifecycle.filter((event) => event === "UNLOAD").length, 1);
    iframe = refreshed;

    await fixture.navigate("/PageB");
    await act(async () => fixture.closeTab("PageA"));
    assert.equal(fixture.dom.window.document.querySelector("iframe"), null);
    assert.equal(fixture.remoteLifecycle.includes("UNLOAD"), true);

    await fixture.navigate("/PageA");
    const reopened = fixture.dom.window.document.querySelector("iframe");
    assert.ok(reopened);
    assert.notStrictEqual(reopened, iframe);
  } finally {
    await fixture.close();
  }
});

test("remote APP routes still unload on navigation when keepAlive is omitted", async () => {
  const fixture = mountKeepAliveShell(false, true);
  try {
    await fixture.mount();
    const iframe = fixture.dom.window.document.querySelector("iframe");
    assert.ok(iframe);
    await fixture.navigate("/PageB");
    assert.equal(fixture.dom.window.document.querySelector("iframe"), null);
    assert.notStrictEqual(iframe, fixture.dom.window.document.querySelector("iframe"));
    assert.equal(fixture.remoteLifecycle.includes("UNLOAD"), true);
  } finally {
    await fixture.close();
  }
});
