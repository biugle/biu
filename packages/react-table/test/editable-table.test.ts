import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { EditableTable } from "../src/index.js";
import "./fixtures/table-functional.js";

test("EditableTable enters a text editor on double click and saves on blur", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let changed: unknown;
  await act(async () =>
    root.render(
      React.createElement(EditableTable<{ id: number; name: string }>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name", editable: { type: "text" } }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "初始值" }],
        onChange: (data) => {
          changed = data[0]?.name;
        },
      }),
    ),
  );
  try {
    const cell = host.querySelector<HTMLElement>(".biu-editable-table__cell");
    assert.ok(cell);
    await act(async () => cell.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    const input = host.querySelector<HTMLInputElement>("input");
    assert.ok(input);
    await act(async () => {
      input.value = "已修改";
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    assert.equal(changed, "已修改");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("EditableTable cancels a queued blur save when the edit session is cancelled", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: unknown[] = [];
  await act(async () =>
    root.render(
      React.createElement(EditableTable<{ id: number; name: string }>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name", editable: { type: "text" } }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "初始值" }],
        onChange: (data) => changes.push(data[0]?.name),
      }),
    ),
  );
  try {
    const cell = host.querySelector<HTMLElement>(".biu-editable-table__cell");
    assert.ok(cell);
    await act(async () => cell.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    const input = host.querySelector<HTMLInputElement>("input");
    assert.ok(input);
    input.value = "不应保存";
    await act(async () => {
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
      const cancel = host.querySelector<HTMLButtonElement>('button[aria-label="取消编辑"]');
      cancel?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      cancel?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual(changes, []);
    assert.equal(host.querySelector(".biu-editable-table__editor"), null);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("EditableTable exposes mouse cancel, clear and save actions", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: unknown[] = [];
  await act(async () =>
    root.render(
      React.createElement(EditableTable<{ id: number; name: string }>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name", editable: { type: "text" } }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "初始值" }],
        onChange: (data) => changes.push(data[0]?.name),
      }),
    ),
  );
  try {
    const cell = host.querySelector<HTMLElement>(".biu-editable-table__cell");
    assert.ok(cell);
    await act(async () => cell.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    assert.equal(host.querySelectorAll("button[aria-label]").length >= 3, true);
    for (const label of ["取消编辑", "清空编辑值", "保存编辑"]) {
      assert.ok(host.querySelector(`button[aria-label="${label}"].biu-ui-button--variant-outlined`));
    }
    await act(async () => {
      const button = host.querySelector<HTMLButtonElement>('button[aria-label="取消编辑"]');
      button?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    assert.deepEqual(changes, []);

    await act(async () => cell.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    const input = host.querySelector<HTMLInputElement>("input");
    assert.ok(input);
    await act(async () => {
      input.value = "待清空";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      const button = host.querySelector<HTMLButtonElement>('button[aria-label="清空编辑值"]');
      button?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(host.querySelectorAll("button[aria-label]").length >= 3, true);
    assert.equal(document.activeElement, host.querySelector(".biu-editable-table__editor input"));
    await act(async () => {
      const button = host.querySelector<HTMLButtonElement>('button[aria-label="保存编辑"]');
      button?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    assert.equal(changes.at(-1), "");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("EditableTable exposes action callbacks without changing the default edit flow", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const actions: string[] = [];
  await act(async () =>
    root.render(
      React.createElement(EditableTable<{ id: number; name: string }>, {
        columns: [{ key: "name", title: "名称", dataIndex: "name", editable: { type: "text" } }],
        rowKey: "id",
        dataSource: [{ id: 1, name: "初始值" }],
        onEditAction: ({ action }) => actions.push(action),
        onEditStart: () => actions.push("start-specific"),
        onEditClear: () => actions.push("clear-specific"),
      }),
    ),
  );
  try {
    const cell = host.querySelector<HTMLElement>(".biu-editable-table__cell");
    assert.ok(cell);
    await act(async () => cell.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    const clear = host.querySelector<HTMLButtonElement>('button[aria-label="清空编辑值"]');
    assert.ok(clear);
    await act(async () => {
      clear.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      clear.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    assert.deepEqual(actions.slice(0, 4), ["start", "start-specific", "clear", "clear-specific"]);
    assert.equal(host.querySelector(".biu-editable-table__editor") !== null, true);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});
