import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Anchor, ScrollProgress } from "../src/ui/index.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
const browserWindow = dom.window;
Object.assign(globalThis, {
  window: browserWindow,
  document: browserWindow.document,
  HTMLElement: browserWindow.HTMLElement,
  HTMLDivElement: browserWindow.HTMLDivElement,
  Node: browserWindow.Node,
  Event: browserWindow.Event,
  MouseEvent: browserWindow.MouseEvent,
  MutationObserver: browserWindow.MutationObserver,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: browserWindow.navigator });
Object.assign(browserWindow, {
  requestAnimationFrame: (callback: FrameRequestCallback) => browserWindow.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => browserWindow.clearTimeout(id),
});
Object.assign(globalThis, {
  requestAnimationFrame: (callback: FrameRequestCallback) => browserWindow.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => browserWindow.clearTimeout(id),
});

const windowScrollCalls: Array<{ top?: number; behavior?: ScrollBehavior }> = [];
Object.defineProperty(browserWindow, "scrollTo", {
  configurable: true,
  value: (options: { top?: number; behavior?: ScrollBehavior }) => windowScrollCalls.push(options),
});

async function mount(node: React.ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  let root!: Root;
  await act(async () => {
    root = createRoot(host);
    root.render(node);
  });
  return { host, root };
}

async function unmount(rendered: { host: HTMLDivElement; root: Root }) {
  await act(async () => rendered.root.unmount());
  rendered.host.remove();
  document.body.replaceChildren();
  windowScrollCalls.length = 0;
}

test("Anchor scans h1-h5, generates missing ids and scrolls with the configured offset", async () => {
  const content = document.createElement("div");
  content.id = "anchor-content";
  content.innerHTML = "<h2 id='overview'>概览</h2><h3>组件详情</h3><h6>忽略</h6>";
  document.body.append(content);
  const overview = content.querySelector<HTMLElement>("h2")!;
  const details = content.querySelector<HTMLElement>("h3")!;
  Object.defineProperty(overview, "getBoundingClientRect", { value: () => ({ top: 0 }) });
  Object.defineProperty(details, "getBoundingClientRect", { value: () => ({ top: 120 }) });
  const changes: string[] = [];
  const rendered = await mount(
    React.createElement(Anchor, {
      container: "#anchor-content",
      levels: [2, 3],
      offsetTop: 24,
      onChange: (id: string) => changes.push(id),
      className: "anchor-custom",
      classNames: { item: "anchor-item-custom" },
    }),
  );
  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    const links = rendered.host.querySelectorAll<HTMLAnchorElement>(".biu-ui-anchor__item-row > a");
    assert.equal(links.length, 2);
    assert.equal(content.querySelector("h2")?.id, "overview");
    assert.match(content.querySelector("h3")?.id ?? "", /^biu-anchor-/);
    assert.ok(rendered.host.querySelector(".anchor-custom"));
    assert.ok(rendered.host.querySelector(".anchor-item-custom"));
    assert.equal(links[0]?.getAttribute("aria-current"), "location");

    await act(async () => links[1]?.click());
    assert.equal(windowScrollCalls.at(-1)?.behavior, "smooth");
    assert.equal(changes.at(-1), content.querySelector("h3")?.id);
  } finally {
    await unmount(rendered);
    content.remove();
  }
});

test("Anchor builds nested heading groups and supports independent level toggles", async () => {
  const content = document.createElement("div");
  content.id = "nested-anchor-content";
  content.innerHTML = "<h1>总览</h1><h2>基础能力</h2><h3>按钮</h3><h2>数据能力</h2>";
  document.body.append(content);
  const rendered = await mount(
    React.createElement(Anchor, {
      container: "#nested-anchor-content",
      levels: [1, 2, 3],
      collapsible: true,
      mode: "static",
      position: "left",
    }),
  );
  try {
    assert.equal(
      rendered.host.querySelector('[data-biu-anchor-mode="static"]')?.getAttribute("data-biu-anchor-position"),
      "left",
    );
    assert.equal(rendered.host.querySelectorAll(".biu-ui-anchor__nested").length, 2);
    const toggles = rendered.host.querySelectorAll<HTMLButtonElement>(".biu-ui-anchor__node-toggle");
    assert.equal(toggles.length, 2);
    await act(async () => toggles[0]?.click());
    assert.equal(rendered.host.querySelectorAll(".biu-ui-anchor__nested").length, 0);
  } finally {
    await unmount(rendered);
    content.remove();
  }
});

test("ScrollProgress measures a scroll container and exposes a back-to-top action", async () => {
  const scrollHost = document.createElement("div");
  Object.defineProperties(scrollHost, {
    clientHeight: { configurable: true, value: 200 },
    scrollHeight: { configurable: true, value: 1000 },
  });
  scrollHost.scrollTop = 400;
  const rendered = await mount(
    React.createElement(ScrollProgress, {
      target: { current: scrollHost },
      className: "progress-custom",
      classNames: { button: "progress-button-custom" },
    }),
  );
  try {
    const progress = rendered.host.querySelector<HTMLElement>('[role="progressbar"]');
    assert.ok(progress);
    assert.equal(progress.getAttribute("aria-valuenow"), "50");
    const button = rendered.host.querySelector<HTMLButtonElement>(".progress-button-custom");
    assert.ok(button);
    let top = -1;
    Object.defineProperty(scrollHost, "scrollTo", {
      configurable: true,
      value: (options: { top?: number }) => {
        top = options.top ?? -1;
      },
    });
    await act(async () => button.click());
    assert.equal(top, 0);
    assert.ok(rendered.host.querySelector(".progress-custom"));
  } finally {
    await unmount(rendered);
  }
});

test("ScrollProgress supports static rendering and corner metadata", async () => {
  const rendered = await mount(React.createElement(ScrollProgress, { mode: "static", position: "top-left" }));
  try {
    const root = rendered.host.querySelector<HTMLElement>('[data-biu-component="scroll-progress"]');
    assert.equal(root?.getAttribute("data-biu-scroll-progress-mode"), "static");
    assert.equal(root?.getAttribute("data-biu-scroll-progress-position"), "top-left");
    assert.equal(root?.classList.contains("biu-ui-scroll-progress--static"), true);
  } finally {
    await unmount(rendered);
  }
});
