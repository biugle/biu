import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import dayjs from "dayjs";
import { DatePicker, RangeDatePicker, RangeTimePicker, Select, Slider, TimePicker } from "../src/ui/index.js";
import {
  formatCalendarYear,
  parseCalendarYearInput,
  sanitizeCalendarYearInput,
} from "../src/ui/control/date-picker-utils.js";

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
Object.assign(globalThis, {
  ResizeObserver: TestResizeObserver,
  requestAnimationFrame: (callback: FrameRequestCallback) => browserWindow.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => browserWindow.clearTimeout(id),
});
Object.assign(browserWindow.HTMLElement.prototype, { attachEvent() {}, detachEvent() {} });

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

test("DatePicker publishes date changes immediately and confirm only closes the panel", async () => {
  const changes: Array<{ value: unknown; dateString?: string | string[] }> = [];
  const openChanges: boolean[] = [];
  const selectedDate = dayjs().startOf("month").date(15);
  const rendered = await mount(
    React.createElement(DatePicker, {
      defaultOpen: true,
      needConfirm: true,
      onChange: (value, dateString) => changes.push({ value, dateString }),
      onOpenChange: (next) => openChanges.push(next),
    }),
  );
  try {
    await act(async () =>
      document.querySelector<HTMLButtonElement>(`[data-date="${selectedDate.format("YYYY-MM-DD")}"]`)?.click(),
    );
    assert.equal(changes.length, 1);
    assert.equal(changes[0]?.dateString, selectedDate.format("YYYY-MM-DD"));
    assert.match(document.querySelector(".biu-ui-date-picker__trigger")?.textContent ?? "", /15/);
    assert.ok(document.querySelector(".biu-ui-date-picker__content"));
    assert.equal(openChanges.includes(false), false);

    await act(async () => document.querySelector<HTMLButtonElement>(".biu-ui-date-picker__confirm")?.click());
    assert.equal(changes.length, 1, "confirm must not re-emit the already published date");
    assert.equal(openChanges.at(-1), false);
    assert.equal(document.querySelector(".biu-ui-date-picker__content"), null);
  } finally {
    await unmount(rendered);
  }
});

test("date/time pickers, Select and Slider keep their LTR behavior under an RTL host", async () => {
  document.documentElement.dir = "rtl";
  const sliderChanges: number[] = [];
  const rendered = await mount(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(DatePicker, { defaultOpen: true, showTime: true }),
      React.createElement(Select, {
        options: [{ label: "选项", value: "option" }],
      }),
      React.createElement(Slider, {
        defaultValue: 40,
        onChange: (next) => {
          if (typeof next === "number") sliderChanges.push(next);
        },
      }),
    ),
  );
  try {
    await act(async () => rendered.host.querySelector<HTMLElement>(".biu-ui-select__trigger")?.click());
    assert.equal(rendered.host.querySelector(".biu-ui-date-picker")?.getAttribute("dir"), "ltr");
    assert.equal(document.body.querySelector(".biu-ui-date-picker__content")?.getAttribute("dir"), "ltr");
    assert.equal(rendered.host.querySelector(".biu-ui-slider")?.getAttribute("dir"), "ltr");
    assert.equal(rendered.host.querySelector(".biu-ui-select")?.getAttribute("dir"), "ltr");
    assert.equal(document.body.querySelector(".biu-ui-select__content")?.getAttribute("dir"), "ltr");

    const dateTimeSelects = [
      ...document.body.querySelectorAll<HTMLElement>(".biu-ui-date-picker__content .biu-ui-select"),
    ];
    assert.ok(dateTimeSelects.length > 0, "the time controls should still render their Select controls");
    assert.ok(dateTimeSelects.every((select) => select.getAttribute("dir") === "ltr"));

    const slider = rendered.host.querySelector<HTMLElement>(".biu-ui-slider");
    assert.ok(slider);
    Object.defineProperty(slider, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 0, right: 100, top: 0, bottom: 42, width: 100, height: 42 }),
    });
    await act(async () =>
      slider.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 75, clientY: 20 })),
    );
    assert.deepEqual(sliderChanges, [75], "a track click under an RTL host should retain the LTR value mapping");
  } finally {
    await unmount(rendered);
    document.documentElement.removeAttribute("dir");
  }
});

test("DatePicker with showTime publishes a calendar selection immediately", async () => {
  const changes: Array<{ value: unknown; dateString?: string | string[] }> = [];
  const selectedDate = dayjs("2026-09-22");
  const rendered = await mount(
    React.createElement(DatePicker, {
      defaultOpen: true,
      defaultValue: dayjs("2026-09-20T09:11:12"),
      format: "YYYY-MM-DD HH:mm:ss",
      showTime: true,
      needConfirm: true,
      onChange: (value, dateString) => changes.push({ value, dateString }),
    }),
  );
  try {
    await act(async () =>
      document.querySelector<HTMLButtonElement>(`[data-date="${selectedDate.format("YYYY-MM-DD")}"]`)?.click(),
    );
    assert.equal(changes.at(-1)?.dateString, "2026-09-22 09:11:12");
    assert.equal((changes.at(-1)?.value as dayjs.Dayjs).format("HH:mm:ss"), "09:11:12");
    assert.ok(document.querySelector(".biu-ui-date-picker__content"));
  } finally {
    await unmount(rendered);
  }
});

test("DatePicker clear updates immediately without closing the panel", async () => {
  const changes: Array<{ value: unknown; dateString?: string | string[] }> = [];
  const rendered = await mount(
    React.createElement(DatePicker, {
      defaultOpen: true,
      defaultValue: dayjs("2026-09-20"),
      needConfirm: true,
      onChange: (value, dateString) => changes.push({ value, dateString }),
    }),
  );
  try {
    const clear = [...document.querySelectorAll<HTMLButtonElement>(".biu-ui-date-picker__footer button")].find(
      (button) => button.textContent?.trim() === "清除",
    );
    assert.ok(clear);
    await act(async () => clear?.click());
    assert.equal(changes.length, 1);
    assert.equal(changes[0]?.value, null);
    assert.equal(changes[0]?.dateString, "");
    assert.ok(document.querySelector(".biu-ui-date-picker__content"));
  } finally {
    await unmount(rendered);
  }
});

test("TimePicker publishes the latest time immediately and confirm only closes the panel", async () => {
  const changes: Array<{ value: unknown; dateString?: string | string[] }> = [];
  const rendered = await mount(
    React.createElement(TimePicker, {
      defaultOpen: true,
      defaultValue: dayjs("2000-01-01T09:00:00"),
      needConfirm: true,
      onChange: (value, dateString) => changes.push({ value, dateString }),
    }),
  );
  try {
    const hourTrigger = document.querySelector<HTMLElement>(".biu-ui-date-picker__time-select .biu-ui-select__trigger");
    await act(async () => hourTrigger?.click());
    const option = [...document.querySelectorAll<HTMLButtonElement>(".biu-ui-select__option")].find(
      (item) => item.textContent?.trim() === "18",
    );
    assert.ok(option);
    await act(async () => option?.click());
    assert.equal(changes.length, 1);
    assert.equal((changes[0]?.value as dayjs.Dayjs).format("HH:mm"), "18:00");
    assert.equal(changes[0]?.dateString, "18:00");
    assert.ok(document.querySelector(".biu-ui-date-picker__content"));

    await act(async () => document.querySelector<HTMLButtonElement>(".biu-ui-date-picker__confirm")?.click());
    assert.equal(changes.length, 1, "confirm must not re-emit the already published time");
    assert.equal(document.querySelector(".biu-ui-date-picker__content"), null);
  } finally {
    await unmount(rendered);
  }
});

test("RangeDatePicker publishes partial and completed changes immediately", async () => {
  const changes: Array<[dayjs.Dayjs | null, dayjs.Dayjs | null]> = [];
  const openChanges: boolean[] = [];
  const firstDate = dayjs().startOf("month").date(25);
  const secondDate = dayjs().startOf("month").date(20);
  const rendered = await mount(
    React.createElement(RangeDatePicker, {
      defaultOpen: true,
      needConfirm: true,
      onChange: (value) => {
        if (Array.isArray(value)) changes.push(value as [dayjs.Dayjs | null, dayjs.Dayjs | null]);
      },
      onOpenChange: (next) => openChanges.push(next),
    }),
  );
  try {
    await act(async () =>
      document.querySelector<HTMLButtonElement>(`[data-date="${firstDate.format("YYYY-MM-DD")}"]`)?.click(),
    );
    assert.equal(changes.length, 1);
    assert.equal(changes[0]?.[0]?.format("YYYY-MM-DD"), firstDate.format("YYYY-MM-DD"));
    assert.equal(changes[0]?.[1], null);

    await act(async () =>
      document.querySelector<HTMLButtonElement>(`[data-date="${secondDate.format("YYYY-MM-DD")}"]`)?.click(),
    );
    assert.equal(changes.length, 2);
    assert.equal(changes[1]?.[0]?.format("YYYY-MM-DD"), secondDate.format("YYYY-MM-DD"));
    assert.equal(changes[1]?.[1]?.format("YYYY-MM-DD"), firstDate.format("YYYY-MM-DD"));
    assert.equal(openChanges.includes(false), false);
    await act(async () => document.querySelector<HTMLButtonElement>(".biu-ui-date-picker__confirm")?.click());
    assert.equal(openChanges.at(-1), false);
  } finally {
    await unmount(rendered);
  }
});

test("RangeTimePicker publishes changes immediately with needConfirm enabled", async () => {
  const changes: Array<[dayjs.Dayjs | null, dayjs.Dayjs | null]> = [];
  const openChanges: boolean[] = [];
  const rendered = await mount(
    React.createElement(RangeTimePicker, {
      defaultOpen: true,
      format: "HH:mm:ss",
      needConfirm: true,
      onChange: (value) => {
        if (Array.isArray(value)) changes.push(value as [dayjs.Dayjs | null, dayjs.Dayjs | null]);
      },
      onOpenChange: (next) => openChanges.push(next),
    }),
  );
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
    assert.equal(changes.length, 1);
    assert.equal(changes[0]?.[0]?.format("HH:mm:ss"), "00:00:00");
    assert.equal(changes[0]?.[1]?.format("HH:mm:ss"), "18:00:00");
    assert.equal(openChanges.includes(false), false);
    assert.ok(document.querySelector(".biu-ui-date-picker__content"));

    await act(async () => document.querySelector<HTMLButtonElement>(".biu-ui-date-picker__confirm")?.click());
    assert.equal(openChanges.at(-1), false);
  } finally {
    await unmount(rendered);
  }
});

test("DatePicker presets and Today move the calendar to the selected date", async () => {
  const targetStart = dayjs("2026-01-08");
  const targetEnd = dayjs("2026-03-15");
  const rendered = await mount(
    React.createElement(RangeDatePicker, {
      defaultOpen: true,
      needConfirm: true,
      presets: [{ label: "跨月范围", value: [targetStart, targetEnd] }],
    }),
  );
  try {
    const preset = document.querySelector<HTMLButtonElement>(".biu-ui-date-picker__presets button");
    await act(async () => preset?.click());
    assert.equal(document.querySelector(`[data-date="${targetEnd.format("YYYY-MM-DD")}"].is-outside`), null);

    const today = dayjs();
    await act(async () =>
      document.querySelector<HTMLButtonElement>(".biu-ui-date-picker__footer-leading button")?.click(),
    );
    assert.equal(document.querySelector(`[data-date="${today.format("YYYY-MM-DD")}"].is-outside`), null);
  } finally {
    await unmount(rendered);
  }
});

test("DatePicker calendar marks weekends and respects each month length, including leap years", async () => {
  const cases = [
    { month: "2024-02", dayCount: 29 },
    { month: "2025-02", dayCount: 28 },
    { month: "2026-04", dayCount: 30 },
    { month: "2026-01", dayCount: 31 },
  ];

  for (const item of cases) {
    const selectedDate = dayjs(`${item.month}-15`);
    const rendered = await mount(
      React.createElement(DatePicker, {
        defaultOpen: true,
        defaultValue: selectedDate,
      }),
    );
    try {
      const weekdayHeaders = [...document.querySelectorAll<HTMLElement>(".biu-ui-date-picker__week")];
      assert.equal(weekdayHeaders.length, 7);
      assert.ok(weekdayHeaders[0]?.classList.contains("is-weekend"), "Sunday header should be marked as a weekend");
      assert.ok(weekdayHeaders[6]?.classList.contains("is-weekend"), "Saturday header should be marked as a weekend");
      assert.ok(
        weekdayHeaders.slice(1, 6).every((header) => !header.classList.contains("is-weekend")),
        "weekday headers should not receive the weekend treatment",
      );
      const days = [...document.querySelectorAll<HTMLButtonElement>(".biu-ui-date-picker__day")];
      const daysInMonth = days.filter((button) => !button.classList.contains("is-outside"));
      assert.equal(daysInMonth.length, item.dayCount, `${item.month} should render its real number of days`);
      for (const button of days) {
        const date = dayjs(button.dataset.date);
        assert.equal(
          button.classList.contains("is-weekend"),
          date.day() === 0 || date.day() === 6,
          `${button.dataset.date} should be marked as a weekend only on Saturday or Sunday`,
        );
      }
    } finally {
      await unmount(rendered);
    }
  }

  const selectedWeekend = dayjs("2024-02-03");
  const rendered = await mount(React.createElement(DatePicker, { defaultOpen: true, defaultValue: selectedWeekend }));
  try {
    const selected = document.querySelector<HTMLButtonElement>(`[data-date="${selectedWeekend.format("YYYY-MM-DD")}"]`);
    assert.ok(selected?.classList.contains("is-selected"));
    assert.ok(selected?.classList.contains("is-weekend"));
  } finally {
    await unmount(rendered);
  }
});

test("DatePicker year input is limited to three or four digits", async () => {
  const rendered = await mount(
    React.createElement(DatePicker, {
      defaultOpen: true,
      defaultValue: dayjs("2026-11-15"),
    }),
  );
  try {
    const input = document.querySelector<HTMLInputElement>(".biu-ui-date-picker__calendar-year-field input");
    assert.ok(input);
    assert.equal(input.type, "text");
    assert.equal(input.inputMode, "numeric");
    assert.equal(input.minLength, 3);
    assert.equal(input.maxLength, 4);
  } finally {
    await unmount(rendered);
  }

  assert.equal(sanitizeCalendarYearInput("2030a123"), "2030", "non-digits are removed and input is capped at 4 digits");
  assert.equal(sanitizeCalendarYearInput("20"), "20", "short values can be typed before blur validation");
  assert.equal(parseCalendarYearInput("20"), null, "a year shorter than 3 digits cannot be committed");
  assert.equal(parseCalendarYearInput("020"), 20, "three-digit years remain supported");
  assert.equal(parseCalendarYearInput("0999"), 999, "four-character years with leading zeroes remain supported");
  assert.equal(parseCalendarYearInput("12345"), null, "years longer than 4 digits cannot be committed");
  assert.equal(formatCalendarYear(20), "020", "older short years remain editable as three-digit values");
});
