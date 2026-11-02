import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { i18n } from "@biugle/biu-i18n";
import { useBiuAuthStore, useBiuMenuStore, useBiuPreferenceStore } from "@biugle/biu-store";
import { BiuShell, useBiuContext } from "../src/index.js";
import type { BiuContextValue, BiuRuntimeConfig, LayoutContentProps } from "../src/types.js";

for (const enabled of [true, false]) {
  test(`iframe host context tracks current identity with default auth ${enabled ? "enabled" : "disabled"}`, async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
      url: "https://portal.example.test/ChildPage",
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
    let context!: BiuContextValue;
    function Layout({ children }: LayoutContentProps) {
      context = useBiuContext();
      return createElement("div", null, children);
    }
    const lifecycle: string[] = [];
    const config: BiuRuntimeConfig = {
      appId: "RemoteAuthTest",
      projectType: "PORTAL",
      portalCode: "PortalTest",
      routes: [],
      pageRegistry: {},
      auth: { enabled, mode: "SSO", authenticated: true, user: { name: "Configured identity" } },
      updateCheck: { enabled: false },
      fallbackMenus: [{ code: "ChildPage", type: "MENU", target: "APP", appId: "ChildTest" }],
      remoteApps: {
        ChildTest: { APP_URL: "https://child.example.test", ALLOWED_ORIGINS: ["https://child.example.test"] },
      },
      layoutComponent: Layout,
      onRemoteAppLifecycle: (event) => lifecycle.push(event.EVENT),
    };
    const root = createRoot(dom.window.document.getElementById("root")!);
    try {
      await act(async () => root.render(createElement(BiuShell, { config })));
      assert.equal(context.auth?.user?.name, "Configured identity");
      const iframe = dom.window.document.querySelector("iframe")!;
      assert.ok(iframe?.contentWindow);
      const messages: Array<{ PAYLOAD: { AUTH: unknown } }> = [];
      iframe.contentWindow.postMessage = (message) => messages.push(message);
      const ready = () => {
        dom.window.dispatchEvent(
          new dom.window.MessageEvent("message", {
            origin: "https://child.example.test",
            source: iframe.contentWindow,
            data: { CHANNEL: "BIU", TYPE: "BIU_READY", APP_ID: "ChildTest" },
          }),
        );
      };
      await act(async () => ready());
      messages.length = 0;
      await act(async () => context.setAuth({ mode: "SSO", authenticated: true, user: { name: "Signed in" } }));
      assert.equal(messages.length, 1);
      assert.deepEqual(messages.at(-1)?.PAYLOAD.AUTH, {
        mode: "SSO",
        authenticated: true,
        user: { name: "Signed in" },
      });
      messages.length = 0;
      await act(async () =>
        useBiuAuthStore.getState().setContext({
          mode: "SSO",
          authenticated: true,
          user: { name: "Refreshed identity", extra: { department: "Demo", token: "private-token" } },
        }),
      );
      assert.equal(messages.length, 1);
      assert.deepEqual(messages.at(-1)?.PAYLOAD.AUTH, {
        mode: "SSO",
        authenticated: true,
        user: { name: "Refreshed identity", extra: { department: "Demo" } },
      });
      messages.length = 0;
      await act(async () => context.setAuth({ mode: "SSO", authenticated: false }));
      assert.equal(messages.length, 1);
      assert.deepEqual(messages.at(-1)?.PAYLOAD.AUTH, { mode: "SSO", authenticated: false, user: undefined });
      for (const clear of [() => useBiuAuthStore.getState().clear(), () => context.setAuth(undefined)]) {
        await act(async () => context.setAuth({ mode: "SSO", authenticated: true, user: { name: "Live identity" } }));
        messages.length = 0;
        await act(async () => clear());
        assert.equal(useBiuAuthStore.getState().context, undefined);
        assert.equal(context.auth, undefined);
        assert.equal(messages.length, 1);
        assert.equal(messages.at(-1)?.PAYLOAD.AUTH, undefined);
        assert.strictEqual(dom.window.document.querySelector("iframe"), iframe);
      }
      assert.deepEqual(lifecycle, ["LOAD_START", "READY"]);
      await act(async () =>
        root.render(createElement(BiuShell, { config: { ...config, layout: { menuMode: "MULTI_LEVEL" } } })),
      );
      assert.equal(useBiuAuthStore.getState().context, undefined);
      assert.equal(context.auth, undefined);
      assert.strictEqual(dom.window.document.querySelector("iframe"), iframe);
      assert.equal(messages.at(-1)?.PAYLOAD.AUTH, undefined);
    } finally {
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
    }
  });
}
