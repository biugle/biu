import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ButtonList, Transfer, Tree } from "../src/ui/index.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
  HTMLSelectElement: dom.window.HTMLSelectElement,
  DocumentFragment: dom.window.DocumentFragment,
  Node: dom.window.Node,
  Event: dom.window.Event,
  CustomEvent: dom.window.CustomEvent,
  KeyboardEvent: dom.window.KeyboardEvent,
  MouseEvent: dom.window.MouseEvent,
  PointerEvent: dom.window.PointerEvent ?? dom.window.MouseEvent,
  MutationObserver: dom.window.MutationObserver,
  getComputedStyle: dom.window.getComputedStyle,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
Object.assign(dom.window, {
  requestAnimationFrame: (callback: FrameRequestCallback) => dom.window.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => dom.window.clearTimeout(id),
});
Object.assign(globalThis, {
  requestAnimationFrame: (callback: FrameRequestCallback) => dom.window.setTimeout(callback, 0),
  cancelAnimationFrame: (id: number) => dom.window.clearTimeout(id),
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

test("Tree supports controlled selection, strict checking and contained async load errors", async () => {
  const selected: string[][] = [];
  const checked: Array<{ keys: string[]; half: string[] }> = [];
  const loadErrors: string[] = [];
  const rendered = await mount(
    React.createElement(Tree, {
      data: [{ key: "root", title: "根节点", isLeaf: false }],
      defaultExpandedKeys: [],
      defaultSelectedKeys: ["root"],
      checkable: true,
      checkStrictly: true,
      loadData: async () => {
        throw new Error("load failed");
      },
      onLoadError: (error: unknown) => loadErrors.push(String((error as Error).message)),
      onSelect: (keys: string[]) => selected.push(keys),
      onCheck: (keys: string[], info: { halfCheckedKeys: string[] }) =>
        checked.push({ keys, half: info.halfCheckedKeys }),
    }),
  );
  try {
    const title = rendered.host.querySelector<HTMLButtonElement>(
      ".biu-ui-tree__node > button:not(.biu-ui-tree__toggle)",
    );
    const toggle = rendered.host.querySelector<HTMLButtonElement>(".biu-ui-tree__toggle");
    const checkbox = rendered.host.querySelector<HTMLInputElement>('input[type="checkbox"]');
    assert.ok(title);
    assert.ok(toggle);
    assert.ok(checkbox);
    await act(async () => title.click());
    assert.deepEqual(selected.at(-1), ["root"]);
    await act(async () => {
      toggle.click();
      await Promise.resolve();
    });
    assert.deepEqual(loadErrors, ["load failed"]);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-tree__node").length, 1);
    await act(async () => checkbox.click());
    assert.deepEqual(checked.at(-1), { keys: ["root"], half: [] });
  } finally {
    await unmount(rendered);
  }
});

test("Transfer manages its target queue when target is uncontrolled", async () => {
  const moved: string[][] = [];
  const rendered = await mount(
    React.createElement(Transfer, {
      source: [
        { label: "平台", value: "platform" },
        { label: "组件", value: "components" },
      ],
      defaultTarget: [{ label: "Runtime", value: "runtime" }],
      onChange: (items: Array<{ value: string }>) => moved.push(items.map((item) => item.value)),
    }),
  );
  try {
    const checkboxes = rendered.host.querySelectorAll<HTMLInputElement>(
      '.biu-ui-transfer__items input[type="checkbox"]',
    );
    assert.equal(checkboxes.length, 3);
    await act(async () => checkboxes[0]?.click());
    const buttons = rendered.host.querySelectorAll<HTMLButtonElement>(".biu-ui-transfer__operations button");
    assert.equal(buttons[0]?.disabled, false);
    await act(async () => buttons[0]?.click());
    assert.deepEqual(moved.at(-1), ["runtime", "platform"]);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-transfer__list")[1]?.textContent?.includes("平台"), true);
  } finally {
    await unmount(rendered);
  }
});

test("Tree and Transfer preserve root and slot className contracts", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(Tree, {
        data: [{ key: "root", title: "根节点", icon: React.createElement("i", null, "图") }],
        className: "tree-custom",
        classNames: { node: "tree-node-custom", icon: "tree-icon-custom", title: "tree-title-custom" },
      }),
      React.createElement(Transfer, {
        source: [{ label: "平台", value: "platform" }],
        className: "transfer-custom",
        classNames: {
          list: "transfer-list-custom",
          header: "transfer-header-custom",
          items: "transfer-items-custom",
          item: "transfer-item-custom",
          operations: "transfer-operations-custom",
        },
      }),
    ),
  );
  try {
    assert.ok(rendered.host.querySelector(".biu-ui-tree.tree-custom"));
    assert.ok(rendered.host.querySelector(".biu-ui-tree__node.tree-node-custom"));
    assert.ok(rendered.host.querySelector(".biu-ui-tree__icon.tree-icon-custom"));
    assert.ok(rendered.host.querySelector(".biu-ui-tree__title.tree-title-custom"));
    assert.ok(rendered.host.querySelector(".biu-ui-transfer.transfer-custom"));
    assert.equal(rendered.host.querySelectorAll(".biu-ui-transfer__list.transfer-list-custom").length, 2);
    assert.ok(rendered.host.querySelector(".biu-ui-transfer__header.transfer-header-custom"));
    assert.ok(rendered.host.querySelector(".biu-ui-transfer__items.transfer-items-custom"));
    assert.ok(rendered.host.querySelector(".biu-ui-transfer__item.transfer-item-custom"));
    assert.ok(rendered.host.querySelector(".biu-ui-transfer__operations.transfer-operations-custom"));
  } finally {
    await unmount(rendered);
  }
});

test("Tree defaults to folder/file icons and wraps long labels with Ellipsis", async () => {
  const rendered = await mount(
    React.createElement(Tree, {
      data: [
        {
          key: "folder",
          title: "一个非常长的目录标题用于验证省略提示",
          children: [{ key: "file", title: "一个非常长的文件标题用于验证省略提示" }],
        },
      ],
      defaultExpandedKeys: ["folder"],
    }),
  );
  try {
    assert.equal(rendered.host.querySelectorAll(".biu-ui-tree__icon > svg").length, 2);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-tree__title-label.biu-ui-ellipsis").length, 2);
  } finally {
    await unmount(rendered);
  }
});

test("Tree search keeps matching ancestors and Transfer excludes disabled items from bulk moves", async () => {
  const moved: string[][] = [];
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(Tree, {
        data: [
          {
            key: "platform",
            title: "平台",
            children: [{ key: "components", title: "组件" }],
          },
        ],
        showSearch: true,
        searchValue: "组件",
        titleRender: (node: { title: React.ReactNode }) => React.createElement("b", null, node.title),
      }),
      React.createElement(Transfer, {
        source: [
          { label: "可移动", value: "movable" },
          { label: "不可移动", value: "locked", disabled: true },
        ],
        showSearch: true,
        oneWay: true,
        defaultSelectedKeys: ["movable", "locked"],
        onChange: (items: Array<{ value: string }>) => moved.push(items.map((item) => item.value)),
        footer: (_items: Array<{ value: string }>, direction: "left" | "right") =>
          React.createElement("small", null, direction === "left" ? "待选 footer" : "已选 footer"),
      }),
    ),
  );
  try {
    const search = rendered.host.querySelector<HTMLInputElement>(".biu-ui-tree__search input");
    assert.equal(search?.value, "组件");
    assert.equal(rendered.host.querySelectorAll(".biu-ui-tree__title").length, 2);
    assert.ok(
      [...rendered.host.querySelectorAll(".biu-ui-tree__title")].some((node) => node.textContent?.includes("组件")),
    );

    const transferSearch = rendered.host.querySelector<HTMLInputElement>(".biu-ui-transfer__search input");
    assert.ok(transferSearch);
    assert.equal(rendered.host.textContent?.includes("待选 footer"), true);
    const move = rendered.host.querySelector<HTMLButtonElement>(".biu-ui-transfer__operations button");
    assert.ok(move);
    await act(async () => move.click());
    assert.deepEqual(moved.at(-1), ["movable"]);
  } finally {
    await unmount(rendered);
  }
});

test("Tree does not expand or lazy-load disabled nodes", async () => {
  let loadCount = 0;
  const rendered = await mount(
    React.createElement(Tree, {
      data: [{ key: "locked", title: "锁定目录", disabled: true, isLeaf: false }],
      loadData: async () => {
        loadCount += 1;
        return [{ key: "child", title: "子节点" }];
      },
    }),
  );
  try {
    const toggle = rendered.host.querySelector<HTMLButtonElement>(".biu-ui-tree__toggle");
    assert.ok(toggle);
    assert.equal(toggle.disabled, true);
    await act(async () => toggle.click());
    assert.equal(loadCount, 0);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-tree__node").length, 1);
  } finally {
    await unmount(rendered);
  }
});

test("Transfer keeps a controlled target unchanged until the parent applies onChange", async () => {
  const target = [{ label: "Runtime", value: "runtime" }];
  const changes: string[][] = [];
  const rendered = await mount(
    React.createElement(Transfer, {
      source: [{ label: "平台", value: "platform" }],
      target,
      defaultSelectedKeys: ["platform"],
      onChange: (next: Array<{ value: string }>) => changes.push(next.map((item) => item.value)),
    }),
  );
  try {
    const move = rendered.host.querySelector<HTMLButtonElement>(".biu-ui-transfer__operations button");
    assert.ok(move);
    await act(async () => move.click());
    assert.deepEqual(changes, [["runtime", "platform"]]);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-transfer__list")[1]?.textContent?.includes("平台"), false);
  } finally {
    await unmount(rendered);
  }
});

test("Transfer keeps long labels shrinkable and searchable inside each panel", async () => {
  const rendered = await mount(
    React.createElement(Transfer, {
      showSearch: true,
      source: [{ label: "一个非常长的业务权限名称用于验证省略提示", value: "permission" }],
    }),
  );
  try {
    assert.equal(rendered.host.querySelectorAll(".biu-ui-transfer__search").length, 2);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-transfer__item-label.biu-ui-ellipsis").length, 1);
  } finally {
    await unmount(rendered);
  }
});

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
  } finally {
    await unmount(iconList);
  }
});
