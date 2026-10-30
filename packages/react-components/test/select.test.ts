import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { Cascader, Select } from "../src/ui/index.js";
import { createTestDom } from "./fixtures/react-dom.js";

const { browserWindow, mount, unmount } = createTestDom("input");

test("Select and Cascader preserve caller-supplied values that are absent from current options", async () => {
  const select = await mount(
    React.createElement(Select, {
      value: "backend-only",
      options: [{ label: "已加载", value: "loaded" }],
    }),
  );
  const multiple = await mount(
    React.createElement(Select, {
      mode: "multiple",
      value: ["backend-only"],
      options: [{ label: "已加载", value: "loaded" }],
    }),
  );
  const cascader = await mount(
    React.createElement(Cascader, {
      value: ["legacy-path"],
      options: [{ label: "已加载", value: "loaded", isLeaf: true }],
    }),
  );
  try {
    assert.equal(select.host.querySelector(".biu-ui-select__value")?.textContent, "backend-only");
    assert.equal(multiple.host.querySelector(".biu-ui-select__tag")?.textContent?.includes("backend-only"), true);
    assert.equal(cascader.host.querySelector(".biu-ui-cascader__value")?.textContent, "legacy-path");
  } finally {
    await unmount(select);
    await unmount(multiple);
    await unmount(cascader);
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
    assert.equal(
      document.querySelectorAll(".biu-ui-select__hidden-tags-tooltip .biu-ui-select__hidden-tag-label").length,
      2,
    );
    assert.equal(
      document.querySelectorAll(".biu-ui-select__hidden-tags-tooltip .biu-ui-select__hidden-tag-label")[0]?.textContent,
      "第二个很长的项目名称",
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

test("Select supports click and scroll lazy loading without losing the selected value", async () => {
  let loaded = 0;
  const rendered = await mount(
    React.createElement(Select, {
      open: true,
      defaultValue: "a",
      options: [{ label: "Alpha", value: "a" }],
      hasMore: true,
      loadMoreTrigger: "both",
      onLoadMore: async () => {
        loaded += 1;
      },
    }),
  );
  try {
    const loadButton = document.querySelector<HTMLButtonElement>(".biu-ui-select__load-more");
    assert.ok(loadButton);
    await act(async () => loadButton.click());
    assert.equal(loaded, 1);
    assert.equal(rendered.host.querySelector<HTMLElement>(".biu-ui-select__value")?.textContent, "Alpha");
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
