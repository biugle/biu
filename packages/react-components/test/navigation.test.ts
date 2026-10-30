import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { Transfer, Tree, type TransferItem } from "../src/ui/index.js";
import { createTestDom } from "./fixtures/react-dom.js";

const { mount, unmount } = createTestDom("navigation");

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

test("Tree selection marks the full node and keeps the selected title color", async () => {
  const rendered = await mount(
    React.createElement(Tree, {
      data: [{ key: "root", title: "根节点" }],
      selectedKeys: ["root"],
    }),
  );
  try {
    const node = rendered.host.querySelector<HTMLElement>(".biu-ui-tree__node");
    const title = rendered.host.querySelector<HTMLElement>(".biu-ui-tree__title");
    assert.ok(node?.classList.contains("is-active"));
    assert.ok(title?.classList.contains("is-active"));
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

test("Tree checks all descendants from the source tree after searching", async () => {
  let checked: string[] = [];
  const rendered = await mount(
    React.createElement(Tree, {
      data: [
        {
          key: "root",
          title: "根节点",
          children: [
            { key: "visible", title: "匹配节点" },
            { key: "hidden", title: "未匹配节点" },
          ],
        },
      ],
      showSearch: true,
      searchValue: "匹配",
      checkable: true,
      onCheck: (keys: string[]) => {
        checked = keys;
      },
    }),
  );
  try {
    const rootCheckbox = rendered.host.querySelector<HTMLInputElement>('input[type="checkbox"]');
    assert.ok(rootCheckbox);
    await act(async () => rootCheckbox.click());
    assert.deepEqual(checked, ["root", "visible", "hidden"]);

    const visibleCheckbox = rendered.host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[1];
    assert.ok(visibleCheckbox);
    await act(async () => visibleCheckbox.click());
    const nextRootCheckbox = rendered.host.querySelector<HTMLInputElement>('input[type="checkbox"]');
    assert.equal(nextRootCheckbox?.checked, false);
    assert.equal(nextRootCheckbox?.indeterminate, true);
    assert.deepEqual(checked, ["root", "hidden"]);
  } finally {
    await unmount(rendered);
  }
});

test("Tree recalculates the parent after selecting all before a search", async () => {
  let checked: string[] = [];
  const data = [
    {
      key: "root",
      title: "组件库",
      children: [
        { key: "ui", title: "UI", children: [{ key: "control", title: "表单控件" }] },
        { key: "pro", title: "Pro" },
      ],
    },
  ];
  const rendered = await mount(
    React.createElement(Tree, {
      data,
      showSearch: true,
      defaultExpandedKeys: ["root", "ui"],
      defaultCheckedKeys: ["ui"],
      checkable: true,
      onCheck: (keys: string[]) => {
        checked = keys;
      },
    }),
  );
  try {
    const checkboxes = () => rendered.host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    await act(async () => checkboxes()[0]?.click());
    assert.deepEqual(checked, ["ui", "root", "control", "pro"]);

    await act(async () => {
      rendered.root.render(
        React.createElement(Tree, {
          data,
          showSearch: true,
          searchValue: "pro",
          defaultExpandedKeys: ["root", "ui"],
          defaultCheckedKeys: ["ui"],
          checkable: true,
          onCheck: (keys: string[]) => {
            checked = keys;
          },
        }),
      );
    });
    assert.equal(checkboxes().length, 2);
    assert.equal(checkboxes()[0]?.checked, true);

    await act(async () => checkboxes()[1]?.click());
    assert.deepEqual(checked, ["ui", "root", "control"]);
    assert.equal(checkboxes()[0]?.checked, false);
    assert.equal(checkboxes()[0]?.indeterminate, true);

    await act(async () => checkboxes()[0]?.click());
    assert.deepEqual(checked, ["ui", "root", "control", "pro"]);
    assert.equal(checkboxes()[0]?.checked, true);
    assert.equal(checkboxes()[0]?.indeterminate, false);

    await act(async () => checkboxes()[0]?.click());
    assert.deepEqual(checked, []);
    assert.equal(checkboxes()[0]?.checked, false);
    assert.equal(checkboxes()[0]?.indeterminate, false);
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

test("Transfer renders custom item actions and defaults to a right-side remove action", async () => {
  const changes: string[][] = [];
  const rendered = await mount(
    React.createElement(Transfer, {
      source: [
        { label: "平台", value: "platform" },
        { label: "组件", value: "components" },
        { label: "Runtime", value: "runtime" },
      ],
      defaultTarget: [{ label: "Runtime", value: "runtime" }],
      onChange: (items: Array<{ value: string }>) => changes.push(items.map((item) => item.value)),
      itemActions: (item: { value: string }, direction: "left" | "right") =>
        direction === "left"
          ? React.createElement("button", { "aria-label": `查看 ${item.value}` }, "查看")
          : undefined,
    }),
  );
  try {
    assert.equal(rendered.host.querySelectorAll('[aria-label="查看 platform"]').length, 1);
    const remove = rendered.host.querySelector<HTMLButtonElement>('[aria-label="移除"]');
    assert.ok(remove);
    await act(async () => remove.click());
    assert.deepEqual(changes.at(-1), []);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-transfer__list")[1]?.textContent?.includes("Runtime"), false);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-transfer__list")[0]?.textContent?.includes("Runtime"), true);
  } finally {
    await unmount(rendered);
  }
});

test("Transfer oneWay disables the default right-side remove action", async () => {
  const rendered = await mount(
    React.createElement(Transfer, {
      source: [{ label: "平台", value: "platform" }],
      defaultTarget: [{ label: "Runtime", value: "runtime" }],
      oneWay: true,
    }),
  );
  try {
    assert.equal(rendered.host.querySelectorAll('[aria-label="移除"]').length, 0);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-transfer__operations button").length, 1);
  } finally {
    await unmount(rendered);
  }
});

test("Transfer default remove action updates a controlled target when the parent applies onChange", async () => {
  function ControlledTransfer() {
    const [target, setTarget] = React.useState<TransferItem[]>([{ label: "Runtime", value: "runtime" }]);
    return React.createElement(Transfer, {
      source: [{ label: "Runtime", value: "runtime" }],
      target,
      onChange: setTarget,
    });
  }
  const rendered = await mount(React.createElement(ControlledTransfer));
  try {
    const remove = rendered.host.querySelector<HTMLButtonElement>('[aria-label="移除"]');
    assert.ok(remove);
    await act(async () => remove.click());
    const lists = rendered.host.querySelectorAll(".biu-ui-transfer__list");
    assert.equal(lists[0]?.textContent?.includes("Runtime"), true);
    assert.equal(lists[1]?.textContent?.includes("Runtime"), false);
  } finally {
    await unmount(rendered);
  }
});

test("Transfer preserves an externally supplied target value as a disabled removable item", async () => {
  let target: TransferItem[] = [{ label: "外部值", value: "external" }];
  const changes: string[][] = [];
  const rendered = await mount(
    React.createElement(Transfer, {
      source: [{ label: "平台", value: "platform" }],
      target,
      onChange: (next: TransferItem[]) => {
        target = next;
        changes.push(next.map((item) => item.value));
      },
    }),
  );
  try {
    const orphanCheckbox = rendered.host.querySelector<HTMLInputElement>(
      '.biu-ui-transfer__list:nth-of-type(2) .biu-ui-transfer__item input[type="checkbox"]',
    );
    assert.ok(orphanCheckbox);
    assert.equal(orphanCheckbox.disabled, true);
    const remove = rendered.host.querySelector<HTMLButtonElement>('[aria-label="移除"]');
    assert.ok(remove);
    await act(async () => remove.click());
    assert.deepEqual(changes.at(-1), []);
  } finally {
    await unmount(rendered);
  }
});
