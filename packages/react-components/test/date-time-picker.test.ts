import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import dayjs from "dayjs";
import { DatePicker, RangeDatePicker, RangeTimePicker, Textarea, TimePicker } from "../src/ui/index.js";
import { createTestDom } from "./fixtures/react-dom.js";

const { mount, unmount } = createTestDom("input");

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
  const firstDate = dayjs().startOf("month").date(25);
  const secondDate = dayjs().startOf("month").date(20);
  const rendered = await mount(
    React.createElement(RangeDatePicker, {
      open: true,
      onChange: (value) => {
        if (Array.isArray(value)) changes.push(value as [dayjs.Dayjs | null, dayjs.Dayjs | null]);
      },
    }),
  );
  try {
    await act(async () =>
      document.querySelector<HTMLButtonElement>(`[data-date="${firstDate.format("YYYY-MM-DD")}"]`)?.click(),
    );
    assert.equal(changes.at(-1)?.[0]?.format("YYYY-MM-DD"), firstDate.format("YYYY-MM-DD"));
    assert.equal(changes.at(-1)?.[1], null);
    await act(async () =>
      document.querySelector<HTMLButtonElement>(`[data-date="${secondDate.format("YYYY-MM-DD")}"]`)?.click(),
    );
    assert.equal(changes.at(-1)?.[0]?.format("YYYY-MM-DD"), secondDate.format("YYYY-MM-DD"));
    assert.equal(changes.at(-1)?.[1]?.format("YYYY-MM-DD"), firstDate.format("YYYY-MM-DD"));
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
    assert.equal(changes.at(-1)?.dateString, "2026-09-01 09:09:09");
    await act(async () => document.querySelector<HTMLButtonElement>(".biu-ui-date-picker__confirm")?.click());
    assert.equal(changes.length, 1, "confirm should not publish the same preset twice");
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
