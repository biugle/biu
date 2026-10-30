import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { i18n } from "@biugle/biu-i18n";
import { biuMessage } from "@biugle/react-components";
import { useBiuAuthStore, useBiuMenuStore, useBiuPreferenceStore } from "@biugle/biu-store";
import { BiuShell, useBiuContext, type BiuContextValue, type BiuRuntimeConfig } from "../src/index.js";

async function mountUpdateShell() {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "https://portal.example/",
  });
  const globals = { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true };
  const descriptors = new Map(
    [...Object.keys(globals), "fetch"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  Object.assign(globalThis, globals);
  const previousPreferences = useBiuPreferenceStore.getState();
  const previousAuth = useBiuAuthStore.getState();
  const previousMenus = useBiuMenuStore.getState();
  const previousLocale = i18n.getLocale();
  const previousInfo = biuMessage.info;
  const notices: Array<{ content: string; action?: string }> = [];
  biuMessage.info = (content, options) => {
    notices.push({ content, action: options?.action?.label });
    return options?.id ?? "update-notice";
  };
  let buildId = "build-a";
  let deferred = false;
  const requests: string[] = [];
  const pending: Array<() => void> = [];
  globalThis.fetch = async (input) => {
    requests.push(new URL(String(input)).pathname);
    const response = () => new Response(JSON.stringify({ buildId }));
    if (!deferred) return response();
    return new Promise<Response>((resolve) => pending.push(() => resolve(response())));
  };
  let context!: BiuContextValue;
  function Probe() {
    context = useBiuContext();
    return createElement("output", null, context.locale);
  }
  let config: BiuRuntimeConfig = {
    appId: "UpdateShellTest",
    projectType: "PORTAL",
    locale: "zh-CN",
    auth: { enabled: false },
    routes: [],
    pageRegistry: {},
    fallbackMenus: [
      { code: "PageA", type: "MENU", target: "PORTAL", path: "/PageA" },
      { code: "PageB", type: "MENU", target: "PORTAL", path: "/PageB" },
    ],
    layoutComponent: Probe,
  };
  const root = createRoot(dom.window.document.getElementById("root")!);
  let mounted = true;
  await act(async () => root.render(createElement(BiuShell, { config })));
  return {
    requests,
    notices,
    deploy: () => {
      buildId = "build-b";
    },
    defer: () => {
      deferred = true;
    },
    setLocale: async (locale: string) => act(async () => context.setLocale(locale)),
    navigate: async (path: string) => act(async () => assert.equal(context.navigate(path), true)),
    configure: async (updateCheck: BiuRuntimeConfig["updateCheck"]) => {
      config = { ...config, updateCheck };
      await act(async () => root.render(createElement(BiuShell, { config })));
    },
    respond: async () => {
      const resolve = pending.shift();
      assert.ok(resolve, "an update request must be pending");
      await act(async () => resolve());
    },
    unmount: async () => {
      await act(async () => root.unmount());
      mounted = false;
    },
    close: async () => {
      if (mounted) await act(async () => root.unmount());
      biuMessage.info = previousInfo;
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

test("language changes preserve the update baseline and single notice in the current language", async () => {
  const shell = await mountUpdateShell();
  try {
    assert.deepEqual(shell.requests, ["/manifest/routes.json"]);
    shell.deploy();
    await shell.setLocale("en-US");
    await shell.navigate("/PageA");
    assert.deepEqual(shell.notices, [
      { content: "A new version is available. Refresh to update.", action: "Refresh page" },
    ]);
    assert.equal(shell.requests.length, 2);
    await shell.setLocale("zh-CN");
    await shell.navigate("/PageB");
    assert.equal(shell.notices.length, 1);
    assert.equal(shell.requests.length, 2);
  } finally {
    await shell.close();
  }
});

for (const end of ["unmount", "disable", "replace-url"] as const) {
  test(`a pending update check cannot notify after shell ${end}`, async () => {
    const shell = await mountUpdateShell();
    try {
      shell.deploy();
      shell.defer();
      await shell.navigate("/PageA");
      if (end === "unmount") await shell.unmount();
      else await shell.configure(end === "disable" ? { enabled: false } : { manifestUrl: "/new-manifest.json" });
      await shell.respond();
      assert.deepEqual(shell.notices, []);
    } finally {
      await shell.close();
    }
  });
}
