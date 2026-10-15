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
  requestAnimationFrame: (callback: FrameRequestCallback) =>
    browserWindow.setTimeout(() => callback(browserWindow.performance.now()), 0),
  cancelAnimationFrame: (id: number) => browserWindow.clearTimeout(id),
});
Object.assign(globalThis, {
  requestAnimationFrame: (callback: FrameRequestCallback) =>
    browserWindow.setTimeout(() => callback(browserWindow.performance.now()), 0),
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
    assert.equal(windowScrollCalls.at(-1)?.behavior, "auto");
    assert.equal(changes.at(-1), content.querySelector("h3")?.id);
    assert.equal(decodeURIComponent(browserWindow.location.hash.slice(1)), content.querySelector("h3")?.id);
  } finally {
    await unmount(rendered);
    content.remove();
  }
});

test("Anchor keeps the destination aligned when skipped content above it materializes during scrolling", async () => {
  let scrollTop = 0;
  const priorScrollY = Object.getOwnPropertyDescriptor(browserWindow, "scrollY");
  const priorRequestAnimationFrame = browserWindow.requestAnimationFrame;
  const priorCancelAnimationFrame = browserWindow.cancelAnimationFrame;
  const priorScrollTo = browserWindow.scrollTo;
  Object.defineProperty(browserWindow, "scrollY", { configurable: true, get: () => scrollTop });
  browserWindow.scrollTo = ((options: { top?: number }) => {
    scrollTop = options.top ?? scrollTop;
    windowScrollCalls.push(options);
  }) as typeof browserWindow.scrollTo;

  const content = document.createElement("div");
  content.id = "layout-shift-anchor-content";
  content.innerHTML = "<h2 id='target-heading'>目标标题</h2>";
  document.body.append(content);
  const heading = content.querySelector<HTMLElement>("h2")!;
  Object.defineProperty(heading, "getBoundingClientRect", {
    value: () => ({ top: 600 + (scrollTop > 150 ? 100 : 0) - scrollTop }),
  });
  let animationTime = browserWindow.performance.now();
  browserWindow.requestAnimationFrame = (callback) =>
    browserWindow.setTimeout(() => {
      animationTime += 200;
      callback(animationTime);
    }, 0);
  browserWindow.cancelAnimationFrame = (id) => browserWindow.clearTimeout(id);

  const rendered = await mount(
    React.createElement(Anchor, { container: "#layout-shift-anchor-content", levels: [2], mode: "static" }),
  );
  try {
    const link = rendered.host.querySelector<HTMLAnchorElement>("a[data-anchor-id='target-heading']");
    assert.ok(link);
    await act(async () => {
      link.click();
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    assert.equal(scrollTop, 700);
  } finally {
    await unmount(rendered);
    content.remove();
    browserWindow.requestAnimationFrame = priorRequestAnimationFrame;
    browserWindow.cancelAnimationFrame = priorCancelAnimationFrame;
    browserWindow.scrollTo = priorScrollTo;
    if (priorScrollY) Object.defineProperty(browserWindow, "scrollY", priorScrollY);
    else Reflect.deleteProperty(browserWindow, "scrollY");
  }
});

test("Anchor resolves an incoming hash after headings mount asynchronously", async () => {
  browserWindow.history.replaceState(null, "", "/#delayed-heading");
  const content = document.createElement("div");
  content.id = "delayed-anchor-content";
  document.body.append(content);
  const rendered = await mount(
    React.createElement(Anchor, {
      container: "#delayed-anchor-content",
      levels: [2],
      mode: "static",
    }),
  );
  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    const heading = document.createElement("h2");
    heading.id = "delayed-heading";
    heading.textContent = "延迟标题";
    Object.defineProperty(heading, "getBoundingClientRect", { value: () => ({ top: 240 }) });
    content.append(heading);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 120));
    });
    assert.equal(
      rendered.host.querySelector("a[data-anchor-id=delayed-heading]")?.getAttribute("aria-current"),
      "location",
    );
  } finally {
    await unmount(rendered);
    content.remove();
    browserWindow.history.replaceState(null, "", "/");
  }
});

test("Anchor corrects an incoming deep link while skipped sections above it materialize", async () => {
  browserWindow.history.replaceState(null, "", "/#deep-linked-target");
  const priorRequestAnimationFrame = browserWindow.requestAnimationFrame;
  const priorCancelAnimationFrame = browserWindow.cancelAnimationFrame;
  const scrollContainer = document.createElement("div");
  scrollContainer.id = "deep-link-scroll-container";
  const heading = document.createElement("h2");
  heading.id = "deep-linked-target";
  heading.textContent = "深链目标";
  scrollContainer.append(heading);
  document.body.append(scrollContainer);

  let scrollTop = 0;
  Object.defineProperty(scrollContainer, "scrollTop", {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = value;
    },
  });
  Object.defineProperty(scrollContainer, "getBoundingClientRect", { value: () => ({ top: 0 }) });
  Object.defineProperty(heading, "getBoundingClientRect", {
    value: () => ({ top: 600 + (scrollTop > 150 ? 100 : 0) - scrollTop }),
  });

  let animationTime = browserWindow.performance.now();
  browserWindow.requestAnimationFrame = (callback) =>
    browserWindow.setTimeout(() => {
      animationTime += 200;
      callback(animationTime);
    }, 0);
  browserWindow.cancelAnimationFrame = (id) => browserWindow.clearTimeout(id);

  const rendered = await mount(
    React.createElement(Anchor, {
      container: scrollContainer,
      scrollContainer,
      levels: [2],
      mode: "static",
    }),
  );
  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    assert.equal(scrollTop, 700);
    assert.equal(
      rendered.host.querySelector("a[data-anchor-id=deep-linked-target]")?.getAttribute("aria-current"),
      "location",
    );
  } finally {
    await unmount(rendered);
    scrollContainer.remove();
    browserWindow.requestAnimationFrame = priorRequestAnimationFrame;
    browserWindow.cancelAnimationFrame = priorCancelAnimationFrame;
    browserWindow.history.replaceState(null, "", "/");
  }
});

test("Anchor ignores unrelated subtree updates but indexes dynamically added headings", async () => {
  const content = document.createElement("div");
  content.id = "mutation-anchor-content";
  content.innerHTML = "<h2>概览</h2>";
  document.body.append(content);
  const rendered = await mount(
    React.createElement(Anchor, { container: "#mutation-anchor-content", levels: [2, 3], mode: "static" }),
  );
  try {
    assert.equal(rendered.host.querySelectorAll("a[data-anchor-id]").length, 1);
    const unrelated = document.createElement("div");
    unrelated.textContent = "下拉选项更新";
    content.append(unrelated);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    assert.equal(rendered.host.querySelectorAll("a[data-anchor-id]").length, 1);

    const heading = document.createElement("h3");
    heading.textContent = "动态标题";
    content.append(heading);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    assert.equal(rendered.host.querySelectorAll("a[data-anchor-id]").length, 2);
    assert.match(heading.id, /^biu-anchor-/);
  } finally {
    await unmount(rendered);
    content.remove();
  }
});

test("Anchor follows an initial hash and keeps the active link visible", async () => {
  const content = document.createElement("div");
  content.id = "hash-anchor-content";
  content.innerHTML = "<h1 id='summary'>总览</h1><h2 id='details'>详情</h2>";
  document.body.append(content);
  browserWindow.history.pushState(null, "", "#details");
  const details = content.querySelector<HTMLElement>("#details")!;
  Object.defineProperty(details, "getBoundingClientRect", { value: () => ({ top: 120 }) });
  const rendered = await mount(
    React.createElement(Anchor, { container: "#hash-anchor-content", levels: [1, 2], mode: "static" }),
  );
  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    assert.equal(windowScrollCalls.at(-1)?.behavior, "auto");
    assert.equal(rendered.host.querySelector('a[data-anchor-id="details"]')?.getAttribute("aria-current"), "location");
  } finally {
    await unmount(rendered);
    content.remove();
    browserWindow.history.pushState(null, "", "/");
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

test("Anchor can place collapse controls at the far right", async () => {
  const content = document.createElement("div");
  content.id = "right-arrow-anchor-content";
  content.innerHTML = "<h1>总览</h1><h2>基础能力</h2>";
  document.body.append(content);
  const rendered = await mount(
    React.createElement(Anchor, {
      container: "#right-arrow-anchor-content",
      levels: [1, 2],
      collapsible: true,
      arrowPosition: "right",
      mode: "static",
    }),
  );
  try {
    const row = rendered.host.querySelector<HTMLElement>(".biu-ui-anchor__item-row");
    assert.ok(row?.lastElementChild?.classList.contains("biu-ui-anchor__node-toggle"));
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

test("ScrollProgress supports a custom label, label visibility and an always-visible back-top button", async () => {
  const scrollHost = document.createElement("div");
  Object.defineProperties(scrollHost, {
    clientHeight: { configurable: true, value: 200 },
    scrollHeight: { configurable: true, value: 1000 },
  });
  const rendered = await mount(
    React.createElement(ScrollProgress, {
      target: { current: scrollHost },
      label: "一段需要在有限空间内省略并支持查看完整内容的阅读进度说明",
      backTopMode: "always",
    }),
  );
  try {
    assert.ok(rendered.host.querySelector(".biu-ui-scroll-progress__label.biu-ui-ellipsis"));
    assert.ok(rendered.host.querySelector(".biu-ui-scroll-progress__button"));
    await unmount(rendered);
    const hiddenLabel = await mount(
      React.createElement(ScrollProgress, {
        target: { current: scrollHost },
        label: "隐藏的阅读进度说明",
        showLabel: false,
      }),
    );
    assert.equal(hiddenLabel.host.querySelector(".biu-ui-scroll-progress__label"), null);
    await unmount(hiddenLabel);
  } finally {
    if (document.body.contains(rendered.host)) await unmount(rendered);
  }
});

test("ScrollProgress mobileMode keeps only the percentage and back-to-top controls", async () => {
  const rendered = await mount(
    React.createElement(ScrollProgress, {
      mobileMode: true,
      label: "移动端不应展示的阅读说明",
      showPercentage: false,
      showBackTop: false,
      backTopMode: "always",
    }),
  );
  try {
    assert.equal(rendered.host.querySelector(".biu-ui-scroll-progress__label"), null);
    assert.equal(rendered.host.querySelector(".biu-ui-scroll-progress__progress"), null);
    assert.equal(rendered.host.querySelector(".biu-ui-scroll-progress__percentage")?.textContent, "0%");
    assert.ok(rendered.host.querySelector(".biu-ui-scroll-progress__button"));
    assert.ok(rendered.host.querySelector('[data-biu-scroll-progress-mobile="true"]'));
  } finally {
    await unmount(rendered);
  }
});
