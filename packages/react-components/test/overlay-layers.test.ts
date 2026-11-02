import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("shared overlay z-index tokens form one ordered ladder", () => {
  const theme = read("../src/theme.default.css");
  const entries = [...theme.matchAll(/--biu-z-index-([\w-]+):\s*(\d+)/g)].map(
    (match) => [match[1], Number(match[2])] as const,
  );
  assert.ok(entries.length >= 16, "the shared theme should declare the full layer ladder");
  assert.deepEqual(
    entries.map(([, value]) => value),
    [...entries.map(([, value]) => value)].sort((left, right) => left - right),
    "z-index tokens should be declared in ascending order",
  );
  assert.deepEqual(Object.fromEntries(entries), {
    base: 0,
    "local-raised": 1,
    "local-control": 2,
    "local-tooltip": 3,
    "inline-widget": 10,
    "inline-menu": 20,
    "embedded-mask": 20,
    "embedded-content": 21,
    "fixed-widget": 200,
    "fullscreen-content": 250,
    loading: 300,
    drawer: 600,
    dialog: 601,
    fire: 650,
    "image-preview": 675,
    popover: 700,
    "context-menu": 720,
    toast: 750,
    tooltip: 800,
  });
});

test("component, Preset and Table overlays reference the shared layer tokens", () => {
  const expectedTokens: Array<[string, string]> = [
    ["../src/ui/dialog/styles.css", "dialog"],
    ["../src/ui/message/styles.css", "toast"],
    ["../src/ui/notification/styles.css", "toast"],
    ["../src/ui/popover/styles.css", "popover"],
    ["../src/ui/dropdown/styles.css", "popover"],
    ["../src/ui/select/styles.css", "popover"],
    ["../src/ui/cascader/styles.css", "popover"],
    ["../src/ui/date-picker/styles.css", "popover"],
    ["../src/ui/tooltip/styles.css", "tooltip"],
    ["../src/ui/context-menu/styles.css", "context-menu"],
    ["../src/ui/image/styles.css", "image-preview"],
    ["../src/ui/spin/styles.css", "loading"],
    ["../../preset/src/styles/overlays.css", "embedded-mask"],
    ["../../preset/src/styles/overlays.css", "embedded-content"],
    ["../../preset/src/styles/overlays.css", "popover"],
    ["../../preset/src/styles/tabs.css", "context-menu"],
    ["../../react-table/src/pro/styles.css", "popover"],
    ["../../react-table/src/pro/styles.css", "fullscreen-content"],
  ];
  const contents = new Map<string, string>();
  for (const [path, token] of expectedTokens) {
    const styles = contents.get(path) ?? read(path);
    contents.set(path, styles);
    assert.match(styles, new RegExp(`--biu-z-index-${token}\\s*,`), `${path} should use the ${token} token`);
  }

  const globalOverlayStyles = [
    read("../src/ui/dialog/styles.css"),
    read("../src/ui/message/styles.css"),
    read("../src/ui/notification/styles.css"),
    read("../src/ui/popover/styles.css"),
    read("../src/ui/dropdown/styles.css"),
    read("../src/ui/select/styles.css"),
    read("../src/ui/cascader/styles.css"),
    read("../src/ui/date-picker/styles.css"),
    read("../src/ui/tooltip/styles.css"),
    read("../src/ui/context-menu/styles.css"),
    read("../../preset/src/styles/overlays.css"),
    read("../../preset/src/styles/tabs.css"),
    read("../../react-table/src/pro/styles.css"),
  ].join("\n");
  assert.doesNotMatch(globalOverlayStyles, /z-index:\s*\d{5,}/, "global overlays should not bypass the shared ladder");
  const dialogStyles = read("../src/ui/dialog/styles.css");
  assert.match(
    dialogStyles,
    /\.biu-ui-dialog__content\[data-biu-component="drawer"\]\s*\{\s*z-index:\s*var\(--biu-z-index-drawer,\s*600\)/,
    "Drawer should use its layer below Dialog",
  );
  assert.match(dialogStyles, /z-index:\s*var\(--biu-z-index-dialog,\s*601\)/, "Dialog should use layer 601");
});
