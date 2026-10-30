import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import {
  DropdownMenu,
  CopyText,
  Detail,
  Ellipsis,
  Popconfirm,
  Popover,
  Pagination,
  Progress,
  Tabs,
  TextField,
  Tooltip,
} from "../src/ui/index.js";
import { PageFilterItem } from "../src/pro/index.js";
import { createTestDom } from "./fixtures/react-dom.js";
import { dispatchPointerMove } from "./fixtures/pointer.js";

const { browserWindow, mount, unmount } = createTestDom("overlay");

test("Tabs does not reserve an empty panel when tab items have no content", async () => {
  const rendered = await mount(
    React.createElement(Tabs, {
      items: [
        { key: "all", label: "全部" },
        { key: "ready", label: "已完成" },
      ],
    }),
  );
  try {
    assert.equal(rendered.host.querySelector('[role="tabpanel"]'), null);
  } finally {
    await unmount(rendered);
  }
});

test("Tabs stretches its tab list across the parent width by default", async () => {
  const rendered = await mount(
    React.createElement(Tabs, {
      items: [
        { key: "all", label: "全部" },
        { key: "ready", label: "已完成" },
      ],
    }),
  );
  try {
    const tabs = rendered.host.querySelector<HTMLElement>(".biu-ui-tabs");
    const bar = rendered.host.querySelector<HTMLElement>(".biu-ui-tabs__bar");
    const list = rendered.host.querySelector<HTMLElement>(".biu-ui-tabs__list");
    assert.equal(tabs?.style.width, "100%");
    assert.ok(bar);
    assert.ok(list);
    const styles = readFileSync(new URL("../src/ui/tabs/styles.css", import.meta.url), "utf8");
    assert.match(styles, /\.biu-ui-tabs\s*\{[^}]*display:\s*block;[^}]*flex:\s*1 1 auto;[^}]*width:\s*100%;/s);
    assert.match(styles, /\.biu-ui-tabs__bar\s*\{[^}]*width:\s*100%;/s);
    assert.match(styles, /\.biu-ui-tabs__list\s*\{[^}]*flex:\s*1 1 0%;/s);
  } finally {
    await unmount(rendered);
  }
});

test("PageToolbar reserves the standard gap before its table content", () => {
  const styles = readFileSync(new URL("../src/ui/page/styles.css", import.meta.url), "utf8");
  assert.match(styles, /\.biu-ui-page__toolbar\s*\{[^}]*margin-bottom:\s*6px;/s);
});

test("Tooltip and Ellipsis expose complete text only after real overflow", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(
        Tooltip,
        { content: "完整提示", onlyOverflow: true },
        React.createElement("span", null, "短文本"),
      ),
      React.createElement(Ellipsis, { content: "一段需要截断后提示的长文本", style: { width: "40px" } }),
    ),
  );
  try {
    const tooltipHost = document.querySelector(".biu-ui-tooltip");
    const ellipsis = document.querySelector(".biu-ui-ellipsis");
    assert.ok(tooltipHost);
    assert.ok(ellipsis);
    Object.defineProperties(tooltipHost, {
      scrollWidth: { configurable: true, value: 120 },
      clientWidth: { configurable: true, value: 40 },
    });
    Object.defineProperties(ellipsis, {
      scrollWidth: { configurable: true, value: 40 },
      clientWidth: { configurable: true, value: 40 },
      scrollHeight: { configurable: true, value: 40 },
      clientHeight: { configurable: true, value: 40 },
    });
    const ellipsisContent = ellipsis.firstElementChild;
    assert.ok(ellipsisContent);
    Object.defineProperties(ellipsisContent, {
      scrollWidth: { configurable: true, value: 40 },
      clientWidth: { configurable: true, value: 40 },
      scrollHeight: { configurable: true, value: 240 },
      clientHeight: { configurable: true, value: 40 },
    });
    await act(async () => {
      window.dispatchEvent(new Event("resize"));
      const trigger = tooltipHost.querySelector(".biu-ui-tooltip__trigger");
      if (trigger) {
        trigger.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
        dispatchPointerMove(trigger);
      }
      await new Promise((resolve) => browserWindow.setTimeout(resolve, 0));
    });
    assert.equal(document.querySelector('[role="tooltip"]')?.textContent, "完整提示");
    await act(async () => {
      const ellipsisTarget = document.querySelector(".biu-ui-ellipsis");
      if (ellipsisTarget) dispatchPointerMove(ellipsisTarget);
      await new Promise((resolve) => browserWindow.setTimeout(resolve, 0));
    });
    assert.equal(document.querySelector(".biu-ui-ellipsis")?.getAttribute("data-biu-ellipsis-active"), "true");
  } finally {
    await unmount(rendered);
  }
});

test("Tooltip does not render content for a non-overflowing target", async () => {
  const rendered = await mount(
    React.createElement(
      Tooltip,
      { content: "不应显示", onlyOverflow: true },
      React.createElement("span", null, "短文本"),
    ),
  );
  try {
    const host = document.querySelector(".biu-ui-tooltip");
    assert.ok(host);
    await act(async () => {
      const trigger = host.querySelector(".biu-ui-tooltip__trigger");
      if (trigger) dispatchPointerMove(trigger);
      await Promise.resolve();
    });
    assert.equal(document.querySelector('[role="tooltip"]'), null);
  } finally {
    await unmount(rendered);
  }
});

test("Ellipsis alwaysTooltip opens for a fitting value", async () => {
  const rendered = await mount(React.createElement(Ellipsis, { content: "短文本", alwaysTooltip: true }));
  try {
    const host = document.querySelector<HTMLElement>(".biu-ui-tooltip");
    const ellipsis = document.querySelector<HTMLElement>(".biu-ui-ellipsis");
    assert.ok(host);
    assert.ok(ellipsis);
    assert.equal(ellipsis.getAttribute("data-biu-ellipsis-always"), "true");
    const trigger = host.querySelector<HTMLElement>(".biu-ui-tooltip__trigger");
    assert.ok(trigger);
    await act(async () => {
      dispatchPointerMove(trigger);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    });
    assert.equal(document.querySelector('[role="tooltip"]')?.textContent, "短文本");
  } finally {
    await unmount(rendered);
  }
});

test("CopyText renders a copy action and supports hover-only visibility", async () => {
  const copied: string[] = [];
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async (value: string) => copied.push(value) },
  });
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(CopyText, { text: "复制内容", copyOnHover: true }),
      React.createElement(CopyText, { text: "默认显示" }),
    ),
  );
  try {
    const copyButtons = rendered.host.querySelectorAll<HTMLButtonElement>(".biu-ui-copy-text__button");
    assert.equal(copyButtons.length, 2);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-copy-text--hover").length, 1);
    await act(async () => copyButtons[1]?.click());
    assert.deepEqual(copied, ["默认显示"]);
    assert.equal(rendered.host.querySelectorAll('[data-biu-copy-state="copied"]').length, 1);
  } finally {
    await unmount(rendered);
  }
});

test("Detail renders configured sections, dotted values, spans and field tooltips", async () => {
  const rendered = await mount(
    React.createElement(Detail, {
      data: { station: { name: "Jeddah Station" }, status: "开启", address: "很长的地址" },
      columns: 4,
      sections: [
        {
          key: "basic",
          title: "核心信息",
          items: [
            { key: "station.name", title: "站点名称", tooltip: "站点的业务名称" },
            { key: "status", title: "状态", span: 2 },
            { key: "address", title: "地址", ellipsis: true },
          ],
        },
      ],
    }),
  );
  try {
    assert.equal(document.querySelector('[data-biu-component="detail"]')?.classList.contains("biu-ui-detail"), true);
    assert.equal(document.querySelector('[data-biu-detail-section="basic"] h3')?.textContent, "核心信息");
    assert.equal(
      document.querySelector('[data-biu-detail-item="station.name"] .biu-ui-detail__value')?.textContent,
      "Jeddah Station",
    );
    assert.equal(
      document.querySelector('[data-biu-detail-item="status"]')?.getAttribute("style"),
      "--biu-ui-detail-item-span: 2;",
    );
    assert.equal(document.querySelectorAll(".biu-ui-detail__tooltip").length, 1);
  } finally {
    await unmount(rendered);
  }
});

test("PageFilterItem and Detail center explicit label text with every tooltip layer", async () => {
  const style = document.createElement("style");
  style.textContent = [
    "../src/ui/tooltip/styles.css",
    "../src/pro/page-filter/styles.css",
    "../src/ui/detail/styles.css",
  ]
    .map((path) => readFileSync(new URL(path, import.meta.url), "utf8"))
    .join("\n");
  document.head.append(style);
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(
        PageFilterItem,
        { label: "负责人", required: true, tooltip: "筛选说明" },
        React.createElement(TextField),
      ),
      React.createElement(Detail, {
        data: { owner: "业务团队" },
        sections: [{ items: [{ key: "owner", title: "负责人", tooltip: "详情说明" }] }],
      }),
    ),
  );
  try {
    for (const [labelSelector, textSelector, rootSelector, triggerSelector, iconSelector] of [
      [
        ".biu-pro-page-filter__item-label",
        ".biu-pro-page-filter__item-label-text",
        ".biu-pro-page-filter__tooltip-root",
        ".biu-pro-page-filter__tooltip-trigger",
        ".biu-pro-page-filter__item-tooltip > svg",
      ],
      [
        ".biu-ui-detail__label",
        ".biu-ui-detail__label-text",
        ".biu-ui-detail__tooltip-root",
        ".biu-ui-detail__tooltip-trigger",
        ".biu-ui-detail__tooltip > svg",
      ],
    ]) {
      const label = rendered.host.querySelector<HTMLElement>(labelSelector!);
      const text = label?.querySelector<HTMLElement>(textSelector!);
      const tooltip = label?.querySelector<HTMLElement>(`:scope > ${rootSelector}`);
      const trigger = tooltip?.querySelector<HTMLElement>(`:scope > ${triggerSelector}`);
      const icon = trigger?.querySelector(iconSelector!);
      assert.ok(label);
      assert.ok(text);
      assert.ok(tooltip);
      assert.ok(trigger);
      assert.ok(icon);
      assert.equal(window.getComputedStyle(label).alignItems, "center");
      assert.equal(window.getComputedStyle(text).display, "block");
      for (const layer of [tooltip, trigger]) {
        const computed = window.getComputedStyle(layer);
        assert.equal(computed.display, "inline-flex");
        assert.equal(computed.alignItems, "center");
        assert.equal(computed.lineHeight, "1");
      }
      assert.equal(window.getComputedStyle(icon).display, "block");
    }
  } finally {
    await unmount(rendered);
    style.remove();
  }
});

test("Popover and Popconfirm open when the trigger is an interactive button", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(Popover, {
        content: React.createElement("p", null, "弹出内容"),
        children: React.createElement("button", null, "打开"),
      }),
      React.createElement(Popconfirm, { title: "确认吗？", children: React.createElement("button", null, "确认") }),
    ),
  );
  try {
    const triggers = document.querySelectorAll<HTMLButtonElement>(".biu-ui-popover__trigger button");
    assert.equal(triggers.length, 2);
    await act(async () => triggers[0]?.click());
    assert.equal(document.querySelectorAll(".biu-ui-popover")[0]?.getAttribute("data-state"), "open");
    assert.ok(document.querySelector('.biu-ui-popover__content[data-biu-slot="popover-content"]'));
    await act(async () => triggers[1]?.click());
    assert.equal(document.querySelectorAll(".biu-ui-popover")[1]?.getAttribute("data-state"), "open");
    assert.equal(document.querySelector(".biu-ui-popconfirm")?.textContent?.includes("确定"), true);
    assert.ok(document.querySelector(".biu-ui-popconfirm__popover-content"));
  } finally {
    await unmount(rendered);
  }
});

test("DropdownMenu keeps checkbox and radio items interactive and controllable", async () => {
  const checkedChanges: string[][] = [];
  const radioChanges: Array<[string, string]> = [];
  const itemActions: string[] = [];
  const rendered = await mount(
    React.createElement(DropdownMenu, {
      trigger: React.createElement("button", null, "更多"),
      open: true,
      defaultCheckedKeys: ["compact"],
      defaultRadioValue: "light",
      onCheckedChange: (keys: string[]) => checkedChanges.push(keys),
      onRadioChange: (value: string, group: string) => radioChanges.push([value, group]),
      items: [
        { key: "compact", type: "checkbox", label: "紧凑模式", onClick: () => itemActions.push("compact") },
        { key: "line", type: "separator" },
        { key: "light", type: "radio", radioGroup: "theme", label: "浅色" },
        { key: "dark", type: "radio", radioGroup: "theme", label: "深色" },
      ],
    }),
  );
  try {
    await act(async () => {
      await new Promise((resolve) => browserWindow.setTimeout(resolve, 20));
    });
    const checkbox = document.querySelector<HTMLElement>('[role="menuitemcheckbox"]');
    const radios = document.querySelectorAll<HTMLElement>('[role="menuitemradio"]');
    assert.ok(checkbox);
    assert.equal(checkbox.getAttribute("data-state"), "checked");
    assert.equal(radios.length, 2);
    await act(async () => checkbox.click());
    assert.equal(checkbox.getAttribute("data-state"), "unchecked");
    assert.deepEqual(checkedChanges.at(-1), []);
    assert.deepEqual(itemActions, ["compact"]);
    const darkRadio = document.querySelectorAll<HTMLElement>('[role="menuitemradio"]')[1];
    await act(async () => darkRadio?.click());
    assert.equal(
      document.querySelectorAll<HTMLElement>('[role="menuitemradio"]')[1]?.getAttribute("data-state"),
      "checked",
    );
    assert.deepEqual(radioChanges.at(-1), ["dark", "theme"]);
  } finally {
    await unmount(rendered);
  }
});

test("Pagination and Progress attach classNames to the actual slots", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(Pagination, {
        current: 2,
        pageSize: 10,
        total: 80,
        showQuickJumper: true,
        quickJumperWidth: 96,
        classNames: { root: "pagination-root", jumper: "pagination-jumper" },
      }),
      React.createElement(Progress, {
        percent: 45,
        classNames: { root: "progress-root", track: "progress-track", fill: "progress-fill" },
      }),
    ),
  );
  try {
    assert.ok(document.querySelector(".biu-ui-pagination.pagination-root"));
    assert.ok(document.querySelector(".biu-ui-pagination__jumper.pagination-jumper"));
    assert.ok(document.querySelector(".biu-ui-pagination__jumper .biu-ui-textfield"));
    assert.ok(document.querySelector('.biu-ui-pagination__jumper .biu-ui-textfield__input[type="number"]'));
    assert.match(
      document.querySelector(".biu-ui-pagination__jumper")?.getAttribute("style") ?? "",
      /--biu-pagination-jumper-width: 96px/,
    );
    assert.ok(document.querySelector(".biu-ui-progress.progress-root .progress-track"));
    assert.ok(document.querySelector(".progress-track .progress-fill"));
  } finally {
    await unmount(rendered);
  }
});
