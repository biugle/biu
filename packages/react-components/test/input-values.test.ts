import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { Slider, Switch, Textarea, TextField } from "../src/ui/index.js";
import { createTestDom } from "./fixtures/react-dom.js";

const { browserWindow, mount, unmount } = createTestDom("input");

test("Switch keeps the track text-free while preserving its accessible name", async () => {
  const rendered = await mount(
    React.createElement(Switch, {
      checked: true,
      checkedChildren: "开",
      unCheckedChildren: "关",
      "aria-label": "启用状态",
    }),
  );
  try {
    const switchNode = document.querySelector<HTMLButtonElement>('[role="switch"]');
    assert.ok(switchNode);
    assert.equal(switchNode.getAttribute("aria-label"), "启用状态");
    assert.equal(switchNode.textContent, "");
    assert.equal(switchNode.querySelector(".biu-ui-switch__track-content"), null);
    assert.equal(switchNode.querySelector(".biu-ui-switch__thumb") !== null, true);
  } finally {
    await unmount(rendered);
  }
});

test("Slider exposes single and range values with decimal-safe step metadata", async () => {
  const changes: Array<number | [number, number]> = [];
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(Slider, {
        value: 3.14,
        min: 0,
        max: 10,
        step: 0.01,
        marks: { 0: "0", 5: "5", 10: "10" },
        tooltip: "always",
        opacity: 0.75,
        onChange: (next) => changes.push(next),
      }),
      React.createElement(Slider, {
        range: true,
        defaultValue: [12, 28],
        min: -20,
        max: 45,
        step: 1,
        dots: true,
        tooltip: "hover",
      }),
    ),
  );
  try {
    const inputs = document.querySelectorAll<HTMLInputElement>('[data-biu-component="slider"] input[type="range"]');
    assert.equal(inputs.length, 3);
    assert.equal(inputs[0]?.value, "3.14");
    assert.equal(inputs[1]?.value, "12");
    assert.equal(inputs[2]?.value, "28");
    assert.equal(document.querySelectorAll(".biu-ui-slider__mark-label").length, 3);
    assert.equal(document.querySelectorAll(".biu-ui-slider__dot").length, 64);
    assert.equal(document.querySelectorAll(".biu-ui-slider__tooltip--always").length, 1);
    assert.equal(document.querySelectorAll(".biu-ui-slider__tooltip").length, 3);
    assert.equal(
      inputs[0]?.closest("[data-biu-component=slider]")?.getAttribute("style")?.includes("--biu-slider-opacity: 0.75"),
      true,
    );
  } finally {
    await unmount(rendered);
  }
});

test("Textarea resize changes the component frame and textarea together without a visible handle", async () => {
  const rendered = await mount(React.createElement(Textarea, { resize: "both", defaultValue: "可调整大小" }));
  try {
    const root = rendered.host.querySelector<HTMLElement>(".biu-ui-textarea");
    const control = rendered.host.querySelector<HTMLElement>(".biu-ui-textarea__control");
    const textarea = rendered.host.querySelector<HTMLTextAreaElement>("textarea");
    assert.ok(root);
    assert.ok(control);
    assert.ok(textarea);
    Object.defineProperty(control, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 0, top: 0, right: 320, bottom: 88, width: 320, height: 88 }),
    });
    Object.defineProperty(textarea, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 0, top: 0, right: 320, bottom: 88, width: 320, height: 88 }),
    });
    const pointerEvent = (type: string, clientX: number, clientY: number) => {
      const event = new browserWindow.MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY });
      Object.defineProperty(event, "pointerId", { configurable: true, value: 7 });
      Object.defineProperty(event, "button", { configurable: true, value: 0 });
      return event;
    };
    await act(async () => control.dispatchEvent(pointerEvent("pointerdown", 316, 84)));
    await act(async () => window.dispatchEvent(pointerEvent("pointermove", 380, 140)));
    await act(async () => window.dispatchEvent(pointerEvent("pointerup", 380, 140)));
    assert.equal(root.style.width, "384px");
    assert.equal(control.style.height, "144px");
    assert.equal(textarea.style.height, "144px");
    assert.equal(control.getAttribute("data-biu-resize"), "both");
    assert.ok(control.querySelector("[data-biu-resize-handle]"));
  } finally {
    await unmount(rendered);
  }
});

test("controlled TextField clear dispatches the normal change contract", async () => {
  let current = "Biu";
  const changes: string[] = [];
  const rendered = await mount(
    React.createElement(TextField, {
      value: current,
      allowClear: true,
      onChange: (event) => {
        current = event.target.value;
        changes.push(current);
      },
      onClear: () => changes.push("onClear"),
    }),
  );
  try {
    await act(async () => document.querySelector<HTMLButtonElement>(".biu-ui-textfield__clear")?.click());
    assert.deepEqual(changes, ["", "onClear"]);
  } finally {
    await unmount(rendered);
  }
});

test("TextField filters built-in input rules and custom incremental patterns", async () => {
  const numeric = await mount(React.createElement(TextField, { inputRule: "number", defaultValue: "" }));
  const letters = await mount(React.createElement(TextField, { inputRule: "letter", defaultValue: "" }));
  const alphanumeric = await mount(React.createElement(TextField, { inputRule: "alphanumeric", defaultValue: "" }));
  const custom = await mount(React.createElement(TextField, { inputPattern: /^[A-Z0-9-]*$/, defaultValue: "" }));
  try {
    const setValue = async (host: HTMLDivElement, value: string) => {
      const input = host.querySelector<HTMLInputElement>("input");
      assert.ok(input);
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, value);
      await act(async () => {
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      return input.value;
    };
    assert.equal(await setValue(numeric.host, "12a-3.4"), "1234");
    assert.equal(await setValue(letters.host, "Biu-组件-UI"), "BiuUI");
    assert.equal(await setValue(alphanumeric.host, "Biu-组件-2026!"), "Biu2026");
    assert.equal(await setValue(custom.host, "abC-12_中文"), "C-12");
    assert.equal(custom.host.querySelector<HTMLInputElement>("input")?.getAttribute("pattern"), "^[A-Z0-9-]*$");
    assert.equal(numeric.host.querySelector<HTMLInputElement>("input")?.getAttribute("pattern"), "(?:[0-9])*");
  } finally {
    await unmount(numeric);
    await unmount(letters);
    await unmount(alphanumeric);
    await unmount(custom);
  }
});
