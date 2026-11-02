import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { i18n } from "@biugle/biu-i18n";
import { useBiuAuthStore, useBiuMenuStore, useBiuPreferenceStore } from "@biugle/biu-store";
import { BiuShell, useBiuContext } from "../src/index.js";
import type { BiuContextValue, BiuRuntimeConfig, LayoutContentProps } from "../src/types.js";

function authFixture(embedded = false) {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: embedded ? "https://app.example.test/" : "https://portal.example.test/",
    referrer: "https://host.example.test/portal",
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
  const parent = { postMessage: () => undefined };
  if (embedded) Object.defineProperty(dom.window, "parent", { configurable: true, value: parent });
  let context!: BiuContextValue;
  function Probe() {
    context = useBiuContext();
    return createElement("output", null, context.auth?.user?.name ?? "signed out");
  }
  function Layout({ children }: LayoutContentProps) {
    return createElement("div", null, children);
  }
  function AuthPage() {
    return createElement("section", { "data-auth-gate": true }, createElement(Probe));
  }
  const config: BiuRuntimeConfig = {
    appId: "AuthClearTest",
    projectType: embedded ? "APP" : "PORTAL",
    routes: [],
    pageRegistry: {},
    auth: { mode: "SSO", authenticated: true, user: { name: "Configured identity" }, required: !embedded },
    updateCheck: { enabled: false },
    hostOrigins: ["https://host.example.test"],
    homePage: Probe,
    layoutComponent: Layout,
    portalSlots: { authPage: AuthPage },
  };
  const root = createRoot(dom.window.document.getElementById("root")!);
  return {
    dom,
    root,
    parent,
    config,
    context: () => context,
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

test("clearing configured authentication activates the required auth gate and keeps the identity empty", async () => {
  const fixture = authFixture();
  try {
    await act(async () => fixture.root.render(createElement(BiuShell, { config: fixture.config })));
    assert.equal(fixture.context().auth?.user?.name, "Configured identity");
    assert.equal(fixture.dom.window.document.querySelector("[data-auth-gate]"), null);
    await act(async () => useBiuAuthStore.getState().clear());
    assert.equal(fixture.context().auth, undefined);
    assert.equal(useBiuAuthStore.getState().context, undefined);
    assert.ok(fixture.dom.window.document.querySelector("[data-auth-gate]"));
    assert.equal(fixture.dom.window.document.querySelector("output")?.textContent, "signed out");
    await act(async () =>
      fixture.root.render(
        createElement(BiuShell, { config: { ...fixture.config, layout: { menuMode: "MULTI_LEVEL" } } }),
      ),
    );
    assert.equal(fixture.context().auth, undefined);
    assert.equal(useBiuAuthStore.getState().context, undefined);
    assert.ok(fixture.dom.window.document.querySelector("[data-auth-gate]"));
  } finally {
    await fixture.close();
  }
});

test("embedded host identity flows through the auth store and cannot override later clear or setAuth", async () => {
  const fixture = authFixture(true);
  const sendHostIdentity = (name: string) =>
    fixture.dom.window.dispatchEvent(
      new fixture.dom.window.MessageEvent("message", {
        source: fixture.parent as unknown as Window,
        origin: "https://host.example.test",
        data: {
          CHANNEL: "BIU",
          TYPE: "HOST_CONTEXT",
          APP_ID: fixture.config.appId,
          PAYLOAD: { AUTH: { mode: "SSO", authenticated: true, user: { name } }, THEME: "dark" },
        },
      }),
    );
  try {
    await act(async () => fixture.root.render(createElement(BiuShell, { config: fixture.config })));
    await act(async () => sendHostIdentity("Host identity"));
    assert.equal(fixture.context().auth?.user?.name, "Host identity");
    assert.strictEqual(fixture.context().auth, useBiuAuthStore.getState().context);
    await act(async () =>
      fixture.context().setAuth({ mode: "SSO", authenticated: true, user: { name: "Refreshed identity" } }),
    );
    assert.equal(fixture.context().auth?.user?.name, "Refreshed identity");
    assert.strictEqual(fixture.context().auth, useBiuAuthStore.getState().context);
    await act(async () => useBiuAuthStore.getState().clear());
    assert.equal(fixture.context().auth, undefined);
    assert.equal(useBiuAuthStore.getState().context, undefined);
    assert.equal(fixture.context().theme, "dark");
    await act(async () => sendHostIdentity("New host identity"));
    assert.equal(fixture.context().auth?.user?.name, "New host identity");
    assert.strictEqual(fixture.context().auth, useBiuAuthStore.getState().context);
    await act(async () => fixture.context().setAuth(undefined));
    assert.equal(fixture.context().auth, undefined);
    assert.equal(useBiuAuthStore.getState().context, undefined);
    assert.equal(fixture.dom.window.document.querySelector("output")?.textContent, "signed out");
  } finally {
    await fixture.close();
  }
});
