import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { BiuContext, useBiuOverlay } from "../src/context.js";
import type { BiuContextValue, BiuOverlayState } from "../src/types.js";

for (const hostOrigin of [undefined, ""] as const) {
  test(`an overlay request with ${hostOrigin === undefined ? "unresolved" : "rejected"} host origin cannot infer a parent`, async () => {
    const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
      url: "https://app.example.test/",
      referrer: "https://unexpected.example.test/portal",
    });
    const globals = { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true };
    const descriptors = new Map(
      Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
    );
    Object.assign(globalThis, globals);
    const calls: unknown[] = [];
    Object.defineProperty(dom.window, "parent", {
      configurable: true,
      value: { postMessage: (message: unknown, origin: string) => calls.push([message, origin]) },
    });
    let requestOverlay!: (state: BiuOverlayState) => void;
    function Probe() {
      requestOverlay = useBiuOverlay();
      return null;
    }
    const root = createRoot(dom.window.document.getElementById("root")!);
    try {
      await act(async () => {
        root.render(
          createElement(
            BiuContext.Provider,
            { value: { appId: "OverlayOriginTest", hostOrigin } as BiuContextValue },
            createElement(Probe),
          ),
        );
      });
      requestOverlay({ ID: "review", OPEN: true, SCOPE: "HOST_CHROME" });
      assert.deepEqual(calls, []);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const [key, descriptor] of descriptors) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    }
  });
}
