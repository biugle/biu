import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { InputNumber } from "../src/ui/index.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
const browserWindow = dom.window;
Object.assign(globalThis, {
  window: browserWindow,
  document: browserWindow.document,
  HTMLElement: browserWindow.HTMLElement,
  Element: browserWindow.Element,
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
  Node: browserWindow.Node,
  Event: browserWindow.Event,
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

test("InputNumber supports composable numeric constraints and rejects non-numeric patterns", async () => {
  const rendered = await mount(React.createElement(InputNumber, { "aria-label": "数字回归" }));
  const integer = await mount(React.createElement(InputNumber, { integer: true, "aria-label": "整数回归" }));
  const positive = await mount(
    React.createElement(InputNumber, { integer: true, sign: "positive", "aria-label": "正整数回归" }),
  );
  try {
    const input = rendered.host.querySelector<HTMLInputElement>('input[role="spinbutton"]');
    const integerInput = integer.host.querySelector<HTMLInputElement>('input[role="spinbutton"]');
    const positiveInput = positive.host.querySelector<HTMLInputElement>('input[role="spinbutton"]');
    assert.ok(input);
    assert.ok(integerInput);
    assert.ok(positiveInput);
    const pattern = new RegExp(input.getAttribute("pattern") ?? "");
    const integerPattern = new RegExp(integerInput.getAttribute("pattern") ?? "");
    const positivePattern = new RegExp(positiveInput.getAttribute("pattern") ?? "");
    const validCases = Array.from({ length: 1000 }, (_, index) => {
      const fraction = `${String(index).padStart(3, "0")}1`;
      const sign = index % 2 === 0 ? "" : "-";
      return index % 5 === 0 ? `${sign}.${fraction}` : `${sign}${index + 1}.${fraction}`;
    });
    assert.equal(
      validCases.every((value) => pattern.test(value)),
      true,
    );
    assert.equal(pattern.test("0.0001"), true);
    assert.equal(pattern.test("00.001"), true);
    assert.equal(pattern.test("0.000"), true);
    assert.equal(pattern.test("0.0100"), true);
    assert.equal(pattern.test("0"), true);
    assert.equal(pattern.test("-0.0001"), true);
    assert.equal(pattern.test("12a.3"), false);
    assert.equal(pattern.test("1.2.3"), false);
    assert.equal(pattern.test("--1"), false);
    assert.equal(integerPattern.test("12"), true);
    assert.equal(integerPattern.test("12.3"), false);
    assert.equal(positivePattern.test("12"), true);
    assert.equal(positivePattern.test("-12"), false);

    const normalizedCases = new Map([
      ["00.001", "0.001"],
      ["0.000", "0"],
      ["0.0100", "0.01"],
      ["0000", "0"],
      ["-.1", "-0.1"],
      [".0", "0"],
      ["0100", "100"],
      ["001", "1"],
      ["-01", "-1"],
      ["-00", "0"],
    ]);
    for (const [value, expected] of normalizedCases) {
      const normalized = await mount(React.createElement(InputNumber, { defaultValue: value, "aria-label": value }));
      try {
        const normalizedInput = normalized.host.querySelector<HTMLInputElement>('input[role="spinbutton"]');
        assert.ok(normalizedInput);
        await act(async () => {
          normalizedInput.focus();
          normalizedInput.blur();
        });
        assert.equal(normalizedInput.value, expected, value);
      } finally {
        await unmount(normalized);
      }
    }

    const formatted = await mount(
      React.createElement(InputNumber, {
        defaultValue: "1234.5",
        thousandSeparator: true,
        "aria-label": "千分位回归",
      }),
    );
    const european = await mount(
      React.createElement(InputNumber, {
        defaultValue: "1234.5",
        thousandSeparator: ".",
        decimalSeparator: ",",
        "aria-label": "本地化分隔符回归",
      }),
    );
    try {
      assert.equal(formatted.host.querySelector<HTMLInputElement>('input[role="spinbutton"]')?.value, "1,234.5");
      assert.equal(european.host.querySelector<HTMLInputElement>('input[role="spinbutton"]')?.value, "1.234,5");
    } finally {
      await unmount(formatted);
      await unmount(european);
    }
  } finally {
    await unmount(rendered);
    await unmount(integer);
    await unmount(positive);
  }
});

test("InputNumber enforces JavaScript safe range and precision without replacing the last valid value", async () => {
  const changes: Array<number | string | undefined> = [];
  const rendered = await mount(
    React.createElement(InputNumber, {
      defaultValue: "12.5",
      "aria-label": "安全数值",
      onChange: (next) => changes.push(next),
    }),
  );
  const controlledChanges: Array<number | string | undefined> = [];
  const parserChanges: Array<number | string | undefined> = [];
  const controlled = await mount(
    React.createElement(InputNumber, {
      value: "1",
      stringMode: true,
      "aria-label": "受控安全数值",
      onChange: (next) => controlledChanges.push(next),
    }),
  );
  const configured = await mount(
    React.createElement(InputNumber, { decimal: 20, defaultValue: "1", "aria-label": "配置精度上限" }),
  );
  const parsed = await mount(
    React.createElement(InputNumber, {
      defaultValue: "1",
      parser: (source) => Number(source),
      "aria-label": "解析器安全精度",
      onChange: (next) => parserChanges.push(next),
    }),
  );
  const belowSafeInteger = await mount(
    React.createElement(InputNumber, { defaultValue: "9007199254740990", "aria-label": "最大安全整数前一位" }),
  );
  try {
    const input = rendered.host.querySelector<HTMLInputElement>('input[role="spinbutton"]');
    const controlledInput = controlled.host.querySelector<HTMLInputElement>('input[role="spinbutton"]');
    const configuredInput = configured.host.querySelector<HTMLInputElement>('input[role="spinbutton"]');
    const parsedInput = parsed.host.querySelector<HTMLInputElement>('input[role="spinbutton"]');
    const belowInput = belowSafeInteger.host.querySelector<HTMLInputElement>('input[role="spinbutton"]');
    assert.ok(input);
    assert.ok(controlledInput);
    assert.ok(configuredInput);
    assert.ok(parsedInput);
    assert.ok(belowInput);
    assert.equal(input.getAttribute("aria-valuemax"), String(Number.MAX_SAFE_INTEGER));
    assert.equal(configuredInput.getAttribute("pattern")?.includes("{0,15}"), true);
    assert.equal(belowInput.value, "9007199254740990");

    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    const setInputValue = async (target: HTMLInputElement, next: string) => {
      setter?.call(target, next);
      const propsKey = Object.keys(target).find((key) => key.startsWith("__reactProps$"));
      assert.ok(propsKey, "React should attach the input event props");
      const reactProps = (
        target as unknown as Record<string, { onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void }>
      )[propsKey];
      assert.ok(reactProps?.onChange, "InputNumber should expose its change handler");
      await act(async () => {
        reactProps.onChange?.({ target, currentTarget: target } as unknown as React.ChangeEvent<HTMLInputElement>);
      });
    };
    await setInputValue(input, "9007199254740992");
    assert.equal(input.value, "9007199254740992");
    assert.equal(input.getAttribute("aria-invalid"), "true");
    assert.match(rendered.host.textContent ?? "", /超出安全范围/);
    assert.equal(changes.length, 0);

    await setInputValue(input, "12.1234567890123456");
    assert.equal(input.value, "12.1234567890123456");
    assert.match(rendered.host.textContent ?? "", /最多15位/);
    assert.equal(changes.length, 0);

    await setInputValue(input, "0.123456789012345");
    assert.equal(input.getAttribute("aria-invalid"), "false");
    assert.equal(changes.at(-1), 0.123456789012345);

    await setInputValue(input, "12345.123456789011");
    assert.equal(input.getAttribute("aria-invalid"), "false");
    assert.equal(changes.at(-1), 12345.123456789011);

    await setInputValue(input, "12345.123456789012");
    assert.equal(input.getAttribute("aria-invalid"), "true");
    assert.match(rendered.host.textContent ?? "", /转换后不能舍入/);
    assert.equal(changes.length, 2);

    await setInputValue(input, "0.1234567890123450");
    assert.equal(input.value, "0.1234567890123450");
    assert.match(rendered.host.textContent ?? "", /最多15位/);
    assert.equal(changes.length, 2);

    await setInputValue(configuredInput, "0.1234567890123456");
    assert.equal(configuredInput.value, "0.1234567890123456");
    assert.match(configured.host.textContent ?? "", /最多15位/);

    await setInputValue(parsedInput, "1.0000000000000001");
    assert.equal(parsedInput.value, "1.0000000000000001");
    assert.match(parsed.host.textContent ?? "", /最多15位/);
    assert.equal(parserChanges.length, 0);

    await setInputValue(controlledInput, "0.1234567890123456");
    assert.equal(controlledChanges.length, 0);
    assert.match(controlled.host.textContent ?? "", /最多15位/);

    await setInputValue(input, String(Number.MAX_SAFE_INTEGER));
    assert.equal(input.getAttribute("aria-invalid"), "false");
    assert.equal(changes.at(-1), Number.MAX_SAFE_INTEGER);
  } finally {
    await unmount(rendered);
    await unmount(controlled);
    await unmount(configured);
    await unmount(parsed);
    await unmount(belowSafeInteger);
  }
});

test("InputNumber clamps decimal configuration and bounds above the JavaScript safe integer range", async () => {
  const changes: Array<number | string | undefined> = [];
  const rendered = await mount(
    React.createElement(InputNumber, {
      min: -Number.MAX_SAFE_INTEGER * 10,
      max: Number.MAX_SAFE_INTEGER * 10,
      step: Number.MAX_SAFE_INTEGER * 10,
      defaultValue: Number.MAX_SAFE_INTEGER,
      "aria-label": "边界步进",
      onChange: (next) => changes.push(next),
    }),
  );
  try {
    const input = rendered.host.querySelector<HTMLInputElement>('input[role="spinbutton"]');
    const increment = rendered.host.querySelector<HTMLButtonElement>('button[aria-label="增加"]');
    assert.ok(input);
    assert.ok(increment);
    assert.equal(input.getAttribute("aria-valuemin"), String(-Number.MAX_SAFE_INTEGER));
    assert.equal(input.getAttribute("aria-valuemax"), String(Number.MAX_SAFE_INTEGER));
    assert.equal(increment.disabled, true);
    await act(async () => increment.click());
    assert.equal(changes.length, 0);
  } finally {
    await unmount(rendered);
  }
});

test("InputNumber uses decimal-safe arithmetic for controls, keyboard and wheel steps", async () => {
  const controlledValues: Array<number | string | undefined> = [];
  const rendered = await mount(
    React.createElement(InputNumber, {
      defaultValue: "3.14",
      step: 1,
      "aria-label": "浮点步进回归",
      onChange: (next) => controlledValues.push(next),
    }),
  );
  const tenth = await mount(
    React.createElement(InputNumber, { defaultValue: 0.1, step: 0.2, "aria-label": "十进制步进回归" }),
  );
  const keyboard = await mount(
    React.createElement(InputNumber, { defaultValue: 1.2, step: 0.1, "aria-label": "键盘步进回归" }),
  );
  try {
    const increment = rendered.host.querySelector<HTMLButtonElement>('button[aria-label="增加"]');
    const tenthIncrement = tenth.host.querySelector<HTMLButtonElement>('button[aria-label="增加"]');
    const keyboardInput = keyboard.host.querySelector<HTMLInputElement>('input[role="spinbutton"]');
    assert.ok(increment);
    assert.ok(tenthIncrement);
    assert.ok(keyboardInput);

    await act(async () => increment.click());
    assert.equal(rendered.host.querySelector<HTMLInputElement>('input[role="spinbutton"]')?.value, "4.14");
    assert.equal(controlledValues.at(-1), 4.14);

    await act(async () => tenthIncrement.click());
    assert.equal(tenth.host.querySelector<HTMLInputElement>('input[role="spinbutton"]')?.value, "0.3");

    await act(async () => {
      keyboardInput.focus();
      keyboardInput.dispatchEvent(new browserWindow.KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" }));
    });
    assert.equal(keyboard.host.querySelector<HTMLInputElement>('input[role="spinbutton"]')?.value, "1.3");
  } finally {
    await unmount(rendered);
    await unmount(tenth);
    await unmount(keyboard);
  }
});

test("InputNumber keeps controlled thousand-separated decimal steps exact", async () => {
  function ControlledFormattedInput() {
    const [value, setValue] = React.useState<number | string>(3.14);
    return React.createElement(InputNumber, {
      value,
      thousandSeparator: true,
      "aria-label": "受控千分位步进回归",
      onChange: (next) => setValue(next ?? ""),
    });
  }

  const rendered = await mount(React.createElement(ControlledFormattedInput));
  try {
    const increment = rendered.host.querySelector<HTMLButtonElement>('button[aria-label="增加"]');
    const input = rendered.host.querySelector<HTMLInputElement>('input[role="spinbutton"]');
    assert.ok(increment);
    assert.ok(input);
    assert.equal(input.value, "3.14");
    await act(async () => increment.click());
    assert.equal(input.value, "4.14");
  } finally {
    await unmount(rendered);
  }
});
