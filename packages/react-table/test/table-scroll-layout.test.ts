import assert from "node:assert/strict";
import { readTableStyles } from "./fixtures/styles.js";
import { test } from "node:test";
import { getTableScrollStyle } from "../src/ui/table-scroll-style.js";

test("standard-page tables keep vertical scrolling when scroll.y is omitted", () => {
  const style = getTableScrollStyle({
    scroll: { x: "100%" },
    hasResizableColumns: false,
    hasConfiguredColumnWidths: false,
  });
  assert.equal(style.overflowX, "auto");
  assert.equal(style.overflowY, "auto");

  const styles = readTableStyles();
  assert.match(
    styles,
    /\.biu-pro-table > \.biu-table > \.biu-table__scroll,\s*\.biu-pro-table-box > \.biu-table > \.biu-table__scroll\s*\{[^}]*min-height:\s*0;[^}]*flex:\s*1 1 auto/s,
  );
});
