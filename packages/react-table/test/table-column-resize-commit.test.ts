import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Table, type Column } from "../src/index.js";
import "./fixtures/table-functional.js";
import type { Row } from "./fixtures/table-functional.js";

test("Table cancels an in-flight drag when its viewport moves or changes width", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let commits = 0;
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 120, resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 240 },
        ],
        onColumnWidthsChange: () => commits++,
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowKey: "id",
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    let viewportLeft = 100;
    let viewportWidth = 600;
    Object.defineProperty(scroll, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: viewportLeft, width: viewportWidth }),
    });
    const handle = () => host.querySelector<HTMLElement>('[aria-label="名称列宽"]')!;
    for (const dimension of ["left", "width"]) {
      await act(async () =>
        handle().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 220, pointerId: 76 })),
      );
      if (dimension === "left") viewportLeft += 20;
      else viewportWidth += 200;
      await act(async () =>
        window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 260, pointerId: 76 })),
      );
      assert.equal(host.querySelector(".biu-table__resize-preview"), null);
      assert.equal(document.body.classList.contains("biu-table-resizing-global"), false);
      assert.equal(commits, 0);
    }
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table fillRemainingSpace false skips compensation and retains exact content widths after commit", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 240 },
          { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right" },
        ],
        fillRemainingSpace: false,
        onColumnWidthsChange: (next) => changes.push(next),
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowKey: "id",
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1000 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    const table = host.querySelector<HTMLTableElement>("table")!;
    assert.equal(table.style.width, "500px");
    const handle = host.querySelector<HTMLElement>('[aria-label="名称列宽"]')!;
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 180, pointerId: 77 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 280, pointerId: 77 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 280, pointerId: 77 }));
    });
    assert.deepEqual(changes.at(-1), { name: 280, status: 240, actions: 80 });
    assert.equal(table.style.width, "600px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "240px");
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1200 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(table.style.width, "600px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table mirrors pointer and keyboard resize directions in RTL including negative scroll offsets", async () => {
  const host = document.createElement("div");
  host.dir = "rtl";
  document.body.append(host);
  const root = createRoot(host);
  const changes: Array<Record<string, number | string>> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        dir: "rtl",
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, minWidth: 120, resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 240, minWidth: 120 },
        ],
        onColumnWidthsChange: (next) => changes.push(next),
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowKey: "id",
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    assert.equal(host.querySelector(".biu-table")?.getAttribute("dir"), "rtl");
    const handle = host.querySelector<HTMLElement>('[aria-label="名称列宽"]')!;
    handle.style.direction = "rtl";
    await act(async () =>
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 320, pointerId: 78 })),
    );
    scroll.scrollLeft = -20;
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 300, pointerId: 78 })),
    );
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "220px");
    assert.equal(host.querySelector<HTMLElement>(".biu-table__resize-preview")?.style.left, "280px");
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 300, pointerId: 78 })),
    );
    assert.deepEqual(changes.at(-1), { name: 220, status: 200 });
    await act(async () => handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" })));
    assert.deepEqual(changes.at(-1), { name: 230, status: 190 });
    await act(async () => handle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" })));
    assert.deepEqual(changes.at(-1), { name: 220, status: 200 });
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table resizes the dynamic column from its trailing handle while the previous ordinary column compensates", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const changes: Array<Record<string, number | string>> = [];
  const targets: Array<[string, number]> = [];
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: 180, resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 240, minWidth: 120, resizable: true },
          { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right" },
        ],
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowKey: "id",
        onColumnWidthsChange: (next) => changes.push(next),
        onColumnResize: (key, width) => targets.push([key, width]),
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 800 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    const table = host.querySelector<HTMLTableElement>("table")!;
    const handle = host.querySelector<HTMLElement>('[aria-label="状态列宽"]')!;
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "540px");
    assert.equal(handle.classList.contains("biu-table__resize-handle--start"), false);
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 720, pointerId: 79 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 620, pointerId: 79 }));
    });
    assert.equal(table.style.width, "800px");
    const preview = host.querySelector<HTMLElement>(".biu-table__resize-preview--column");
    assert.ok(preview, "the dynamic resize guide remains visible");
    assert.equal(preview.style.display, "");
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "0px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "180px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "540px");
    assert.equal(changes.length, 0);
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 620, pointerId: 79 })),
    );
    assert.equal(table.style.width, "800px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "280px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "440px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="actions"]')?.style.width, "80px");
    assert.equal(host.querySelector("col[data-biu-resize-fill]"), null);
    assert.deepEqual(changes, [{ name: 280, status: 440, actions: 80 }]);
    assert.deepEqual(targets, [["status", 440]]);
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1000 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(table.style.width, "1000px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "440px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "280px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table target fill protection waits for controlled acceptance, respects refusal and clears on reset", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const columns: Column<Row>[] = [
    { key: "name", title: "名称", dataIndex: "name", width: 180 },
    { key: "status", title: "状态", dataIndex: "status", width: 240, minWidth: 120, resizable: true },
    { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right" },
  ];
  const initial = { name: 180, status: 240 };
  let pending: Record<string, number | string> | undefined;
  const render = (columnWidths: Record<string, number | string>, changeGeometry = false) =>
    React.createElement(Table<Row>, {
      columns: columns.map((column) => ({
        ...column,
        render: (value: unknown) => String(value),
        minWidth: changeGeometry && column.key === "status" ? 200 : column.minWidth,
      })),
      columnWidths,
      onColumnWidthsChange: (next) => (pending = next),
      dataSource: [{ id: 1, name: "验证", status: "ready" }],
      rowKey: "id",
    });
  await act(async () => root.render(render(initial)));
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 800 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    const table = host.querySelector<HTMLTableElement>("table")!;
    const handle = host.querySelector<HTMLElement>('[aria-label="状态列宽"]')!;
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 720, pointerId: 80 }));
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 820, pointerId: 80 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 820, pointerId: 80 }));
    });
    assert.equal(table.style.width, "800px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "540px");
    assert.equal(pending?.status, 640);
    assert.equal(pending?.name, 80);
    await act(async () => root.render(render(pending!)));
    assert.equal(table.style.width, "800px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "640px");
    await act(async () => root.render(render({ ...pending! })));
    assert.equal(table.style.width, "800px");
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1000 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(table.style.width, "1000px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "640px");
    await act(async () => root.render(render(pending!, true)));
    assert.equal(table.style.width, "1000px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "840px");
    await act(async () => root.render(render(initial)));
    assert.equal(table.style.width, "1000px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "740px");
    await act(async () => root.render(render(pending!)));
    assert.equal(table.style.width, "1000px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "840px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table keeps ordinary percentage widths responsive after a no-op pointer session", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let commits = 0;
  await act(async () =>
    root.render(
      React.createElement(Table<Row>, {
        columns: [
          { key: "name", title: "名称", dataIndex: "name", width: "50%", resizable: true },
          { key: "status", title: "状态", dataIndex: "status", width: 120 },
          { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right" },
        ],
        onColumnWidthsChange: () => commits++,
        onColumnResize: () => commits++,
        dataSource: [{ id: 1, name: "验证", status: "ready" }],
        rowKey: "id",
      }),
    ),
  );
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 800 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    const handle = host.querySelector<HTMLElement>('[aria-label="名称列宽"]')!;
    await act(async () => {
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 400, pointerId: 81 }));
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 400, pointerId: 81 }));
    });
    assert.equal(commits, 0);
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "400px");
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 1000 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "500px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table commits a live final width after an equivalent parent rerender without restoring stale DOM", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let rerender!: () => void;
  function ControlledTable() {
    const [widths, setWidths] = React.useState<Record<string, number | string>>({ name: 180, status: 240 });
    const [, setRenderCount] = React.useState(0);
    rerender = () => setRenderCount((count) => count + 1);
    return React.createElement(Table<Row>, {
      columns: [
        { key: "name", title: "名称", dataIndex: "name", width: 180 },
        { key: "status", title: "状态", dataIndex: "status", width: 240, minWidth: 120, resizable: true },
        { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right" },
      ],
      columnWidths: { ...widths },
      onColumnWidthsChange: setWidths,
      dataSource: [{ id: 1, name: "验证", status: "ready" }],
      rowKey: "id",
    });
  }
  await act(async () => root.render(React.createElement(ControlledTable)));
  try {
    const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
    Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 800 });
    await act(async () => window.dispatchEvent(new Event("resize")));
    const table = host.querySelector<HTMLTableElement>("table")!;
    const handle = host.querySelector<HTMLElement>('[aria-label="状态列宽"]')!;
    await act(async () =>
      handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 720, pointerId: 82 })),
    );
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 820, pointerId: 82 })),
    );
    await act(async () => rerender());
    assert.equal(table.style.width, "800px");
    assert.equal(host.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width, "0px");
    await act(async () =>
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 820, pointerId: 82 })),
    );
    assert.equal(table.style.width, "800px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="status"]')?.style.width, "640px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="name"]')?.style.width, "80px");
    assert.equal(host.querySelector<HTMLTableColElement>('col[data-biu-column-key="actions"]')?.style.width, "80px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Table always cleans a committed resize when an external callback throws", async () => {
  const failures: string[] = [];
  const captureError = (event: ErrorEvent) => {
    failures.push(event.message);
    event.preventDefault();
  };
  window.addEventListener("error", captureError);
  try {
    for (const stage of ["widths", "resize"]) {
      const host = document.createElement("div");
      document.body.append(host);
      const root = createRoot(host);
      const fail = () => {
        throw new Error(`Resize ${stage} callback failed`);
      };
      await act(async () =>
        root.render(
          React.createElement(Table<Row>, {
            columns: [
              { key: "name", title: "名称", dataIndex: "name", width: 180 },
              { key: "status", title: "状态", dataIndex: "status", width: 240, minWidth: 120, resizable: true },
              { key: "actions", title: "操作", dataIndex: "status", width: 80, fixed: "right" },
            ],
            onColumnWidthsChange: stage === "widths" ? fail : undefined,
            onColumnResize: stage === "resize" ? fail : undefined,
            dataSource: [{ id: 1, name: "验证", status: "ready" }],
            rowKey: "id",
          }),
        ),
      );
      try {
        const scroll = host.querySelector<HTMLElement>(".biu-table__scroll")!;
        Object.defineProperty(scroll, "clientWidth", { configurable: true, value: 800 });
        await act(async () => window.dispatchEvent(new Event("resize")));
        const handle = host.querySelector<HTMLElement>('[aria-label="状态列宽"]')!;
        await act(async () => {
          handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 720, pointerId: 83 }));
          window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 620, pointerId: 83 }));
          window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 620, pointerId: 83 }));
        });
        assert.equal(document.body.classList.contains("biu-table-resizing-global"), false);
        assert.equal(host.querySelector(".biu-table__resize-preview"), null);
        assert.equal(host.querySelector(".biu-table__resize-target"), null);
        assert.equal(host.querySelector<HTMLTableElement>("table")?.style.width, "800px");
        assert.equal(
          host.querySelector<HTMLTableColElement>('col[data-biu-column-key="actions"]')?.style.width,
          "80px",
        );
      } finally {
        await act(async () => root.unmount());
        host.remove();
        document.body.replaceChildren();
      }
    }
    assert.deepEqual(failures, ["Resize widths callback failed", "Resize resize callback failed"]);
  } finally {
    window.removeEventListener("error", captureError);
  }
});
