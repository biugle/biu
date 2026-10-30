import assert from "node:assert/strict";
import { test } from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { useBiuAuth, useBiuAuthStore, useBiuMenuStore, useBiuPreferenceStore } from "@biugle/biu-store";
import {
  BiuShell,
  useBiuContext,
  type BiuContextValue,
  type BiuRuntimeConfig,
  type LayoutContentProps,
} from "../src/index.js";

test("sign-in callbacks, identity refresh and toolbar logout share one auth source", async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "https://portal.example/",
  });
  const globals = {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const descriptors = Object.fromEntries(
    Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  Object.assign(globalThis, globals);
  const previousPreferences = useBiuPreferenceStore.getState();
  const previousAuth = useBiuAuthStore.getState();
  const previousMenus = useBiuMenuStore.getState();
  let context!: BiuContextValue;
  let layout!: LayoutContentProps;
  let legacyAuth = previousAuth.context;
  function Probe() {
    context = useBiuContext();
    legacyAuth = useBiuAuth();
    return React.createElement("output", null, context.auth?.user?.name ?? "signed out");
  }
  function Layout(props: LayoutContentProps) {
    layout = props;
    return React.createElement(Probe);
  }
  const config: BiuRuntimeConfig = {
    appId: "AuthSourceTest",
    projectType: "PORTAL",
    routes: [],
    pageRegistry: {},
    auth: { mode: "SSO", authenticated: false },
    layoutComponent: Layout,
    portalSlots: { authPage: Probe },
  };
  const root = createRoot(dom.window.document.getElementById("root")!);
  try {
    await act(async () => root.render(React.createElement(BiuShell, { config })));
    assert.equal(context.auth?.authenticated, false);
    assert.strictEqual(context.auth, useBiuAuthStore.getState().context);
    await act(async () => {
      context.login();
      // The project's SSO completion callback supplies identity through the
      // documented Runtime context; the shell does not handle credentials.
      context.setAuth({ mode: "SSO", authenticated: true, user: { id: "demo-user", name: "Signed in" } });
      context.setTheme("dark");
    });
    assert.equal(dom.window.document.querySelector("output")?.textContent, "Signed in");
    assert.strictEqual(layout.auth, useBiuAuthStore.getState().context);
    assert.strictEqual(legacyAuth, context.auth);
    assert.strictEqual(useBiuPreferenceStore.getState().auth, context.auth);
    await act(async () => {
      useBiuAuthStore.getState().setContext({
        mode: "SSO",
        authenticated: true,
        user: { id: "demo-user", name: "Refreshed identity" },
      });
    });
    assert.equal(context.auth?.user?.name, "Refreshed identity");
    assert.strictEqual(layout.auth, context.auth);
    assert.strictEqual(useBiuPreferenceStore.getState().auth, context.auth);
    await act(async () => layout.onUserAction?.("LOGOUT"));
    assert.equal(context.auth?.authenticated, false);
    assert.equal(context.auth?.user, undefined);
    assert.strictEqual(useBiuAuthStore.getState().context, context.auth);
    assert.strictEqual(useBiuPreferenceStore.getState().auth, context.auth);
    assert.strictEqual(legacyAuth, context.auth);
    assert.equal(dom.window.location.pathname, "/Login");
    assert.equal(dom.window.document.querySelector("output")?.textContent, "signed out");
    assert.ok(
      [...Array.from({ length: dom.window.sessionStorage.length }, (_, index) => dom.window.sessionStorage.key(index))]
        .filter((key): key is string => Boolean(key?.startsWith("BIU_PREFERENCES_SESSION:")))
        .every((key) => !Object.hasOwn(JSON.parse(dom.window.sessionStorage.getItem(key)!), "auth")),
    );
  } finally {
    await act(async () => root.unmount());
    useBiuPreferenceStore.setState(previousPreferences, true);
    useBiuAuthStore.setState(previousAuth, true);
    useBiuMenuStore.setState(previousMenus, true);
    dom.window.close();
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
