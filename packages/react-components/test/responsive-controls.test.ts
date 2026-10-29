import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { CopyText, RangeTimePicker, Select, Slider, Transfer } from "../src/index.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
const browserWindow = dom.window;
Object.assign(globalThis, {
  document: browserWindow.document,
  window: browserWindow,
  HTMLElement: browserWindow.HTMLElement,
  HTMLButtonElement: browserWindow.HTMLButtonElement,
  HTMLInputElement: browserWindow.HTMLInputElement,
  HTMLTextAreaElement: browserWindow.HTMLTextAreaElement,
  HTMLSelectElement: browserWindow.HTMLSelectElement,
  HTMLIFrameElement: browserWindow.HTMLIFrameElement,
  DocumentFragment: browserWindow.DocumentFragment,
  NodeFilter: browserWindow.NodeFilter,
  KeyboardEvent: browserWindow.KeyboardEvent,
  MouseEvent: browserWindow.MouseEvent,
  PointerEvent: browserWindow.PointerEvent ?? browserWindow.MouseEvent,
  Element: browserWindow.Element,
  Event: browserWindow.Event,
  Node: browserWindow.Node,
  CustomEvent: browserWindow.CustomEvent,
  MutationObserver: browserWindow.MutationObserver,
  getComputedStyle: browserWindow.getComputedStyle,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: browserWindow.navigator });
class TestResizeObserver {
  observe() {}
  disconnect() {}
}
Object.assign(browserWindow, {
  ResizeObserver: TestResizeObserver,
  requestAnimationFrame: (callback: FrameRequestCallback) => browserWindow.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => browserWindow.clearTimeout(id),
});
Object.assign(globalThis, { ResizeObserver: TestResizeObserver });
Object.assign(globalThis, {
  requestAnimationFrame: (callback: FrameRequestCallback) => browserWindow.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => browserWindow.clearTimeout(id),
});
Object.assign(browserWindow.HTMLElement.prototype, {
  attachEvent() {},
  detachEvent() {},
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

test("RangeTimePicker marks its portaled panel for a contained narrow-screen layout", async () => {
  const rendered = await mount(React.createElement(RangeTimePicker, { open: true, format: "HH:mm:ss" }));
  try {
    const panel = document.querySelector(".biu-ui-date-picker__content--range-time");
    assert.ok(panel);
    assert.equal(panel.querySelectorAll(".biu-ui-date-picker__time").length, 2);
    assert.ok(panel.querySelector(".biu-ui-date-picker__time-range-separator"));
    const styles = readFileSync(new URL("../src/ui/date-picker/styles.css", import.meta.url), "utf8");
    assert.match(
      styles,
      /\.biu-ui-date-picker__content\s*\{[^}]*max-height:[^;]*var\(--radix-popover-content-available-height, 520px\)[^}]*overflow-y:\s*auto/s,
    );
    assert.match(
      styles,
      /@media \(max-width: 560px\)[\s\S]*?\.biu-ui-date-picker__content--range-time \.biu-ui-date-picker__time-range\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/s,
    );
    assert.match(
      styles,
      /\.biu-ui-date-picker__panel-main:has\(\.biu-ui-date-picker__time-range\)\s*\{[^}]*box-sizing:\s*border-box;[^}]*min-width:\s*min\(546px, calc\(100vw - 92px\)\)/s,
    );
    assert.match(styles, /\.biu-ui-date-picker__content--range-time\s*\{[^}]*overflow-x:\s*hidden/s);
  } finally {
    await unmount(rendered);
  }
});

test("Switch stylesheet prevents the thumb from shrinking away from a circle", () => {
  const styles = readFileSync(new URL("../src/ui/switch/styles.css", import.meta.url), "utf8");
  assert.match(
    styles,
    /\.biu-ui-switch__thumb\s*\{[^}]*flex:\s*0 0 18px;[^}]*min-width:\s*18px;[^}]*aspect-ratio:\s*1\s*\/\s*1;/s,
  );
  assert.match(styles, /\.biu-ui-switch\s*\{[^}]*flex:\s*0 0 auto;[^}]*min-width:\s*42px;/s);
  assert.match(styles, /\.biu-ui-switch--checked \.biu-ui-switch__thumb\s*\{[^}]*translateX\(16px\)/s);
  assert.match(
    styles,
    /\.biu-ui-switch--small\.biu-ui-switch--checked \.biu-ui-switch__thumb\s*\{[^}]*translateX\(12px\)/s,
  );
  assert.match(
    styles,
    /\.biu-ui-switch--large\.biu-ui-switch--checked \.biu-ui-switch__thumb\s*\{[^}]*translateX\(20px\)/s,
  );
});

test("touch layouts expose hover-only actions and stack narrow Transfer panels with compact controls", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(CopyText, { text: "复制值", copyOnHover: true }),
      React.createElement(Slider, { value: 35 }),
      React.createElement(Transfer, {
        source: [{ label: "平台", value: "platform" }],
        defaultTarget: [{ label: "组件", value: "component" }],
      }),
    ),
  );
  try {
    assert.ok(rendered.host.querySelector(".biu-ui-copy-text--hover .biu-ui-copy-text__button"));
    assert.ok(rendered.host.querySelector(".biu-ui-slider__tooltip"));
    assert.equal(rendered.host.querySelectorAll(".biu-ui-transfer__layout > .biu-ui-transfer__list").length, 2);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-transfer__operations button").length, 2);

    const copyStyles = readFileSync(new URL("../src/ui/copy-text/styles.css", import.meta.url), "utf8");
    const sliderStyles = readFileSync(new URL("../src/ui/slider/styles.css", import.meta.url), "utf8");
    const transferStyles = readFileSync(new URL("../src/ui/transfer/styles.css", import.meta.url), "utf8");
    assert.match(
      copyStyles,
      /@media \(hover: none\), \(pointer: coarse\)[\s\S]*?opacity:\s*1;[\s\S]*?pointer-events:\s*auto;/,
    );
    assert.match(sliderStyles, /\.biu-ui-slider__input:active\s*~\s*\.biu-ui-slider__tooltip/);
    assert.match(transferStyles, /container-type:\s*inline-size/);
    assert.match(
      transferStyles,
      /@media \(max-width: 640px\)[\s\S]*?\.biu-ui-transfer__layout\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s,
    );
    assert.match(transferStyles, /\.biu-ui-transfer__operations\s*\{[^}]*flex-direction:\s*row/s);
    assert.ok(rendered.host.querySelector(".biu-ui-transfer__operation-icon--desktop svg"));
    assert.ok(rendered.host.querySelector(".biu-ui-transfer__operation-icon--mobile svg"));
    assert.match(
      transferStyles,
      /@container \(max-width: 480px\)[\s\S]*?\.biu-ui-transfer__operations\s*\{[^}]*flex-direction:\s*row/s,
    );
  } finally {
    await unmount(rendered);
  }
});

test("Select responsive maxTagCount keeps the first short tag readable and preserves the purple +N badge", async () => {
  for (const [width, visibleCount] of [
    [80, 0],
    [128, 1],
    [160, 1],
    [220, 1],
    [272, 2],
  ] as const) {
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    try {
      HTMLElement.prototype.getBoundingClientRect = function () {
        const rect = originalGetBoundingClientRect.call(this);
        if (!this.classList.contains("biu-ui-select__trigger")) return rect;
        return {
          x: rect.x,
          y: rect.y,
          width,
          height: rect.height,
          top: rect.top,
          right: rect.left + width,
          bottom: rect.bottom,
          left: rect.left,
          toJSON: () => ({}),
        } as DOMRect;
      };

      const rendered = await mount(
        React.createElement(Select, {
          mode: "multiple",
          defaultValue: ["short", "two", "three", "four"],
          maxTagCount: "responsive",
          options: [
            { value: "short", label: "短" },
            { value: "two", label: "第二个较长标签" },
            { value: "three", label: "第三个较长标签" },
            { value: "four", label: "第四个较长标签" },
          ],
        }),
      );
      try {
        assert.equal(
          rendered.host.querySelectorAll(".biu-ui-select__tag:not(.biu-ui-select__more-tag)").length,
          visibleCount,
        );
        assert.equal(rendered.host.querySelector(".biu-ui-select__more-tag")?.textContent, `+${4 - visibleCount}`);
        if (visibleCount > 0) {
          assert.match(
            rendered.host.querySelector(".biu-ui-select__tag:not(.biu-ui-select__more-tag)")?.textContent ?? "",
            /短/,
          );
        }
        if (visibleCount === 0) assert.equal(rendered.host.querySelector(".biu-ui-select__value")?.textContent, "");
        const styles = readFileSync(new URL("../src/ui/select/styles.css", import.meta.url), "utf8");
        assert.match(
          styles,
          /\.biu-ui-select__more-tag\s*\{[^}]*flex:\s*0 0 auto;[^}]*min-width:\s*max-content;[^}]*color:\s*#7e22ce/s,
        );
        assert.match(styles, /\.biu-ui-select\s*\{[^}]*min-width:\s*min\(160px, 100%\)/s);
        assert.match(
          styles,
          /@container \(max-width: 128px\)[\s\S]*?\.biu-ui-select__trigger\s*\{[^}]*gap:\s*4px;[^}]*padding-inline:\s*6px/s,
        );
      } finally {
        await unmount(rendered);
      }
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    }
  }
});
