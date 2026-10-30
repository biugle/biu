import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { ButtonList, Pagination } from "../src/ui/index.js";
import { createTestDom } from "./fixtures/react-dom.js";

const { mount, unmount } = createTestDom("navigation");

test("ButtonList renders compact semantic actions and an accessible overflow trigger", async () => {
  const actions: string[] = [];
  const rendered = await mount(
    React.createElement(ButtonList, {
      maxCount: 2,
      items: [
        { key: "view", label: "查看", onClick: () => actions.push("view") },
        { key: "copy", label: "复制", onClick: () => actions.push("copy") },
        { key: "remove", label: "移除", onClick: () => actions.push("remove") },
      ],
    }),
  );
  try {
    assert.equal(rendered.host.querySelectorAll(".biu-ui-button-list__action").length, 1);
    await act(async () => rendered.host.querySelector<HTMLButtonElement>(".biu-ui-button-list__action")?.click());
    assert.deepEqual(actions, ["view"]);
    const overflow = rendered.host.querySelector<HTMLButtonElement>('button[aria-label="更多操作"]');
    assert.ok(overflow);
    assert.equal(overflow.getAttribute("aria-label"), "更多操作");
    assert.ok(rendered.host.querySelector(".biu-ui-dropdown"));
  } finally {
    await unmount(rendered);
  }
});

test("ButtonList keeps custom toolbar labels and supports explicit icon-only row actions", async () => {
  const icon = React.createElement("span", { "data-testid": "action-icon" }, "•");
  const textList = await mount(
    React.createElement(ButtonList, {
      maxCount: 2,
      items: [
        { key: "view", label: "查看", icon },
        { key: "copy", label: "复制", icon },
        { key: "remove", label: "移除", icon },
      ],
    }),
  );
  try {
    const visible = textList.host.querySelector<HTMLButtonElement>(".biu-ui-button-list__action");
    assert.ok(visible);
    assert.equal(visible.textContent, "•查看");
    assert.equal(visible.classList.contains("biu-ui-button-list__action--icon-only"), false);
    await act(async () => textList.host.querySelector<HTMLButtonElement>('button[aria-label="更多操作"]')?.click());
    assert.equal(document.body.querySelectorAll(".biu-ui-dropdown-menu__icon").length, 0);
  } finally {
    await unmount(textList);
  }

  const iconList = await mount(
    React.createElement(ButtonList, {
      iconOnly: true,
      items: [{ key: "view", label: "查看", icon }],
    }),
  );
  try {
    const button = iconList.host.querySelector<HTMLButtonElement>(".biu-ui-button-list__action");
    assert.ok(button);
    assert.equal(button.textContent, "•");
    assert.equal(button.classList.contains("biu-ui-button-list__action--icon-only"), true);
    assert.equal(button.querySelector<HTMLElement>(".biu-ui-button__icon")?.style.width, "15px");
  } finally {
    await unmount(iconList);
  }
});

test("ButtonList reserves the final maxCount slot for overflow", async () => {
  const rendered = await mount(
    React.createElement(ButtonList, {
      maxCount: 3,
      iconOnly: true,
      items: [
        { key: "view", label: "查看", icon: React.createElement("span", null, "V") },
        { key: "edit", label: "编辑", icon: React.createElement("span", null, "E") },
        { key: "remove", label: "删除", icon: React.createElement("span", null, "D") },
      ],
    }),
  );
  try {
    assert.equal(rendered.host.querySelectorAll(".biu-ui-button-list__action").length, 2);
    assert.ok(rendered.host.querySelector('button[aria-label="更多操作"]'));
  } finally {
    await unmount(rendered);
  }
});

test("ButtonList uses the compact action limit below 800px and one slot below 560px", async () => {
  const originalWidth = window.innerWidth;
  const originalMatchMedia = window.matchMedia;
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (media: string) =>
      ({
        media,
        matches: media === "(max-width: 799px)" || media === "(max-width: 559px)",
        addEventListener() {},
        removeEventListener() {},
      }) as unknown as MediaQueryList,
  });
  const rendered = await mount(
    React.createElement(ButtonList, {
      iconOnly: true,
      items: [
        { key: "view", label: "查看", icon: React.createElement("span", null, "V") },
        { key: "edit", label: "编辑", icon: React.createElement("span", null, "E") },
      ],
    }),
  );
  try {
    assert.equal(rendered.host.querySelectorAll(".biu-ui-button-list__action").length, 0);
    assert.ok(rendered.host.querySelector('button[aria-label="更多操作"]'));
  } finally {
    await unmount(rendered);
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    if (originalMatchMedia) {
      Object.defineProperty(window, "matchMedia", { configurable: true, value: originalMatchMedia });
    } else {
      Reflect.deleteProperty(window, "matchMedia");
    }
  }
});

test("ButtonList honors configured limits before responsive defaults at every viewport", async () => {
  const originalWidth = window.innerWidth;
  const originalMatchMedia = window.matchMedia;
  const cases = [
    { width: 390, maxCount: 6, expectedActions: 4, overflow: false },
    { width: 390, maxCount: 2, expectedActions: 1, overflow: true },
    { width: 700, maxCount: 6, compactMaxCount: 2, expectedActions: 1, overflow: true },
  ];
  try {
    for (const { width, maxCount, compactMaxCount, expectedActions, overflow } of cases) {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: (media: string) =>
          ({
            media,
            matches: media === "(max-width: 799px)" ? width < 800 : width < 560,
            addEventListener() {},
            removeEventListener() {},
          }) as unknown as MediaQueryList,
      });
      const rendered = await mount(
        React.createElement(ButtonList, {
          iconOnly: true,
          maxCount,
          compactMaxCount,
          items: ["查看", "编辑", "复制", "删除"].map((label) => ({
            key: label,
            label,
            icon: React.createElement("span", null, label.slice(0, 1)),
          })),
        }),
      );
      try {
        assert.equal(rendered.host.querySelectorAll(".biu-ui-button-list__action").length, expectedActions);
        assert.equal(Boolean(rendered.host.querySelector('button[aria-label="更多操作"]')), overflow);
      } finally {
        await unmount(rendered);
      }
    }
  } finally {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    if (originalMatchMedia) {
      Object.defineProperty(window, "matchMedia", { configurable: true, value: originalMatchMedia });
    } else {
      Reflect.deleteProperty(window, "matchMedia");
    }
  }
});

test("ButtonList uses responsive action-column maxCount markers and honors explicit limits", async () => {
  const originalWidth = window.innerWidth;
  const originalMatchMedia = window.matchMedia;
  const cases = [
    { width: 1000, maxCount: 5, visible: 4 },
    { width: 700, maxCount: 3, visible: 2 },
    { width: 390, maxCount: 1, visible: 0 },
  ];
  try {
    for (const { width, maxCount, visible } of cases) {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: (media: string) =>
          ({
            media,
            matches: media === "(max-width: 799px)" ? width < 800 : width < 560,
            addEventListener() {},
            removeEventListener() {},
          }) as unknown as MediaQueryList,
      });
      const rendered = await mount(
        React.createElement(
          "table",
          null,
          React.createElement(
            "tbody",
            null,
            React.createElement(
              "tr",
              null,
              React.createElement(
                "td",
                { "data-biu-table-action-limit": maxCount },
                React.createElement(ButtonList, {
                  iconOnly: true,
                  items: ["查看", "编辑", "复制", "启用", "停用", "删除"].map((label) => ({
                    key: label,
                    label,
                    icon: React.createElement("span", null, label.slice(0, 1)),
                  })),
                }),
              ),
            ),
          ),
        ),
      );
      try {
        assert.equal(rendered.host.querySelectorAll(".biu-ui-button-list__action").length, visible);
        assert.ok(rendered.host.querySelector('button[aria-label="更多操作"]'));
      } finally {
        await unmount(rendered);
      }
    }

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (media: string) =>
        ({
          media,
          matches: media === "(max-width: 799px)" || media === "(max-width: 559px)",
          addEventListener() {},
          removeEventListener() {},
        }) as unknown as MediaQueryList,
    });
    const customized = await mount(
      React.createElement(
        "table",
        null,
        React.createElement(
          "tbody",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement(
              "td",
              { "data-biu-table-action-limit": 5 },
              React.createElement(ButtonList, {
                iconOnly: true,
                maxCount: 2,
                items: ["查看", "编辑", "复制"].map((label) => ({
                  key: label,
                  label,
                  icon: React.createElement("span", null, label.slice(0, 1)),
                })),
              }),
            ),
          ),
        ),
      ),
    );
    try {
      assert.equal(customized.host.querySelectorAll(".biu-ui-button-list__action").length, 1);
      assert.ok(customized.host.querySelector('button[aria-label="更多操作"]'));
    } finally {
      await unmount(customized);
    }
  } finally {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    if (originalMatchMedia) {
      Object.defineProperty(window, "matchMedia", { configurable: true, value: originalMatchMedia });
    } else {
      Reflect.deleteProperty(window, "matchMedia");
    }
  }
});

test("ButtonList applies compactMaxCount only in compact viewports and keeps the Table limit elsewhere", async () => {
  const originalWidth = window.innerWidth;
  const originalMatchMedia = window.matchMedia;
  const cases = [
    { width: 1000, tableLimit: 5, expectedActions: 4 },
    { width: 700, tableLimit: 3, expectedActions: 1 },
  ];
  try {
    for (const { width, tableLimit, expectedActions } of cases) {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: (media: string) =>
          ({
            media,
            matches: media === "(max-width: 799px)" ? width < 800 : width < 560,
            addEventListener() {},
            removeEventListener() {},
          }) as unknown as MediaQueryList,
      });
      const rendered = await mount(
        React.createElement(
          "table",
          null,
          React.createElement(
            "tbody",
            null,
            React.createElement(
              "tr",
              null,
              React.createElement(
                "td",
                { "data-biu-table-action-limit": tableLimit },
                React.createElement(ButtonList, {
                  iconOnly: true,
                  compactMaxCount: 2,
                  items: ["查看", "编辑", "复制", "启用", "停用", "删除"].map((label) => ({
                    key: label,
                    label,
                    icon: React.createElement("span", null, label.slice(0, 1)),
                  })),
                }),
              ),
            ),
          ),
        ),
      );
      try {
        assert.equal(rendered.host.querySelectorAll(".biu-ui-button-list__action").length, expectedActions);
        assert.ok(rendered.host.querySelector('button[aria-label="更多操作"]'));
      } finally {
        await unmount(rendered);
      }
    }
  } finally {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    if (originalMatchMedia) {
      Object.defineProperty(window, "matchMedia", { configurable: true, value: originalMatchMedia });
    } else {
      Reflect.deleteProperty(window, "matchMedia");
    }
  }
});

test("Pagination follows the small, medium, and standard responsive breakpoints", async () => {
  const originalWidth = window.innerWidth;
  const originalMatchMedia = window.matchMedia;
  const cases = [
    { width: 559, mode: "small", controlWidth: "45px", showFullPages: false, showTotal: false },
    { width: 560, mode: "medium", controlWidth: "45px", showFullPages: true, showTotal: false },
    { width: 799, mode: "medium", controlWidth: "45px", showFullPages: true, showTotal: false },
    { width: 800, mode: "large", controlWidth: "90px", showFullPages: true, showTotal: true },
  ] as const;

  try {
    for (const { width, mode, controlWidth, showFullPages, showTotal } of cases) {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: (media: string) =>
          ({
            media,
            matches: media === "(max-width: 559px)" ? width <= 559 : media === "(max-width: 799px)" && width <= 799,
            addEventListener() {},
            removeEventListener() {},
          }) as unknown as MediaQueryList,
      });
      const rendered = await mount(
        React.createElement(Pagination, {
          current: 3,
          pageSize: 20,
          total: 200,
          showSizeChanger: true,
          showQuickJumper: true,
          quickJumperWidth: 90,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`,
        }),
      );

      try {
        const pagination = rendered.host.querySelector<HTMLElement>(".biu-ui-pagination");
        const jumper = rendered.host.querySelector<HTMLElement>(".biu-ui-pagination__jumper");
        assert.ok(pagination);
        assert.ok(jumper);
        assert.equal(
          pagination.style.getPropertyValue("--biu-pagination-control-width"),
          controlWidth,
          `${width}px ${mode}`,
        );
        assert.match(jumper.getAttribute("style") ?? "", new RegExp(`--biu-pagination-jumper-width: ${controlWidth}`));
        assert.equal(
          Boolean(pagination.querySelector('button[aria-label="页 1"]')),
          showFullPages,
          `${width}px page list`,
        );
        assert.equal(Boolean(pagination.querySelector(".biu-ui-pagination__total")), showTotal, `${width}px total`);
      } finally {
        await unmount(rendered);
      }
    }
  } finally {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    if (originalMatchMedia) {
      Object.defineProperty(window, "matchMedia", { configurable: true, value: originalMatchMedia });
    } else {
      Reflect.deleteProperty(window, "matchMedia");
    }
  }
});
