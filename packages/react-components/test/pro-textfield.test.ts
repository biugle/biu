import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { act } from "react";
import type { Root } from "react-dom/client";
import { splitString } from "../src/pro/textfield/split-string.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
const browser = dom.window;
Object.assign(globalThis, {
  window: browser,
  document: browser.document,
  HTMLElement: browser.HTMLElement,
  Element: browser.Element,
  HTMLInputElement: browser.HTMLInputElement,
  HTMLTextAreaElement: browser.HTMLTextAreaElement,
  HTMLButtonElement: browser.HTMLButtonElement,
  SVGElement: browser.SVGElement,
  Node: browser.Node,
  NodeFilter: browser.NodeFilter,
  DocumentFragment: browser.DocumentFragment,
  Event: browser.Event,
  MouseEvent: browser.MouseEvent,
  KeyboardEvent: browser.KeyboardEvent,
  FocusEvent: browser.FocusEvent,
  CustomEvent: browser.CustomEvent,
  MutationObserver: browser.MutationObserver,
  getComputedStyle: browser.getComputedStyle,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: browser.navigator });
class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.assign(globalThis, {
  ResizeObserver: TestResizeObserver,
  requestAnimationFrame: (callback: FrameRequestCallback) => browser.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => browser.clearTimeout(id),
});
Object.assign(browser, {
  ResizeObserver: TestResizeObserver,
  requestAnimationFrame: globalThis.requestAnimationFrame,
  cancelAnimationFrame: globalThis.cancelAnimationFrame,
});
const { createRoot } = await import("react-dom/client");
const { ProTextField } = await import("../src/pro/textfield/pro-textfield.js");

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
function button(label: string) {
  const result = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (item) => item.textContent === label || item.getAttribute("aria-label") === label,
  );
  assert.ok(result, `Missing button: ${label}`);
  return result;
}
async function edit(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(input, value);
  await act(async () => input.dispatchEvent(new Event("input", { bubbles: true })));
}

test("splitString preserves phrases and duplicates while independently enabling whitespace and comma separators", () => {
  assert.deepEqual(splitString("Hello world\r\n\rThis is a test\nGood luck!"), [
    "Hello world",
    "This is a test",
    "Good luck!",
  ]);
  assert.deepEqual(splitString(" A, B，C \n\n A, B，C "), ["A, B，C", "A, B，C"]);
  assert.deepEqual(splitString(" A\t B　C\r\nD, E，F ", true), ["A", "B", "C", "D,", "E，F"]);
  assert.deepEqual(splitString(" A B, C， D\nE\rF ", false, true), ["A B", "C", "D", "E", "F"]);
  assert.deepEqual(splitString(" A\tB, C， D\nE\rF ", true, true), ["A", "B", "C", "D", "E", "F"]);
  for (const value of ["", " \t\r\n", null, 3]) assert.deepEqual(splitString(value as string, true, true), []);
});

test("batch edits are staged, cancel preserves the original, and Apply emits normalized text and parsed items once", async () => {
  const changes: Array<[string, string[]]> = [];
  const applications: Array<[string, string[]]> = [];
  let cancellations = 0;
  const rendered = await mount(
    React.createElement(ProTextField, {
      defaultValue: "original",
      separatorIncludesComma: true,
      onChange: (value, items) => changes.push([value, items]),
      onApply: (value, items) => {
        applications.push([value, items]);
      },
      onCancel: () => cancellations++,
    }),
  );
  try {
    await act(async () => button("批量输入").click());
    const textarea = document.querySelector<HTMLTextAreaElement>("textarea")!;
    assert.equal(document.activeElement, textarea);
    await edit(textarea, " North zone，South zone \r\n\n North zone ");
    assert.equal(changes.length, 0);
    assert.equal(document.querySelector('[role="status"]')?.textContent, "共 3 项");
    await act(async () => button("取消").click());
    assert.equal(cancellations, 1);
    assert.equal(rendered.host.querySelector("input")?.value, "original");
    assert.equal(applications.length, 0);

    await act(async () => button("批量输入").click());
    assert.equal(document.querySelector("textarea")?.value, "original");
    await edit(document.querySelector("textarea")!, " North zone，South zone\nNorth zone ");
    await act(async () => button("应用").click());
    assert.deepEqual(changes, [["North zone\nSouth zone\nNorth zone", ["North zone", "South zone", "North zone"]]]);
    assert.deepEqual(applications, changes);
    assert.equal(rendered.host.querySelector("input")?.value, "North zone, South zone, North zone");
    assert.equal(rendered.host.querySelector("input")?.readOnly, true);
    assert.equal(document.querySelector("textarea"), null);
  } finally {
    await unmount(rendered);
  }
});

test("direct input supports Form-style controlled values, native inputProps and ref without event adapters", async () => {
  const changes: Array<[string, string[]]> = [];
  const nativeChanges: string[] = [];
  const inputRef = React.createRef<HTMLInputElement>();
  let setControlled!: React.Dispatch<React.SetStateAction<string>>;
  function Controlled() {
    const [value, setValue] = React.useState("A");
    setControlled = setValue;
    return React.createElement(ProTextField, {
      ref: inputRef,
      value,
      separatorIncludesComma: true,
      name: "keywords",
      onChange: (next, items) => {
        changes.push([next, items]);
        setValue(next);
      },
      inputProps: { "aria-label": "keywords", onChange: (event) => nativeChanges.push(event.currentTarget.value) },
    });
  }
  const rendered = await mount(React.createElement(Controlled));
  try {
    const input = rendered.host.querySelector<HTMLInputElement>("input")!;
    assert.equal(inputRef.current, input);
    assert.equal(input.getAttribute("name"), "keywords");
    assert.equal(input.getAttribute("aria-label"), "keywords");
    await edit(input, "A，B");
    assert.deepEqual(changes, [["A，B", ["A", "B"]]]);
    assert.deepEqual(nativeChanges, ["A，B"]);
    await act(async () => setControlled("external\nupdate"));
    assert.equal(input.value, "external, update");
    await act(async () => button("清除").click());
    assert.equal(input.value, "");
    assert.deepEqual(changes.at(-1), ["", []]);
  } finally {
    await unmount(rendered);
  }
});

test("multiline paste preserves line boundaries in the draft and only applies after confirmation", async () => {
  const changes: string[] = [];
  const rendered = await mount(React.createElement(ProTextField, { onChange: (next) => changes.push(next) }));
  try {
    const input = rendered.host.querySelector("input")!;
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "A\r\nB\nC" } });
    await act(async () => input.dispatchEvent(event));
    assert.equal(event.defaultPrevented, true);
    assert.equal(document.querySelector("textarea")?.value, "A\nB\nC");
    assert.deepEqual(changes, []);
    await act(async () => button("应用").click());
    assert.deepEqual(changes, ["A\nB\nC"]);
  } finally {
    await unmount(rendered);
  }
});

test("Apply veto and asynchronous failure retain drafts; keyboard Apply is protected from duplicate submissions", async () => {
  const changes: string[] = [];
  let behavior: "veto" | "fail" | "pending" = "veto";
  let release!: () => void;
  let applications = 0;
  const rendered = await mount(
    React.createElement(ProTextField, {
      defaultValue: "old",
      onChange: (next) => changes.push(next),
      onApply: async () => {
        applications++;
        if (behavior === "veto") return false;
        if (behavior === "fail") throw new Error("server rejected");
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      },
    }),
  );
  try {
    await act(async () => button("批量输入").click());
    await edit(document.querySelector("textarea")!, "new");
    await act(async () => button("应用").click());
    assert.equal(document.querySelector("textarea")?.value, "new");
    assert.deepEqual(changes, []);
    behavior = "fail";
    await act(async () => button("应用").click());
    assert.equal(document.querySelector('[role="alert"]')?.textContent, "应用失败，请重试");
    behavior = "pending";
    await act(async () => {
      const textarea = document.querySelector("textarea")!;
      textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true }));
      textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true }));
    });
    assert.equal(applications, 3);
    assert.equal(button("取消").disabled, true);
    await act(async () => release());
    assert.deepEqual(changes, ["new"]);
    assert.equal(document.querySelector("textarea"), null);
  } finally {
    await unmount(rendered);
  }
});

test("draft Clear is reversible, while accepted clearing invokes onChange and onClear once", async () => {
  const changes: string[] = [];
  let clears = 0;
  const rendered = await mount(
    React.createElement(ProTextField, {
      defaultValue: "A\nB",
      onChange: (next) => changes.push(next),
      onClear: () => clears++,
    }),
  );
  try {
    await act(async () => button("批量输入").click());
    const draftClear = [...document.querySelectorAll<HTMLButtonElement>(".biu-pro-textfield__editor button")].find(
      (item) => item.textContent === "清除",
    )!;
    await act(async () => draftClear.click());
    assert.equal(document.querySelector("textarea")?.value, "");
    assert.equal(clears, 0);
    await act(async () => button("取消").click());
    assert.equal(rendered.host.querySelector("input")?.value, "A, B");
    await act(async () => button("批量输入").click());
    await act(async () =>
      [...document.querySelectorAll<HTMLButtonElement>(".biu-pro-textfield__editor button")]
        .find((item) => item.textContent === "清除")!
        .click(),
    );
    await act(async () => button("应用").click());
    assert.deepEqual(changes, [""]);
    assert.equal(clears, 1);
  } finally {
    await unmount(rendered);
  }
});

test("readOnly and disabled prohibit batch editing and clearing; localeText can override Chinese-key resources", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(ProTextField, { defaultValue: "A\nB", readOnly: true, locale: "en-US" }),
      React.createElement(ProTextField, { defaultValue: "C", disabled: true }),
      React.createElement(ProTextField, { locale: "en-US", localeText: { 批量输入: "Custom editor", 应用: "Save" } }),
    ),
  );
  try {
    const controls = rendered.host.querySelectorAll('[data-biu-component="pro-textfield"]');
    assert.equal(controls[0]?.querySelector("input")?.readOnly, true);
    assert.equal(controls[0]?.querySelector("button")?.disabled, true);
    assert.equal(controls[1]?.querySelector("input")?.disabled, true);
    assert.equal(controls[1]?.querySelector("button")?.disabled, true);
    await act(async () => button("Custom editor").click());
    assert.ok(button("Save"));
    assert.match(document.querySelector(".biu-pro-textfield__description")?.textContent ?? "", /line breaks/);
  } finally {
    await unmount(rendered);
  }
});

test("batch parsing uses the same character constraints as direct input", async () => {
  const changes: Array<[string, string[]]> = [];
  const rendered = await mount(
    React.createElement(ProTextField, {
      inputRule: "number",
      separatorIncludesComma: true,
      onChange: (next, items) => changes.push([next, items]),
    }),
  );
  try {
    await edit(rendered.host.querySelector("input")!, "A12-B");
    assert.deepEqual(changes.at(-1), ["12", ["12"]]);
    await act(async () => button("批量输入").click());
    await edit(document.querySelector("textarea")!, "ID-001，ID-002\nletters\nID-001");
    assert.equal(document.querySelector('[role="status"]')?.textContent, "共 3 项");
    await act(async () => button("应用").click());
    assert.deepEqual(changes.at(-1), ["001\n002\n001", ["001", "002", "001"]]);
  } finally {
    await unmount(rendered);
  }
});

test("direct input preserves enabled separators while applying the same per-item filters as batch edits", async () => {
  for (const options of [
    { inputRule: "number" as const, raw: "ID-001，ID-002,ID-003", expected: ["001", "002", "003"], space: false },
    {
      inputPattern: /^[A-Z0-9-]*$/,
      raw: "ID-001，ID-002 ID-003",
      expected: ["ID-001", "ID-002", "ID-003"],
      space: true,
    },
  ]) {
    const changes: Array<[string, string[]]> = [];
    const rendered = await mount(
      React.createElement(ProTextField, {
        inputRule: options.inputRule,
        inputPattern: options.inputPattern,
        separatorIncludesComma: true,
        separatorIncludesSpace: options.space,
        onChange: (next, items) => changes.push([next, items]),
      }),
    );
    try {
      await edit(rendered.host.querySelector("input")!, options.raw);
      assert.deepEqual(changes.at(-1)?.[1], options.expected);
      assert.ok(changes.at(-1)?.[0].includes("，"));
      await act(async () => button("批量输入").click());
      await edit(document.querySelector("textarea")!, options.raw);
      await act(async () => button("应用").click());
      assert.deepEqual(changes.at(-1), [options.expected.join("\n"), options.expected]);
    } finally {
      await unmount(rendered);
    }
  }
});

test("collapsed direct input splits and formats enabled separators on blur", async () => {
  const changes: Array<[string, string[]]> = [];
  const blurOrder: string[] = [];
  const rendered = await mount(
    React.createElement(ProTextField, {
      separatorIncludesComma: true,
      onChange: (value, items) => changes.push([value, items]),
      onBlur: () => blurOrder.push("field"),
      inputProps: { onBlur: () => blurOrder.push("native") },
    }),
  );
  try {
    const input = rendered.host.querySelector<HTMLInputElement>("input")!;
    await edit(input, " Alpha , , Beta，Gamma ");
    assert.equal(document.querySelector("textarea"), null);
    await act(async () => input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
    assert.deepEqual(blurOrder, ["field", "native"]);
    assert.equal(input.value, "Alpha, Beta, Gamma");
    assert.deepEqual(changes.at(-1), ["Alpha, Beta, Gamma", ["Alpha", "Beta", "Gamma"]]);
    assert.equal(document.querySelector("textarea"), null);
  } finally {
    await unmount(rendered);
  }
});

test("inline actions reserve a visible gap after button focus and hover rings", () => {
  const styles = readFileSync(new URL("../src/pro/textfield/styles.css", import.meta.url), "utf8");
  assert.match(styles, /padding-inline:\s*2px\s+4px;/);
});

test("disabling a field during asynchronous Apply cancels the outstanding commit", async () => {
  const changes: string[] = [];
  let release!: () => void;
  const base = {
    defaultValue: "old",
    onChange: (next: string) => changes.push(next),
    onApply: () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  };
  const rendered = await mount(React.createElement(ProTextField, base));
  try {
    await act(async () => button("批量输入").click());
    await edit(document.querySelector("textarea")!, "new");
    await act(async () => button("应用").click());
    await act(async () => rendered.root.render(React.createElement(ProTextField, { ...base, disabled: true })));
    await act(async () => release());
    assert.deepEqual(changes, []);
    assert.equal(rendered.host.querySelector("input")?.value, "old");
    assert.equal(document.querySelector("textarea"), null);
  } finally {
    await unmount(rendered);
  }
});
