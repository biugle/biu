import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

const overlays = await readFile(new URL("../src/styles/overlays.css", import.meta.url), "utf8");
const header = await readFile(new URL("../src/styles/header.css", import.meta.url), "utf8");

test("foundation dropdown panels use Radix available height and contain their scrolling", () => {
  assert.match(
    overlays,
    /\.biu-compact-actions-panel\s*\{[^}]*max-height:\s*min\(520px, calc\(100vh - 16px\), var\(--radix-popover-content-available-height, 520px\)\);[^}]*overflow-y:\s*auto;[^}]*overscroll-behavior:\s*contain;/s,
  );
  assert.match(
    header,
    /\.biu-header-popover\.biu-ui-popover__content\.biu-topbar-nested-menu-popover\s*\{[^}]*max-height:\s*min\(520px, calc\(100vh - 16px\), var\(--radix-popover-content-available-height, 520px\)\);[^}]*overflow-y:\s*auto;[^}]*overscroll-behavior:\s*contain;/s,
  );
});
