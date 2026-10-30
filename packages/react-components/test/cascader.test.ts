import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { Cascader, type CascaderOption } from "../src/ui/index.js";
import { createTestDom } from "./fixtures/react-dom.js";

const { mount, unmount } = createTestDom("input");

test("Cascader searches each level independently and keeps the selected path", async () => {
  const changes: string[][] = [];
  const rendered = await mount(
    React.createElement(Cascader, {
      defaultOpen: true,
      searchable: true,
      options: [
        { label: "华东", value: "east", children: [{ label: "上海", value: "shanghai" }] },
        { label: "华南", value: "south", children: [{ label: "深圳", value: "shenzhen" }] },
      ],
      onChange: (next: string[]) => changes.push(next),
    }),
  );
  try {
    const input = document.querySelector<HTMLInputElement>(".biu-ui-cascader__column-search input");
    assert.ok(input);
    await act(async () => {
      input.value = "华南";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const rootOption = [...document.querySelectorAll<HTMLButtonElement>(".biu-ui-cascader__option")].find(
      (button) => button.textContent === "华南",
    );
    assert.ok(rootOption);
    await act(async () => rootOption.click());
    const levelInput = document.querySelectorAll<HTMLInputElement>(".biu-ui-cascader__column-search input")[1];
    assert.ok(levelInput);
    await act(async () => {
      levelInput.value = "深圳";
      levelInput.dispatchEvent(new Event("input", { bubbles: true }));
      levelInput.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const result = [...document.querySelectorAll<HTMLButtonElement>(".biu-ui-cascader__option")].find(
      (button) => button.textContent === "深圳",
    );
    assert.ok(result);
    await act(async () => result.click());
    assert.deepEqual(changes, [["south", "shenzhen"]]);
    assert.equal(rendered.host.querySelector(".biu-ui-cascader")?.getAttribute("data-state"), "closed");
  } finally {
    await unmount(rendered);
  }
});

test("Cascader loads children on demand before opening the next level", async () => {
  let loads = 0;
  const changes: string[][] = [];
  const rendered = await mount(
    React.createElement(Cascader, {
      defaultOpen: true,
      options: [{ label: "远程区域", value: "remote", hasChildren: true }],
      loadChildren: async () => {
        loads += 1;
        return [{ label: "远程节点", value: "node", isLeaf: true }];
      },
      onChange: (next: string[]) => changes.push(next),
    }),
  );
  try {
    const rootOption = document.querySelector<HTMLButtonElement>(".biu-ui-cascader__option");
    assert.ok(rootOption);
    await act(async () => rootOption.click());
    assert.equal(loads, 1);
    assert.equal(document.querySelectorAll(".biu-ui-cascader__column").length, 2);
    const childOption = [...document.querySelectorAll<HTMLButtonElement>(".biu-ui-cascader__option")].find(
      (button) => button.textContent === "远程节点",
    );
    assert.ok(childOption);
    await act(async () => childOption.click());
    assert.deepEqual(changes, [["remote", "node"]]);
    const trigger = rendered.host.querySelector<HTMLButtonElement>(".biu-ui-cascader__trigger");
    assert.ok(trigger);
    await act(async () => trigger.click());
    assert.equal(rendered.host.querySelector(".biu-ui-cascader")?.getAttribute("data-state"), "open");
    assert.equal(document.querySelectorAll(".biu-ui-cascader__column").length, 2);
  } finally {
    await unmount(rendered);
  }
});

test("Cascader keeps parent selection open and caps the panel at six levels", async () => {
  const changes: string[][] = [];
  const makeNode = (level: number): CascaderOption => ({
    label: `第 ${level} 层`,
    value: `level-${level}`,
    ...(level < 7 ? { children: [makeNode(level + 1)] } : {}),
  });
  const rendered = await mount(
    React.createElement(Cascader, {
      defaultOpen: true,
      options: [makeNode(1)],
      onChange: (next: string[]) => changes.push(next),
    }),
  );
  try {
    for (let level = 1; level <= 5; level += 1) {
      const option = [...document.querySelectorAll<HTMLButtonElement>(".biu-ui-cascader__option")].find(
        (button) => button.textContent === `第 ${level} 层`,
      );
      assert.ok(option);
      await act(async () => option.click());
      assert.equal(rendered.host.querySelector(".biu-ui-cascader")?.getAttribute("data-state"), "open");
    }
    assert.equal(document.querySelectorAll(".biu-ui-cascader__column").length, 6);
    const lastOption = [...document.querySelectorAll<HTMLButtonElement>(".biu-ui-cascader__option")].find(
      (button) => button.textContent === "第 6 层",
    );
    assert.ok(lastOption);
    await act(async () => lastOption.click());
    assert.deepEqual(changes, [["level-1", "level-2", "level-3", "level-4", "level-5", "level-6"]]);
    assert.equal(rendered.host.querySelector(".biu-ui-cascader")?.getAttribute("data-state"), "closed");
  } finally {
    await unmount(rendered);
  }
});

test("Cascader appends lazy pages in the active column", async () => {
  let moreLoads = 0;
  const rendered = await mount(
    React.createElement(Cascader, {
      defaultOpen: true,
      searchable: true,
      searchLevels: [1],
      options: [{ label: "远程目录", value: "remote", hasChildren: true }],
      loadChildren: async () => [{ label: "初始节点", value: "initial", isLeaf: true }],
      hasMore: true,
      loadMoreTrigger: "both",
      loadMoreChildren: async () => {
        moreLoads += 1;
        return [{ label: "追加节点", value: "appended", isLeaf: true }];
      },
    }),
  );
  try {
    const rootOption = document.querySelector<HTMLButtonElement>(".biu-ui-cascader__option");
    assert.ok(rootOption);
    await act(async () => rootOption.click());
    const loadButton = document.querySelector<HTMLButtonElement>(".biu-ui-cascader__load-more");
    assert.ok(loadButton);
    await act(async () => loadButton.click());
    assert.equal(moreLoads, 1);
    assert.ok(
      [...document.querySelectorAll(".biu-ui-cascader__option")].some((item) => item.textContent === "追加节点"),
    );
  } finally {
    await unmount(rendered);
  }
});
