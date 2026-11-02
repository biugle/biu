import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { Autocomplete } from "../src/ui/autocomplete/index.js";
import { createTestDom } from "./fixtures/react-dom.js";

const { mount, unmount } = createTestDom("overlay");

test("portaled Autocomplete suggestions stay anchored and scroll within the available viewport", async () => {
  const rendered = await mount(
    React.createElement(Autocomplete, {
      options: [
        { label: "第一项", value: "first" },
        { label: "第二项", value: "second" },
      ],
    }),
  );
  try {
    const input = rendered.host.querySelector<HTMLInputElement>("[role=combobox]");
    assert.ok(input);
    await act(async () => input.focus());
    const list = document.body.querySelector<HTMLElement>(".biu-ui-autocomplete__list");
    assert.ok(list);
    assert.equal(input.getAttribute("aria-controls"), list.id);
    assert.equal(list.getAttribute("role"), "listbox");
    assert.equal(list.querySelectorAll('[role="option"]').length, 2);

    const styles = readFileSync(new URL("../src/ui/autocomplete/styles.css", import.meta.url), "utf8");
    assert.match(styles, /max-height:[^;]*var\(--radix-popover-content-available-height, 240px\)/s);
    assert.match(styles, /overflow-y:\s*auto/);
    assert.match(styles, /overscroll-behavior:\s*contain/);
  } finally {
    await unmount(rendered);
  }
});

test("popover, dropdown, select, cascader and context menu panels cap height and contain scrolling", () => {
  const styleFiles = [
    ["popover", "../src/ui/popover/styles.css"],
    ["dropdown", "../src/ui/dropdown/styles.css"],
    ["select", "../src/ui/select/styles.css"],
    ["cascader", "../src/ui/cascader/styles.css"],
    ["context-menu", "../src/ui/context-menu/styles.css"],
    ["date-time-picker", "../src/ui/date-picker/styles.css"],
    ["tooltip", "../src/ui/tooltip/styles.css"],
    ["pro-textfield", "../src/pro/textfield/styles.css"],
  ] as const;
  for (const [name, path] of styleFiles) {
    const styles = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(styles, /max-height:/, `${name} should cap its panel height`);
    assert.match(styles, /overflow-y:\s*auto/, `${name} should scroll long content`);
  }
  const popoverStyles = readFileSync(new URL("../src/ui/popover/styles.css", import.meta.url), "utf8");
  assert.match(popoverStyles, /overscroll-behavior:\s*contain/);
  const dropdownStyles = readFileSync(new URL("../src/ui/dropdown/styles.css", import.meta.url), "utf8");
  assert.match(dropdownStyles, /--radix-dropdown-menu-content-available-height/);
  const cascaderStyles = readFileSync(new URL("../src/ui/cascader/styles.css", import.meta.url), "utf8");
  assert.match(cascaderStyles, /--radix-popover-content-available-height/);
});
