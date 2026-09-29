import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import dayjs from "dayjs";
import {
  DatePicker,
  RangeDatePicker,
  RangeTimePicker,
  Select,
  Switch,
  Textarea,
  TextField,
  TimePicker,
} from "../src/ui/index.js";

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

test("Select emits value, option and source option index, and supports all selection", async () => {
  const changes: Array<{
    value: string | string[] | undefined;
    option?: { value: string } | { value: string }[];
    index?: number;
  }> = [];
  const rendered = await mount(
    React.createElement(Select, {
      mode: "multiple",
      hasAllOption: true,
      allowAllSelect: true,
      allOption: { label: "全部项目", value: "all" },
      searchable: true,
      options: [
        { label: "平台", value: "platform" },
        { label: "禁用项", value: "disabled", disabled: true },
        { label: "运营", value: "operations" },
      ],
      optionRender: (option, index) =>
        React.createElement("span", { className: "custom-option" }, `${String(option.label)}-${index}`),
      onChange: (value, option, index) =>
        changes.push({ value, option: option as { value: string } | { value: string }[], index }),
    }),
  );
  try {
    const trigger = document.querySelector<HTMLElement>(".biu-ui-select__trigger");
    assert.ok(trigger);
    await act(async () => trigger.click());
    assert.ok(document.querySelector(".biu-ui-select__search"));
    const options = document.querySelectorAll<HTMLButtonElement>(".biu-ui-select__option");
    assert.equal(options.length, 4);
    assert.equal(options[1]?.querySelector(".custom-option")?.textContent, "平台-1");

    await act(async () => options[1]?.click());
    assert.deepEqual(changes.at(-1), { value: ["platform"], option: { label: "平台", value: "platform" }, index: 1 });

    await act(async () => options[0]?.click());
    assert.deepEqual(changes.at(-1), {
      value: ["platform", "operations"],
      option: { label: "全部项目", value: "all" },
      index: 0,
    });
    assert.equal(options[0]?.getAttribute("aria-selected"), "true");

    await act(async () => options[0]?.click());
    assert.deepEqual(changes.at(-1), {
      value: [],
      option: { label: "全部项目", value: "all" },
      index: 0,
    });
    assert.equal(options[0]?.getAttribute("aria-selected"), "false");
  } finally {
    await unmount(rendered);
  }
});

test("Select supports custom tags, keyboard open/clear and lazy loading", async () => {
  let loaded = 0;
  const changes: Array<string | string[] | undefined> = [];
  const rendered = await mount(
    React.createElement(Select, {
      mode: "multiple",
      defaultValue: ["a"],
      searchable: true,
      allowClear: true,
      hasMore: true,
      onLoadMore: async () => {
        loaded += 1;
      },
      options: [
        { label: "Alpha", value: "a" },
        { label: "Beta", value: "b" },
      ],
      tagRender: (option, onClose) =>
        React.createElement(
          "span",
          { className: "custom-tag" },
          option.label,
          React.createElement(
            "button",
            {
              type: "button",
              onClick: (event) => {
                event.stopPropagation();
                onClose();
              },
            },
            "×",
          ),
        ),
      onChange: (value) => changes.push(value),
    }),
  );
  try {
    const trigger = document.querySelector<HTMLElement>(".biu-ui-select__trigger");
    assert.ok(trigger);
    await act(async () => trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    assert.equal(document.querySelector(".biu-ui-select")?.getAttribute("data-state"), "open");
    assert.ok(document.querySelector(".custom-tag button"));

    await act(async () => document.querySelector<HTMLButtonElement>(".custom-tag button")?.click());
    assert.deepEqual(changes.at(-1), []);
    assert.equal(document.querySelector(".custom-tag"), null);

    const option =
      document.querySelector<HTMLButtonElement>('.biu-ui-select__option[value="b"]') ??
      document.querySelectorAll<HTMLButtonElement>(".biu-ui-select__option")[1];
    await act(async () => option?.click());
    const clear = document.querySelector<HTMLElement>(".biu-ui-select__clear");
    assert.ok(clear);
    await act(async () => clear.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    assert.deepEqual(changes.at(-1), []);

    const list = document.querySelector<HTMLElement>(".biu-ui-select__options");
    assert.ok(list);
    Object.defineProperties(list, {
      scrollHeight: { configurable: true, value: 200 },
      scrollTop: { configurable: true, value: 180 },
      clientHeight: { configurable: true, value: 20 },
    });
    await act(async () => {
      list.dispatchEvent(new Event("scroll", { bubbles: true }));
      await Promise.resolve();
    });
    assert.equal(loaded, 1);
  } finally {
    await unmount(rendered);
  }
});

test("Select bounds multi-value tags and keeps hidden values available as tooltip content", async () => {
  const rendered = await mount(
    React.createElement(Select, {
      mode: "multiple",
      open: true,
      defaultValue: ["one", "two", "three"],
      maxTagCount: 1,
      options: [
        { value: "one", label: "一个很长的项目名称" },
        { value: "two", label: "第二个很长的项目名称" },
        { value: "three", label: "第三个很长的项目名称" },
      ],
    }),
  );
  try {
    assert.equal(rendered.host.querySelectorAll(".biu-ui-select__tag").length, 2);
    const moreTag = rendered.host.querySelector<HTMLElement>(".biu-ui-select__more-tag");
    assert.ok(moreTag);
    await act(async () => {
      const event = new browserWindow.MouseEvent("pointermove", { bubbles: true });
      Object.defineProperty(event, "pointerType", { configurable: true, value: "mouse" });
      moreTag.dispatchEvent(event);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    });
    assert.equal(document.querySelectorAll(".biu-ui-select__hidden-tags-tooltip .biu-ui-ellipsis").length, 2);
    assert.equal(
      document.querySelectorAll('.biu-ui-select__hidden-tags-tooltip [data-biu-ellipsis-always="true"]').length,
      2,
    );
    assert.equal(document.querySelectorAll(".biu-ui-select__option-label").length, 3);
  } finally {
    await unmount(rendered);
  }
});

test("Select contains lazy-load failures and releases the loading lock", async () => {
  const errors: string[] = [];
  const rendered = await mount(
    React.createElement(Select, {
      open: true,
      hasMore: true,
      options: [{ label: "Alpha", value: "a" }],
      onLoadMore: async () => {
        throw new Error("load failed");
      },
      onLoadError: (error: unknown) => errors.push(String((error as Error).message)),
    }),
  );
  try {
    const list = document.querySelector<HTMLElement>(".biu-ui-select__options");
    assert.ok(list);
    Object.defineProperties(list, {
      scrollHeight: { configurable: true, value: 200 },
      scrollTop: { configurable: true, value: 180 },
      clientHeight: { configurable: true, value: 20 },
    });
    await act(async () => {
      list.dispatchEvent(new Event("scroll", { bubbles: true }));
      await Promise.resolve();
    });
    assert.deepEqual(errors, ["load failed"]);
    assert.equal(document.querySelector(".biu-ui-select__loading-more"), null);
  } finally {
    await unmount(rendered);
  }
});

test("Select does not open or clear while disabled/loading", async () => {
  const changes: unknown[] = [];
  const rendered = await mount(
    React.createElement(Select, {
      disabled: true,
      defaultValue: "a",
      allowClear: true,
      defaultOpen: true,
      options: [{ label: "Alpha", value: "a" }],
      onChange: (value) => changes.push(value),
    }),
  );
  try {
    assert.equal(document.querySelector(".biu-ui-select")?.getAttribute("data-state"), "closed");
    assert.equal(document.querySelector(".biu-ui-select__content"), null);
    await act(async () => document.querySelector<HTMLElement>(".biu-ui-select__trigger")?.click());
    await act(async () => document.querySelector<HTMLElement>(".biu-ui-select__clear")?.click());
    assert.deepEqual(changes, []);
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

test("TimePicker uses the custom Select controls instead of native time selects", async () => {
  const rendered = await mount(
    React.createElement(TimePicker, {
      open: true,
      format: "HH:mm:ss",
    }),
  );
  try {
    await act(async () => {
      await Promise.resolve();
    });
    assert.equal(document.querySelectorAll(".biu-ui-date-picker__time-select").length, 3);
    assert.equal(document.querySelectorAll(".biu-ui-date-picker__time select").length, 0);
    assert.equal(document.querySelectorAll(".biu-ui-date-picker__time [role=combobox]").length, 3);
  } finally {
    await unmount(rendered);
  }
});

test("TimePicker follows the format and hides seconds for minute precision", async () => {
  const rendered = await mount(
    React.createElement(TimePicker, {
      open: true,
      format: "HH:mm",
    }),
  );
  try {
    assert.equal(document.querySelectorAll(".biu-ui-date-picker__time-select").length, 2);
    assert.equal(document.querySelectorAll(".biu-ui-date-picker__time [role=combobox]").length, 2);
  } finally {
    await unmount(rendered);
  }
});

test("Textarea uses one native bidirectional resize contract and range time uses time presets", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(Textarea, { resize: "both", defaultValue: "可调整内容" }),
      React.createElement(RangeTimePicker, { open: true, format: "HH:mm:ss" }),
    ),
  );
  try {
    assert.equal(document.querySelector('[data-biu-slot="textarea-resize-handle"]'), null);
    assert.ok(document.querySelector('[data-biu-resize-handle="true"]'));
    assert.equal(
      document
        .querySelector<HTMLTextAreaElement>(".biu-ui-textarea__input")
        ?.style.getPropertyValue("--biu-textarea-resize"),
      "both",
    );
    assert.equal(document.querySelector(".biu-ui-date-picker__presets")?.textContent?.includes("近一小时"), true);
    assert.equal(document.querySelector(".biu-ui-date-picker__presets")?.textContent?.includes("近一天"), true);
  } finally {
    await unmount(rendered);
  }
});

test("Range date and time triggers render two shrinkable values with a centered separator", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(RangeDatePicker, { open: false }),
      React.createElement(RangeTimePicker, { open: false, format: "HH:mm:ss" }),
    ),
  );
  try {
    const ranges = document.querySelectorAll<HTMLElement>(".biu-ui-date-picker--range .biu-ui-date-picker__trigger");
    assert.equal(ranges.length, 2);
    assert.equal(document.querySelectorAll(".biu-ui-date-picker__range-value").length, 2);
    assert.equal(document.querySelectorAll(".biu-ui-date-picker__range-separator").length, 2);
    assert.equal(document.querySelector('[data-biu-component="range-date-picker"]') !== null, true);
    assert.equal(document.querySelector('[data-biu-component="range-time-picker"]') !== null, true);
    assert.equal(
      [...document.querySelectorAll(".biu-ui-date-picker__range-separator")].every((node) => node.textContent === "—"),
      true,
    );
  } finally {
    await unmount(rendered);
  }
});

test("RangeDatePicker uses a direct two-click range flow and normalizes order", async () => {
  const changes: Array<[dayjs.Dayjs | null, dayjs.Dayjs | null]> = [];
  const rendered = await mount(
    React.createElement(RangeDatePicker, {
      open: true,
      onChange: (value) => {
        if (Array.isArray(value)) changes.push(value as [dayjs.Dayjs | null, dayjs.Dayjs | null]);
      },
    }),
  );
  try {
    await act(async () => document.querySelector<HTMLButtonElement>('[data-date="2026-09-25"]')?.click());
    assert.equal(changes.at(-1)?.[0]?.format("YYYY-MM-DD"), "2026-09-25");
    assert.equal(changes.at(-1)?.[1], null);
    await act(async () => document.querySelector<HTMLButtonElement>('[data-date="2026-09-20"]')?.click());
    assert.equal(changes.at(-1)?.[0]?.format("YYYY-MM-DD"), "2026-09-20");
    assert.equal(changes.at(-1)?.[1]?.format("YYYY-MM-DD"), "2026-09-25");
    assert.equal(document.querySelectorAll(".biu-ui-date-picker__range-label-button").length, 0);
  } finally {
    await unmount(rendered);
  }
});

test("RangeTimePicker fills the other side with its visible default value", async () => {
  const values: Array<[dayjs.Dayjs | null, dayjs.Dayjs | null]> = [];
  const rendered = await mount(
    React.createElement(RangeTimePicker, {
      open: true,
      format: "HH:mm:ss",
      onChange: (value) => {
        if (Array.isArray(value)) values.push(value as [dayjs.Dayjs | null, dayjs.Dayjs | null]);
      },
    }),
  );
  try {
    const hourTriggers = document.querySelectorAll<HTMLElement>(
      ".biu-ui-date-picker__time-range .biu-ui-date-picker__time-select .biu-ui-select__trigger",
    );
    assert.equal(hourTriggers.length, 6);
    await act(async () => hourTriggers[3]?.click());
    const option = [...document.querySelectorAll<HTMLButtonElement>(".biu-ui-select__option")].find(
      (item) => item.textContent?.trim() === "18",
    );
    assert.ok(option);
    await act(async () => option?.click());
    const next = values.at(-1);
    assert.equal(next?.[0]?.format("HH:mm:ss"), "00:00:00");
    assert.ok(next?.[1]);
    assert.equal(next?.[1]?.hour(), 18);
  } finally {
    await unmount(rendered);
  }
});

test("RangeTimePicker fills either side without requiring a side selector", async () => {
  const values: Array<[dayjs.Dayjs | null, dayjs.Dayjs | null]> = [];
  const rendered = await mount(
    React.createElement(RangeTimePicker, {
      open: true,
      format: "HH:mm:ss",
      onChange: (value) => {
        if (Array.isArray(value)) values.push(value as [dayjs.Dayjs | null, dayjs.Dayjs | null]);
      },
    }),
  );
  try {
    const getTimeTriggers = () =>
      document.querySelectorAll<HTMLElement>(
        ".biu-ui-date-picker__time-range .biu-ui-date-picker__time-select .biu-ui-select__trigger",
      );
    assert.equal(getTimeTriggers().length, 6);

    await act(async () => getTimeTriggers()[0]?.click());
    const firstHour = [...document.querySelectorAll<HTMLButtonElement>(".biu-ui-select__option")].find(
      (option) => option.textContent?.trim() === "18",
    );
    await act(async () => firstHour?.click());
    let next = values.at(-1);
    assert.equal(next?.[0]?.format("HH:mm:ss"), "00:00:00");
    assert.equal(next?.[1]?.format("HH:mm:ss"), "18:00:00");

    await act(async () => getTimeTriggers()[0]?.click());
    const secondHour = [...document.querySelectorAll<HTMLButtonElement>(".biu-ui-select__option")].find(
      (option) => option.textContent?.trim() === "06",
    );
    await act(async () => secondHour?.click());
    next = values.at(-1);
    assert.equal(next?.[0]?.format("HH:mm:ss"), "06:00:00");
    assert.equal(next?.[1]?.format("HH:mm:ss"), "18:00:00");
  } finally {
    await unmount(rendered);
  }
});

test("RangeTimePicker keeps both side values synchronized in a controlled form-style render", async () => {
  let current: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [null, null];
  function ControlledRange() {
    const [value, setValue] = React.useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>(current);
    return React.createElement(RangeTimePicker, {
      open: true,
      value,
      format: "HH:mm:ss",
      onChange: (next) => {
        if (!Array.isArray(next)) return;
        current = next as [dayjs.Dayjs | null, dayjs.Dayjs | null];
        setValue(current);
      },
    });
  }
  const rendered = await mount(React.createElement(ControlledRange));
  try {
    const hourTriggers = document.querySelectorAll<HTMLElement>(
      ".biu-ui-date-picker__time-range .biu-ui-date-picker__time-select .biu-ui-select__trigger",
    );
    await act(async () => hourTriggers[3]?.click());
    const option = [...document.querySelectorAll<HTMLButtonElement>(".biu-ui-select__option")].find(
      (item) => item.textContent?.trim() === "18",
    );
    assert.ok(option);
    await act(async () => option?.click());
    assert.equal(current[0]?.format("HH:mm:ss"), "00:00:00");
    assert.equal(current[1]?.format("HH:mm:ss"), "18:00:00");
    assert.match(document.querySelector(".biu-ui-date-picker__time-range")?.textContent ?? "", /18/);
  } finally {
    await unmount(rendered);
  }
});

test("DatePicker supports readable formats, presets, confirmation, locale and disabled time options", async () => {
  const changes: Array<{ value: unknown; dateString?: string | string[] }> = [];
  const openChanges: boolean[] = [];
  const rendered = await mount(
    React.createElement(DatePicker, {
      open: true,
      format: "yyyy-mm-dd hh:ii:ss",
      showTime: true,
      hour12: true,
      needConfirm: true,
      locale: "en-US",
      presets: [{ label: "Release", value: dayjs("2026-09-01T09:09:09") }],
      disabledDate: (date) => date.date() === 1,
      disabledTime: () => ({ disabledHours: () => [0] }),
      onChange: (value, dateString) => changes.push({ value, dateString }),
      onOpenChange: (next) => openChanges.push(next),
    }),
  );
  try {
    const preset = document.querySelector<HTMLButtonElement>(".biu-ui-date-picker__presets button");
    assert.equal(preset?.textContent, "Release");
    assert.ok(document.querySelectorAll(".biu-ui-date-picker__day:disabled").length > 0);
    assert.equal(document.querySelector(".biu-ui-date-picker__confirm")?.textContent, "Confirm");
    assert.equal(document.querySelector(".biu-ui-date-picker__time")?.textContent?.includes("AM"), true);

    await act(async () => preset?.click());
    assert.equal(changes.length, 0, "needConfirm should keep preset changes in draft");
    await act(async () => document.querySelector<HTMLButtonElement>(".biu-ui-date-picker__confirm")?.click());
    assert.equal(changes.at(-1)?.dateString, "2026-09-01 09:09:09");
    assert.equal(openChanges.at(-1), false, "confirm should request the panel to close");

    const timeSelect = document.querySelector<HTMLElement>(".biu-ui-date-picker__time-select .biu-ui-select__trigger");
    assert.ok(timeSelect);
    await act(async () => timeSelect?.click());
    assert.ok(document.querySelector(".biu-ui-select__option.is-disabled"));
  } finally {
    await unmount(rendered);
  }
});

test("single DatePicker defaults to day-relative presets while ranges keep period presets", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(DatePicker, { open: true }),
      React.createElement(RangeDatePicker, { open: true }),
    ),
  );
  try {
    const presetPanels = [...document.querySelectorAll<HTMLElement>(".biu-ui-date-picker__presets")];
    assert.equal(presetPanels.length, 2);
    assert.match(presetPanels[0]?.textContent ?? "", /今天/);
    assert.match(presetPanels[0]?.textContent ?? "", /明天/);
    assert.match(presetPanels[0]?.textContent ?? "", /昨天/);
    assert.match(presetPanels[1]?.textContent ?? "", /近一周/);
    assert.match(presetPanels[1]?.textContent ?? "", /近一月/);
  } finally {
    await unmount(rendered);
  }
});

test("needConfirm closes both DatePicker and TimePicker panels after confirmation", async () => {
  const dateOpenChanges: boolean[] = [];
  const timeOpenChanges: boolean[] = [];
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(DatePicker, {
        open: true,
        needConfirm: true,
        onOpenChange: (next) => dateOpenChanges.push(next),
      }),
      React.createElement(TimePicker, {
        open: true,
        needConfirm: true,
        onOpenChange: (next) => timeOpenChanges.push(next),
      }),
    ),
  );
  try {
    assert.equal(document.querySelectorAll(".biu-ui-date-picker__confirm").length, 2);
    await act(async () => document.querySelector<HTMLButtonElement>(".biu-ui-date-picker__confirm")?.click());
    assert.equal(dateOpenChanges.at(-1), false);
    await act(async () => document.querySelector<HTMLButtonElement>(".biu-ui-date-picker__confirm")?.click());
    assert.equal(timeOpenChanges.at(-1), false);
  } finally {
    await unmount(rendered);
  }
});

test("DatePicker exposes renderCell for custom day content", async () => {
  const rendered = await mount(
    React.createElement(DatePicker, {
      open: true,
      renderCell: (date) => React.createElement("strong", { className: "custom-day" }, date.date()),
    }),
  );
  try {
    assert.ok(document.querySelector(".biu-ui-date-picker__day .custom-day"));
  } finally {
    await unmount(rendered);
  }
});

test("DatePicker respects hour12 formatting instead of forcing 24-hour output", async () => {
  const rendered = await mount(
    React.createElement(DatePicker, {
      open: true,
      hour12: true,
      format: "yyyy-mm-dd hh:ii:ss A",
      defaultValue: dayjs("2026-09-01T13:05:06"),
      showTime: true,
    }),
  );
  try {
    assert.equal(document.querySelector(".biu-ui-date-picker__value")?.textContent, "2026-09-01 01:05:06 PM");
    assert.match(document.querySelector(".biu-ui-date-picker__time")?.textContent ?? "", /下午/);
  } finally {
    await unmount(rendered);
  }
});
