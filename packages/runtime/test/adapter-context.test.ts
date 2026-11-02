import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { FrameworkPage } from "../src/index.js";
import type { BiuFrameworkAdapter, BiuPageContext } from "../src/types.js";

async function checkAdapterContextUpdates(supportsUpdate: boolean) {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "https://app.example/ExamplePage",
  });
  const globals = { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true };
  const descriptors = new Map(
    Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  Object.assign(globalThis, globals);
  const counts = { mounts: 0, updates: 0, cleanups: 0, unmounts: 0 };
  const adapter: BiuFrameworkAdapter = {
    framework: "test",
    renderPage(container, _page, context) {
      counts.mounts += 1;
      container.innerHTML = `<output>${String(context.hostActive)}</output>`;
      return () => {
        counts.cleanups += 1;
      };
    },
    ...(supportsUpdate
      ? {
          updatePage(container: Element, _page: unknown, context: BiuPageContext) {
            counts.updates += 1;
            container.querySelector("output")!.textContent = String(context.hostActive);
          },
        }
      : {}),
    unmountPage() {
      counts.unmounts += 1;
    },
  };
  const root = createRoot(dom.window.document.getElementById("root")!);
  const context = (hostActive: boolean): BiuPageContext => ({ appId: "ContextTest", code: "ExamplePage", hostActive });
  const loader = async () => ({ default: {} });
  const render = async (value: BiuPageContext) => {
    await act(async () => {
      root.render(
        createElement(FrameworkPage, {
          loader,
          adapter,
          context: value,
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  try {
    await render(context(true));
    assert.equal(counts.mounts, 1);
    assert.equal(dom.window.document.querySelector("output")?.textContent, "true");
    await render(context(false));
    if (supportsUpdate) {
      assert.equal(counts.mounts, 1);
      assert.equal(counts.updates, 1);
      assert.equal(counts.unmounts, 0);
      assert.equal(dom.window.document.querySelector("output")?.textContent, "false");
    } else {
      assert.equal(counts.mounts, 2);
      assert.equal(counts.updates, 0);
      assert.equal(counts.unmounts, 1);
      assert.equal(dom.window.document.querySelector("output")?.textContent, "false");
    }
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }

  return counts;
}

test("Adapters can update live host context without remounting, while legacy adapters remain compatible", async () => {
  const persistent = await checkAdapterContextUpdates(true);
  assert.deepEqual(persistent, { mounts: 1, updates: 1, cleanups: 1, unmounts: 1 });
  const legacy = await checkAdapterContextUpdates(false);
  assert.deepEqual(legacy, { mounts: 2, updates: 0, cleanups: 2, unmounts: 2 });
});

test("a failed persistent context update disposes the adapter exactly once", async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "https://app.example/ExamplePage",
  });
  const globals = { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true };
  const descriptors = new Map(
    Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  Object.assign(globalThis, globals);
  const counts = { cleanups: 0, unmounts: 0 };
  const adapter: BiuFrameworkAdapter = {
    framework: "test",
    renderPage(container) {
      container.innerHTML = "<output>mounted</output>";
      return () => {
        counts.cleanups += 1;
      };
    },
    async updatePage() {
      throw new Error("context update failed");
    },
    unmountPage() {
      counts.unmounts += 1;
    },
  };
  const root = createRoot(dom.window.document.getElementById("root")!);
  const context = (hostActive: boolean): BiuPageContext => ({ appId: "ContextTest", code: "ExamplePage", hostActive });
  const loader = async () => ({ default: {} });

  try {
    await act(async () => {
      root.render(createElement(FrameworkPage, { loader, adapter, context: context(true) }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await act(async () => {
      root.render(createElement(FrameworkPage, { loader, adapter, context: context(false) }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.equal(counts.cleanups, 1);
    assert.equal(counts.unmounts, 1);
    assert.match(dom.window.document.body.textContent || "", /context update failed/);

    await act(async () => root.unmount());
    assert.deepEqual(counts, { cleanups: 1, unmounts: 1 });
  } finally {
    dom.window.close();
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});

test("an async adapter render that finishes after route unmount is cleaned up after it settles", async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "https://app.example/ExamplePage",
  });
  const globals = { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true };
  const descriptors = new Map(
    Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  Object.assign(globalThis, globals);
  const events: string[] = [];
  let finishRender!: () => void;
  const adapter: BiuFrameworkAdapter = {
    framework: "test",
    renderPage(container) {
      return new Promise((resolve) => {
        finishRender = () => {
          container.innerHTML = "<output>late mount</output>";
          resolve(() => {
            events.push("cleanup");
            container.innerHTML = "";
          });
        };
      });
    },
    updatePage() {},
    unmountPage(container) {
      events.push("unmount");
      container.innerHTML = "";
    },
  };
  const root = createRoot(dom.window.document.getElementById("root")!);
  const context: BiuPageContext = { appId: "ContextTest", code: "ExamplePage" };
  const loader = async () => ({ default: {} });

  try {
    await act(async () => {
      root.render(createElement(FrameworkPage, { loader, adapter, context }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.equal(typeof finishRender, "function");
    await act(async () => root.unmount());
    assert.deepEqual(events, []);

    await act(async () => {
      finishRender();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.deepEqual(events, ["cleanup", "unmount"]);
  } finally {
    dom.window.close();
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});

test("a render failure after partial adapter setup unmounts the framework instance", async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "https://app.example/ExamplePage",
  });
  const globals = { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true };
  const descriptors = new Map(
    Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  Object.assign(globalThis, globals);
  let unmounts = 0;
  const adapter: BiuFrameworkAdapter = {
    framework: "test",
    renderPage(container) {
      container.textContent = "partial setup";
      throw new Error("render failed");
    },
    updatePage() {},
    unmountPage() {
      unmounts += 1;
    },
  };
  const root = createRoot(dom.window.document.getElementById("root")!);
  const context: BiuPageContext = { appId: "ContextTest", code: "ExamplePage" };
  const loader = async () => ({ default: {} });

  try {
    await act(async () => {
      root.render(createElement(FrameworkPage, { loader, adapter, context }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.equal(unmounts, 1);
    await act(async () => root.unmount());
    assert.equal(unmounts, 1);
  } finally {
    dom.window.close();
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
