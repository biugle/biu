import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createWatermark } from "../src/index.js";

test("watermark API is framework neutral and cleans up its layer", () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  const previousGetComputedStyle = globalThis.getComputedStyle;
  Object.assign(globalThis, {
    document: dom.window.document,
    window: dom.window,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  });
  try {
    assert.equal(typeof createWatermark, "function");
    const target = document.createElement("section");
    document.body.append(target);
    const handle = createWatermark(target, {
      text: ["内部系统", "仅供演示"],
      opacity: 2,
      className: "custom-watermark",
      observeTamper: true,
    });
    const node = target.querySelector<HTMLElement>("[data-biu-component=watermark]");
    assert.ok(node);
    assert.equal(node.className, "biu-watermark custom-watermark");
    assert.equal(node.getAttribute("aria-hidden"), "true");
    assert.equal(target.style.position, "relative");
    assert.equal(node.style.backgroundRepeat, "repeat");
    assert.equal(node.style.pointerEvents, "none");

    handle.update({ text: "更新水印", opacity: -1 });
    assert.equal(node.style.backgroundRepeat, "repeat");
    handle.refresh();

    handle.destroy();
    assert.equal(target.querySelector("[data-biu-component=watermark]"), null);
    assert.equal(target.style.position, "");
  } finally {
    if (previousDocument) Object.assign(globalThis, { document: previousDocument });
    else Reflect.deleteProperty(globalThis, "document");
    if (previousWindow) Object.assign(globalThis, { window: previousWindow });
    else Reflect.deleteProperty(globalThis, "window");
    if (previousGetComputedStyle) Object.assign(globalThis, { getComputedStyle: previousGetComputedStyle });
    else Reflect.deleteProperty(globalThis, "getComputedStyle");
    dom.window.close();
  }
});

test("watermark restores its layer when a consumer removes it", async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  const previousGetComputedStyle = globalThis.getComputedStyle;
  Object.assign(globalThis, {
    document: dom.window.document,
    window: dom.window,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    MutationObserver: dom.window.MutationObserver,
  });
  try {
    const target = document.createElement("section");
    document.body.append(target);
    const handle = createWatermark(target, { text: "恢复测试", observeTamper: true, refreshThrottleMs: 0 });
    const node = target.querySelector<HTMLElement>("[data-biu-component=watermark]");
    assert.ok(node);
    node.remove();
    // The implementation deliberately keeps a small lower bound on refresh
    // throttling so a noisy MutationObserver cannot become a render loop.
    await new Promise((resolve) => setTimeout(resolve, 160));
    assert.equal(target.querySelector("[data-biu-component=watermark]"), node);
    handle.destroy();
  } finally {
    if (previousDocument) Object.assign(globalThis, { document: previousDocument });
    else Reflect.deleteProperty(globalThis, "document");
    if (previousWindow) Object.assign(globalThis, { window: previousWindow });
    else Reflect.deleteProperty(globalThis, "window");
    if (previousGetComputedStyle) Object.assign(globalThis, { getComputedStyle: previousGetComputedStyle });
    else Reflect.deleteProperty(globalThis, "getComputedStyle");
    Reflect.deleteProperty(globalThis, "MutationObserver");
    dom.window.close();
  }
});
