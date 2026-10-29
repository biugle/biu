import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

// Protect the no-hover navigation contract so mobile actions stay discoverable.
const sidebarStyles = await readFile(new URL("../src/styles/sidebar.css", import.meta.url), "utf8");

test("expanded sidebar exposes secondary menu actions on touch-first devices", () => {
  assert.match(
    sidebarStyles,
    /@media \(hover: none\), \(pointer: coarse\)[\s\S]*?\.biu-sidebar-layout:not\(\.biu-sidebar-collapsed\) \.biu-menu-favorite,[\s\S]*?\.biu-sidebar-layout:not\(\.biu-sidebar-collapsed\) \.biu-menu-new-tab\s*\{[^}]*opacity:\s*1;[^}]*pointer-events:\s*auto;/s,
  );
});
