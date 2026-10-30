import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { Drawer, DrawerContent } from "../src/ui/index.js";
import { FilePreviewDialog } from "../src/ui/file/index.js";
import { Dialog as ProDialog, Drawer as ProDrawer } from "../src/pro/index.js";
import { fire, type FireHandle } from "../src/fire.js";
import { createTestDom } from "./fixtures/react-dom.js";

const { mount, unmount } = createTestDom("overlay");

test("FilePreviewDialog ignores an empty file after the last upload is removed", async () => {
  const rendered = await mount(
    React.createElement(FilePreviewDialog, {
      open: false,
      onOpenChange: () => undefined,
      file: undefined as never,
    }),
  );
  try {
    assert.equal(rendered.host.textContent, "");
    assert.equal(document.querySelector(".biu-ui-dialog__content"), null);
  } finally {
    await unmount(rendered);
  }
});

test("Drawer portals placement classes and its requested dimension to the viewport layer", async () => {
  for (const placement of ["left", "right", "top", "bottom"] as const) {
    const rendered = await mount(
      React.createElement(
        Drawer,
        { open: true, placement, size: placement === "left" || placement === "right" ? 560 : 360 },
        React.createElement(DrawerContent, null, React.createElement("p", null, "抽屉内容")),
      ),
    );
    try {
      const content = document.querySelector(".biu-ui-dialog__content");
      const panel = document.querySelector(".biu-ui-dialog__panel");
      assert.ok(content);
      assert.ok(panel);
      assert.equal(content.parentElement, document.body);
      assert.equal(content.classList.contains(`biu-ui-drawer--${placement}`), true);
      assert.equal(panel.parentElement, content);
      const style = content.getAttribute("style") ?? "";
      assert.match(
        style,
        placement === "left" || placement === "right" ? /--biu-drawer-size: 560px/ : /--biu-drawer-height: 360px/,
      );
    } finally {
      await unmount(rendered);
    }
  }
});

test("Pro Dialog uses Chinese defaults, honors maskClosable and waits for async confirmation", async () => {
  const changes: Array<[boolean, string | undefined]> = [];
  let resolveOk!: () => void;
  const ok = new Promise<void>((resolve) => {
    resolveOk = resolve;
  });
  const rendered = await mount(
    React.createElement(
      ProDialog,
      {
        open: true,
        title: "确认操作",
        maskClosable: false,
        onOk: () => ok,
        onOpenChange: (open: boolean, reason?: string) => changes.push([open, reason]),
      },
      React.createElement("p", null, "内容"),
    ),
  );
  try {
    assert.equal(document.querySelector(".biu-pro-dialog--medium") !== null, true);
    assert.equal(document.querySelectorAll(".biu-ui-button")[0]?.textContent, "取消");
    assert.equal(document.querySelectorAll(".biu-ui-button")[1]?.textContent, "确定");
    const overlay = document.querySelector(".biu-ui-dialog__overlay");
    assert.ok(overlay);
    await act(async () => {
      overlay.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    assert.deepEqual(changes, []);
    const confirm = document.querySelectorAll<HTMLButtonElement>(".biu-ui-button")[1];
    assert.ok(confirm);
    await act(async () => {
      confirm.click();
      await Promise.resolve();
    });
    assert.equal(confirm.disabled, true);
    resolveOk();
    await act(async () => {
      await ok;
      await Promise.resolve();
    });
    assert.deepEqual(changes.at(-1), [false, "programmatic"]);
  } finally {
    await unmount(rendered);
  }
});

test("Pro Drawer maps semantic sizes, keeps the viewport layer and supports non-closable masks", async () => {
  const changes: Array<[boolean, string | undefined]> = [];
  const rendered = await mount(
    React.createElement(
      ProDrawer,
      {
        open: true,
        placement: "left",
        size: "large",
        maskClosable: false,
        title: "抽屉",
        onOpenChange: (open: boolean, reason?: string) => changes.push([open, reason]),
      },
      React.createElement("p", null, "长内容"),
    ),
  );
  try {
    const content = document.querySelector(".biu-ui-dialog__content");
    const panel = document.querySelector(".biu-ui-dialog__panel");
    const overlay = document.querySelector(".biu-ui-dialog__overlay");
    assert.ok(content);
    assert.ok(panel);
    assert.ok(overlay);
    assert.equal(content.classList.contains("biu-ui-drawer--left"), true);
    assert.equal(content.classList.contains("biu-pro-drawer"), true);
    assert.match(content.getAttribute("style") ?? "", /--biu-drawer-size: 720px/);
    assert.equal(panel.parentElement, content);
    assert.equal(overlay.nextElementSibling, panel);
    await act(async () => {
      overlay.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    assert.deepEqual(changes, []);
  } finally {
    await unmount(rendered);
  }
});

test("UI and Pro Drawer default to the right placement", async () => {
  const rendered = await mount(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(Drawer, { open: true }, React.createElement(DrawerContent, null, "UI")),
      React.createElement(ProDrawer, { open: true }, React.createElement("p", null, "Pro")),
    ),
  );
  try {
    const contents = [...document.querySelectorAll<HTMLElement>('[data-biu-slot="dialog-content"]')];
    assert.equal(contents.length, 2);
    assert.ok(contents.every((content) => content.classList.contains("biu-ui-drawer--right")));
  } finally {
    await unmount(rendered);
  }
});

test("fire mounts, updates and destroys a Pro component", async () => {
  let handle!: FireHandle;
  await act(async () => {
    handle = fire(ProDialog)({ title: "初始标题", children: React.createElement("p", null, "内容") });
    await Promise.resolve();
  });
  try {
    assert.equal(document.querySelector(".biu-pro-dialog__heading")?.textContent, "初始标题");
    await act(async () => {
      handle.update({ title: "更新标题" });
      await Promise.resolve();
    });
    assert.equal(document.querySelector(".biu-pro-dialog__heading")?.textContent, "更新标题");
  } finally {
    await act(async () => {
      handle.destroy();
      fire.destroyAll();
    });
  }
  assert.equal(document.querySelector(".biu-fire-root"), null);
});

test("fire close hides an instance without destroying it and preserves the caller callback", async () => {
  const changes: boolean[] = [];
  let handle!: FireHandle;
  await act(async () => {
    handle = fire(ProDialog)({
      title: "可重新打开",
      onOpenChange: (open: boolean) => changes.push(open),
    });
    await Promise.resolve();
  });
  try {
    await act(async () => {
      await Promise.resolve();
    });
    assert.ok(document.querySelector(".biu-fire-root"));
    assert.ok(document.querySelector(".biu-pro-dialog__heading"));
    await act(async () => handle.close());
    assert.ok(document.querySelector(".biu-fire-root"));
    assert.equal(document.querySelector(".biu-pro-dialog__heading"), null);
    await act(async () => handle.update({ open: true }));
    assert.ok(document.querySelector(".biu-pro-dialog__heading"));
    const dialog = document.querySelector(".biu-ui-dialog__content");
    assert.ok(dialog);
    const overlay = document.querySelector(".biu-ui-dialog__overlay");
    assert.ok(overlay);
    await act(async () => overlay.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    assert.deepEqual(changes, [false]);
  } finally {
    await act(async () => handle.destroy());
  }
});
