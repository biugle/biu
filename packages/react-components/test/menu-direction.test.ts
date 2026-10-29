import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Menu } from "../src/ui/index.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  Node: dom.window.Node,
  Event: dom.window.Event,
  KeyboardEvent: dom.window.KeyboardEvent,
  MutationObserver: dom.window.MutationObserver,
  getComputedStyle: dom.window.getComputedStyle,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.assign(dom.window, {
  requestAnimationFrame: (callback: FrameRequestCallback) => dom.window.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => dom.window.clearTimeout(id),
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
}

test("Menu direction is opt-in and mirrors horizontal arrow navigation in RTL", async () => {
  const items = [
    { key: "first", label: "第一项" },
    { key: "second", label: "第二项" },
  ];
  const ltr = await mount(React.createElement("div", { dir: "rtl" }, React.createElement(Menu, { items })));
  try {
    assert.equal(ltr.host.querySelector(".biu-ui-menu")?.getAttribute("dir"), "ltr");
  } finally {
    await unmount(ltr);
  }

  const rtl = await mount(React.createElement(Menu, { items, dir: "rtl", mode: "horizontal" }));
  try {
    const menu = rtl.host.querySelector<HTMLElement>(".biu-ui-menu");
    const buttons = rtl.host.querySelectorAll<HTMLButtonElement>("[data-menu-item='true']");
    assert.equal(menu?.getAttribute("dir"), "rtl");
    assert.equal(buttons.length, 2);
    buttons[0]?.focus();
    await act(async () => buttons[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })));
    assert.equal(document.activeElement, buttons[1]);
    await act(async () =>
      buttons[1]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })),
    );
    assert.equal(document.activeElement, buttons[0]);
  } finally {
    await unmount(rtl);
  }
});
