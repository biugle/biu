import assert from "node:assert/strict";
import test from "node:test";
import {
  actionColumnMaxCount,
  actionColumnWidth,
  calculateColumnResize,
  columnFillKey,
  columnResizeCompensationKeys,
  columnBounds,
  pixelWidth,
  resolveColumnLayout,
} from "../src/ui/column-sizing.js";

test("layout allocates viewport surplus only to ordinary columns and keeps auxiliary columns exact", () => {
  const columns = [
    { key: "left", fixed: "left" as const, width: 100 },
    { key: "name", width: 180 },
    { key: "status", width: 120, maxWidth: 200 },
    { key: "actions", fixed: "right" as const, actionColumn: true },
    { key: "right", fixed: "right" as const, width: 100 },
  ];
  const result = resolveColumnLayout(columns, 1000, 84, "status");
  assert.deepEqual(result, {
    widths: { left: 100, name: 180, status: 346, actions: 190, right: 100 },
    totalWidth: 1000,
  });
  for (const viewport of [360, 500, 559, 560, 720, 799, 800, 1600]) {
    const layout = resolveColumnLayout(columns, viewport, 84, "status");
    const expectedActionWidth = viewport < 560 ? 60 : viewport < 800 ? 160 : 190;
    assert.equal(layout.widths.left, 100);
    assert.equal(layout.widths.actions, expectedActionWidth);
    assert.equal(layout.widths.right, 100);
    assert.equal(layout.widths.status, 120 + Math.max(0, viewport - (584 + expectedActionWidth)));
    assert.equal(layout.totalWidth, Math.max(viewport, 584 + expectedActionWidth));
  }
});

test("fixed columns stay exact while automatic filling uses constrained ordinary leaves as needed", () => {
  assert.deepEqual(
    resolveColumnLayout(
      [
        { key: "left", width: 80, fixed: "left" },
        { key: "right", width: 100, fixed: "right" },
      ],
      800,
      0,
      "left",
    ),
    { widths: { left: 80, right: 100 }, totalWidth: 180 },
  );
  assert.deepEqual(
    resolveColumnLayout(
      [
        { key: "name", width: 100, maxWidth: 120 },
        { key: "actions", actionColumn: true },
      ],
      800,
      0,
      "name",
    ),
    { widths: { name: 610, actions: 190 }, totalWidth: 800 },
  );
});

test("layout clamps configured widths, percentage widths, conflicting bounds and numeric CSS widths", () => {
  const result = resolveColumnLayout(
    [
      { key: "percentage", width: "25%", minWidth: 100, maxWidth: 200, fixed: "left" },
      { key: "small", width: "30px", minWidth: 80 },
      { key: "large", width: 9999, maxWidth: 250 },
      { key: "conflict", width: 40, minWidth: 100, maxWidth: 70 },
    ],
    600,
    0,
    "small",
  );
  assert.deepEqual(result.widths, { percentage: 150, small: 100, large: 250, conflict: 100 });
  assert.deepEqual(columnBounds({ minWidth: Number.NaN, maxWidth: Number.NaN }), { minimum: 48, maximum: Infinity });
  assert.equal(pixelWidth("200rem"), undefined);
  assert.equal(pixelWidth("50%", 800), 400);
});

test("overflow preserves all minimum widths and does not distribute negative viewport space", () => {
  const result = resolveColumnLayout(
    [
      { key: "name", width: 50, minWidth: 180 },
      { key: "team", width: 60, minWidth: 180 },
      { key: "actions", fixed: "right", actionColumn: true },
    ],
    320,
    42,
    "team",
  );
  assert.deepEqual(result, { widths: { name: 180, team: 180, actions: 60 }, totalWidth: 462 });
});

test("actionColumn width and ButtonList limit follow the browser viewport", () => {
  for (const { viewport, width, maxCount } of [
    { viewport: 559, width: 60, maxCount: 1 },
    { viewport: 560, width: 160, maxCount: 3 },
    { viewport: 799, width: 160, maxCount: 3 },
    { viewport: 800, width: 190, maxCount: 5 },
  ]) {
    const layout = resolveColumnLayout([{ key: "actions", actionColumn: true }], viewport, 0, undefined);
    assert.equal(actionColumnWidth(viewport), width);
    assert.equal(layout.widths.actions, width);
    assert.equal(actionColumnMaxCount(viewport, width), maxCount);
  }
  assert.equal(actionColumnWidth(0), 190);
  assert.equal(actionColumnMaxCount(0), 5);
  assert.equal(actionColumnMaxCount(800, 84), 2);
  assert.equal(
    resolveColumnLayout([{ key: "actions", actionColumn: true, width: 84 }], 1000, 0, undefined).widths.actions,
    84,
  );
});

test("resize stops at the combined capacity of following participants and leaves every other width unchanged", () => {
  const state = {
    key: "name",
    startWidth: 180,
    minWidth: 120,
    maxWidth: 600,
    baseColumnWidths: { left: 80, name: 180, status: 120, team: 150, actions: 100 },
    compensation: [
      { key: "status", startWidth: 120, minWidth: 100, maxWidth: 200 },
      { key: "team", startWidth: 150, minWidth: 120, maxWidth: 200 },
    ],
  };
  assert.deepEqual(calculateColumnResize(state, 1000), { left: 80, name: 230, status: 100, team: 120, actions: 100 });
  assert.deepEqual(calculateColumnResize(state, -1000), { left: 80, name: 120, status: 180, team: 150, actions: 100 });
  assert.deepEqual(calculateColumnResize(state, 0), state.baseColumnWidths);
});

test("last and explicit fixed column resize change their own width without shrinking any preceding column", () => {
  for (const key of ["last", "fixed"]) {
    const state = {
      key,
      startWidth: 200,
      minWidth: 120,
      maxWidth: 400,
      baseColumnWidths: { first: 150, last: 200, fixed: 200 },
      compensation: [],
    };
    assert.deepEqual(calculateColumnResize(state, -1000), { ...state.baseColumnWidths, [key]: 120 });
    assert.deepEqual(calculateColumnResize(state, 1000), { ...state.baseColumnWidths, [key]: 400 });
  }
});

test("fractional widths and repeated layout resolutions are stable", () => {
  const columns = [
    { key: "name", width: "33.33%" },
    { key: "status", width: 121.5 },
    { key: "actions", width: 80, fixed: "right" as const },
  ];
  const first = resolveColumnLayout(columns, 701.25, 42, "status");
  assert.equal(first.totalWidth, 701.25);
  assert.deepEqual(resolveColumnLayout(columns, 701.25, 42, "status"), first);
  assert.equal(first.widths.actions, 80);
});

test("explicit narrow column bounds take precedence over the default 48px minimum", () => {
  assert.deepEqual(columnBounds({ minWidth: 32, maxWidth: 40 }), { minimum: 32, maximum: 40 });
  assert.deepEqual(resolveColumnLayout([{ key: "tiny", width: 100, minWidth: 32, maxWidth: 40 }], 40, 0, "tiny"), {
    widths: { tiny: 40 },
    totalWidth: 40,
  });
  const state = {
    key: "tiny",
    startWidth: 40,
    minWidth: 32,
    maxWidth: 40,
    baseColumnWidths: { tiny: 40 },
    compensation: [],
  };
  assert.equal(calculateColumnResize(state, -100).tiny, 32);
  assert.equal(calculateColumnResize(state, 100).tiny, 40);
});

test("a pinned dynamic column stays exact and leaves remaining viewport space in the table spacer", () => {
  const columns = [
    { key: "left", fixed: "left" as const, width: 100 },
    { key: "name", width: 180, maxWidth: 220 },
    { key: "team", width: 160, maxWidth: 240 },
    { key: "target", width: 120, maxWidth: 1000 },
    { key: "actions", actionColumn: true, fixed: "right" as const, width: 80 },
  ];
  assert.deepEqual(resolveColumnLayout(columns, 1000, 84, "target", {}, 1000, "target", 1000, true), {
    widths: { left: 100, name: 180, team: 160, target: 120, actions: 80 },
    totalWidth: 1000,
  });
  const limited = columns.filter((column) => column.key !== "team");
  assert.deepEqual(resolveColumnLayout(limited, 800, 84, "target", {}, 800, "target", 800, true), {
    widths: { left: 100, name: 180, target: 120, actions: 80 },
    totalWidth: 800,
  });
});

test("the configured dynamic column keeps its identity and can stay pinned below the viewport width", () => {
  const columns = [
    { key: "owner", width: 180, minWidth: 90, maxWidth: 220 },
    { key: "status", width: 120, minWidth: 90, maxWidth: 220 },
    { key: "updatedAt", width: 120, minWidth: 120, maxWidth: 220 },
  ];
  assert.equal(columnFillKey(columns, "updatedAt", ["updatedAt", "owner"]), "updatedAt");
  assert.deepEqual(resolveColumnLayout(columns, 1600, 0, "updatedAt", {}, 1600, ["updatedAt", "owner"], 1600, true), {
    widths: { owner: 180, status: 120, updatedAt: 120 },
    totalWidth: 1600,
  });
});

test("resize compensation uses the dynamic column first and its previous neighbor as fallback", () => {
  const columns = [
    { key: "fixed", fixed: "left" as const, width: 80 },
    { key: "name", width: 180 },
    { key: "status", width: 160 },
    { key: "updatedAt", width: 220 },
    { key: "actions", actionColumn: true, fixed: "right" as const, width: 80 },
  ];
  assert.deepEqual(columnResizeCompensationKeys(columns, "updatedAt", "name"), ["updatedAt", "status"]);
  assert.deepEqual(columnResizeCompensationKeys(columns, "updatedAt", "status"), ["updatedAt"]);
  assert.deepEqual(columnResizeCompensationKeys(columns, "updatedAt", "updatedAt"), ["status"]);
  assert.deepEqual(columnResizeCompensationKeys(columns, "name", "name"), []);
  assert.deepEqual(columnResizeCompensationKeys(columns, "updatedAt", "fixed"), []);
  assert.deepEqual(columnResizeCompensationKeys(columns, "updatedAt", "actions"), []);
});

test("the previous ordinary neighbor absorbs only the remainder after dynamic bounds", () => {
  const state = {
    key: "owner",
    startWidth: 100,
    minWidth: 60,
    maxWidth: 180,
    baseColumnWidths: { status: 160, owner: 100, updatedAt: 160 },
    compensation: [
      { key: "updatedAt", startWidth: 160, minWidth: 120, maxWidth: 220 },
      { key: "status", startWidth: 160, minWidth: 100, maxWidth: 220 },
    ],
  };
  assert.deepEqual(calculateColumnResize(state, 80), { status: 120, owner: 180, updatedAt: 120 });
});

test("a dynamic target stops with its previous column when either one reaches a bound", () => {
  const state = {
    key: "updatedAt",
    startWidth: 400,
    minWidth: 120,
    maxWidth: 600,
    baseColumnWidths: { status: 200, updatedAt: 400 },
    compensation: [{ key: "status", startWidth: 200, minWidth: 150, maxWidth: 250 }],
  };
  assert.deepEqual(calculateColumnResize(state, -100), { status: 250, updatedAt: 350 });
  assert.deepEqual(calculateColumnResize(state, 100), { status: 150, updatedAt: 450 });
});

test("a dynamic target consumes existing spacer slack only after its neighbor reaches a bound", () => {
  const state = {
    key: "updatedAt",
    startWidth: 400,
    minWidth: 120,
    maxWidth: 600,
    baseColumnWidths: { status: 200, updatedAt: 400 },
    compensation: [{ key: "status", startWidth: 200, minWidth: 150, maxWidth: 250 }],
    fillSlack: 25,
  };
  assert.deepEqual(calculateColumnResize(state, -100), { status: 250, updatedAt: 350 });
  assert.deepEqual(calculateColumnResize(state, 100), { status: 150, updatedAt: 475 });
});
