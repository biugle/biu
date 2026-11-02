import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { createBiuEventBus, type BiuEventBus } from "@biugle/biu-events";
import { i18n } from "@biugle/biu-i18n";
import { useBiuAuthStore, useBiuMenuStore, useBiuPreferenceStore } from "@biugle/biu-store";
import { useRuntimeShellState } from "../src/use-runtime-shell-state.js";
import type { BiuRuntimeConfig } from "../src/types.js";

test("embedded APP receives host events once without echoing them back and still forwards local events", async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "https://app.example.test/",
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
  const calls: unknown[] = [];
  const parent = { postMessage: (message: unknown, origin: string) => calls.push([message, origin]) };
  Object.defineProperty(dom.window, "parent", { configurable: true, value: parent });
  const baseEventBus = createBiuEventBus();
  const payloads: unknown[] = [];
  baseEventBus.subscribe("order:saved", (event) => payloads.push(event.payload));
  const config: BiuRuntimeConfig = {
    appId: "AppEventTest",
    projectType: "APP",
    hostOrigins: ["https://host.example.test"],
    auth: { enabled: false },
    updateCheck: { enabled: false },
    routes: [],
    pageRegistry: {},
    eventBus: baseEventBus,
  };
  let events!: BiuEventBus;
  function Probe() {
    events = useRuntimeShellState(config).eventBus;
    return null;
  }
  const root = createRoot(dom.window.document.getElementById("root")!);
  let mounted = true;
  try {
    await act(async () => root.render(createElement(Probe)));
    calls.length = 0;
    const data = {
      CHANNEL: "BIU",
      TYPE: "APP_EVENT",
      APP_ID: config.appId,
      PAYLOAD: { name: "order:saved", payload: { id: "from-host" }, source: "PortalTest" },
    };
    for (const options of [
      { source: parent, origin: "https://unexpected.example.test", data },
      { source: null, origin: "https://host.example.test", data },
      { source: parent, origin: "https://host.example.test", data: { ...data, APP_ID: "OtherApp" } },
    ]) {
      dom.window.dispatchEvent(new dom.window.MessageEvent("message", options as MessageEventInit));
    }
    assert.deepEqual(payloads, []);
    dom.window.dispatchEvent(
      new dom.window.MessageEvent("message", {
        source: parent as unknown as Window,
        origin: "https://host.example.test",
        data,
      }),
    );
    assert.deepEqual(payloads, [{ id: "from-host" }]);
    assert.deepEqual(calls, []);
    events.publish("order:saved", { id: "from-app" });
    assert.deepEqual(payloads, [{ id: "from-host" }, { id: "from-app" }]);
    assert.deepEqual(calls, [
      [
        {
          CHANNEL: "BIU",
          TYPE: "APP_EVENT",
          APP_ID: config.appId,
          PAYLOAD: { name: "order:saved", payload: { id: "from-app" }, source: config.appId },
        },
        "https://host.example.test",
      ],
    ]);
    await act(async () => root.unmount());
    mounted = false;
    calls.length = 0;
    dom.window.dispatchEvent(
      new dom.window.MessageEvent("message", {
        source: parent as unknown as Window,
        origin: "https://host.example.test",
        data,
      }),
    );
    assert.deepEqual(payloads, [{ id: "from-host" }, { id: "from-app" }]);
    assert.deepEqual(calls, []);
  } finally {
    if (mounted) await act(async () => root.unmount());
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
