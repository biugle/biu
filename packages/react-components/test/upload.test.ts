import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FileItem, FilePreview, Upload, type BiuFileItem } from "../src/ui/index.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  Node: dom.window.Node,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });

async function mount(node: React.ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  let root!: Root;
  await act(async () => {
    root = createRoot(host);
    root.render(node);
  });
  return { host, root };
}

async function unmount(rendered: { host: HTMLDivElement; root: Root }) {
  await act(async () => rendered.root.unmount());
  rendered.host.remove();
  document.body.replaceChildren();
}

test("file preview and download actions use small sizing and unadorned download links", async () => {
  const file: BiuFileItem = {
    uid: "document",
    name: "document.pdf",
    url: "https://example.test/document.pdf",
  };
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(FileItem, { item: file }),
      React.createElement(FilePreview, { file, kind: "unsupported" }),
      React.createElement(FilePreview, { file, kind: "unsupported", onDownload: () => undefined }),
    ),
  );
  try {
    const itemPreview = rendered.host.querySelector<HTMLButtonElement>(
      ".biu-ui-file-item__actions button[aria-label='预览']",
    );
    const itemDownload = rendered.host.querySelector<HTMLAnchorElement>(".biu-ui-file-item__download-link");
    const previewDownloadLink = rendered.host.querySelector<HTMLAnchorElement>(".biu-ui-file-preview__download-link");
    const previewDownloadButton = rendered.host.querySelector<HTMLButtonElement>(
      ".biu-ui-file-preview__download-button",
    );

    assert.ok(itemPreview?.classList.contains("biu-ui-button--small"));
    assert.ok(itemDownload?.classList.contains("biu-ui-button--small"));
    assert.ok(previewDownloadLink?.classList.contains("biu-ui-button--small"));
    assert.ok(previewDownloadButton?.classList.contains("biu-ui-button--small"));
    assert.equal(itemDownload?.tagName, "A");
    assert.equal(previewDownloadLink?.tagName, "A");
    assert.equal(itemDownload?.querySelector(".biu-ui-button__content")?.textContent, "下载");
    assert.equal(previewDownloadLink?.querySelector(".biu-ui-button__content")?.textContent, "下载");
    assert.match(
      readFileSync(new URL("../src/ui/file-item/styles.css", import.meta.url), "utf8"),
      /\.biu-ui-file-item__download-link\s*\{\s*text-decoration:\s*none;/,
    );
    assert.match(
      readFileSync(new URL("../src/ui/file-preview/styles.css", import.meta.url), "utf8"),
      /\.biu-ui-file-preview__download-link\s*\{\s*text-decoration:\s*none;/,
    );
    assert.match(
      readFileSync(new URL("../src/ui/file-item/styles.css", import.meta.url), "utf8"),
      /\.biu-ui-file-item__download-link \.biu-ui-button__content\s*\{[^}]*transform:\s*translateY\(1px\);/s,
    );
    assert.match(
      readFileSync(new URL("../src/ui/file-preview/styles.css", import.meta.url), "utf8"),
      /\.biu-ui-file-preview__download-button \.biu-ui-button__content\s*\{[^}]*transform:\s*translateY\(1px\);/s,
    );
  } finally {
    await unmount(rendered);
  }
});

test("file preview sandboxes document frames and rejects executable URL schemes", async () => {
  const rendered = await mount(
    React.createElement(
      "div",
      null,
      React.createElement(FilePreview, {
        file: { uid: "text", name: "guide.html", url: "https://example.test/guide.html" },
        kind: "text",
      }),
      React.createElement(FilePreview, {
        file: { uid: "pdf", name: "guide.pdf", url: "https://example.test/guide.pdf" },
        kind: "pdf",
      }),
      React.createElement(FilePreview, {
        file: { uid: "unsafe", name: "payload.html", url: "javascript:alert(document.domain)" },
        kind: "text",
      }),
    ),
  );
  try {
    const frames = rendered.host.querySelectorAll<HTMLIFrameElement>("iframe");
    assert.equal(frames.length, 2);
    assert.equal(frames[0]?.getAttribute("sandbox"), "");
    assert.equal(frames[0]?.getAttribute("referrerpolicy"), "no-referrer");
    assert.equal(frames[1]?.getAttribute("sandbox"), "allow-scripts");
    assert.equal(rendered.host.querySelector('[data-file-kind="text"] iframe[src^="javascript:"]'), null);
  } finally {
    await unmount(rendered);
  }
});

test("Upload keeps a non-multiple queue and upload callback aligned with visible files", async () => {
  const updates: string[][] = [];
  const selected: string[][] = [];
  const rendered = await mount(
    React.createElement(Upload, {
      onFileListChange: (items: Array<{ name: string }>) => updates.push(items.map((item) => item.name)),
      onFiles: (files: File[]) => selected.push(files.map((file) => file.name)),
    }),
  );
  try {
    const input = rendered.host.querySelector<HTMLInputElement>('input[type="file"]');
    assert.ok(input);
    const first = new File(["a"], "first.txt", { type: "text/plain" });
    const second = new File(["b"], "second.txt", { type: "text/plain" });
    Object.defineProperty(input, "files", { configurable: true, value: [first, second] });
    await act(async () => {
      input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
      await new Promise((resolve) => dom.window.setTimeout(resolve, 0));
    });
    assert.deepEqual(updates.at(-1), ["second.txt"]);
    assert.deepEqual(selected.at(-1), ["second.txt"]);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-file-item").length, 1);
  } finally {
    await unmount(rendered);
  }
});

test("Upload exposes failure and cancellation states for custom transports", async () => {
  const errors: string[] = [];
  const rendered = await mount(
    React.createElement(Upload, {
      multiple: true,
      onUploadError: (_item: unknown, error: unknown) => errors.push(String((error as Error).message)),
      customRequest: ({ onError }: { onError: (error: unknown) => void }) => {
        onError(new Error("网络失败"));
      },
    }),
  );
  try {
    const input = rendered.host.querySelector<HTMLInputElement>('input[type="file"]');
    assert.ok(input);
    const file = new File(["failed"], "failed.txt", { type: "text/plain" });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    await act(async () => {
      input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
      await Promise.resolve();
    });
    assert.ok(rendered.host.querySelector(".biu-ui-file-item--error"));
    assert.deepEqual(errors, ["网络失败"]);
  } finally {
    await unmount(rendered);
  }

  let aborted = 0;
  let requested = 0;
  const cancelled: string[] = [];
  const cancelRendered = await mount(
    React.createElement(Upload, {
      onCancel: (item: { status?: string }) => cancelled.push(item.status ?? ""),
      customRequest: () => {
        requested += 1;
        return {
          abort: () => {
            aborted += 1;
          },
        };
      },
    }),
  );
  try {
    const input = cancelRendered.host.querySelector<HTMLInputElement>('input[type="file"]');
    assert.ok(input);
    const file = new File(["pending"], "pending.txt", { type: "text/plain" });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    await act(async () => {
      input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
      await Promise.resolve();
    });
    const cancel = [
      ...cancelRendered.host.querySelectorAll<HTMLButtonElement>(".biu-ui-file-item--uploading button"),
    ].find((button) => button.textContent === "取消");
    assert.ok(cancel);
    assert.equal(cancel.textContent, "取消");
    assert.equal(requested, 1);
    await act(async () => cancel.click());
    assert.equal(aborted, 1);
    assert.deepEqual(cancelled, ["cancelled"]);
    assert.ok(cancelRendered.host.querySelector(".biu-ui-file-item--cancelled"));
  } finally {
    await unmount(cancelRendered);
  }
});

test("Upload uses an accessible trigger container and avoids nested interactive elements", async () => {
  const rendered = await mount(
    React.createElement(Upload, null, React.createElement("button", { type: "button" }, "选择文件")),
  );
  try {
    const trigger = rendered.host.querySelector<HTMLElement>('[role="button"].biu-ui-upload');
    const input = rendered.host.querySelector<HTMLInputElement>('input[type="file"]');
    assert.ok(trigger);
    assert.ok(input);
    assert.equal(trigger.querySelector("button")?.textContent, "选择文件");
    assert.equal(trigger.closest("label"), null);

    let clicked = 0;
    Object.defineProperty(input, "click", {
      configurable: true,
      value: () => {
        clicked += 1;
      },
    });
    await act(async () =>
      trigger.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    );
    assert.equal(clicked, 1);
  } finally {
    await unmount(rendered);
  }
});

test("Upload honors async beforeUpload rejection and maxCount before creating queue items", async () => {
  const rejected: string[] = [];
  const updates: string[][] = [];
  const rendered = await mount(
    React.createElement(Upload, {
      multiple: true,
      maxCount: 1,
      beforeUpload: async (file: File) => file.name !== "blocked.txt",
      onFileListChange: (items: Array<{ name: string }>) => updates.push(items.map((item) => item.name)),
      onFileRejected: (file: File, reason: "accept" | "maxSize") => rejected.push(`${file.name}:${reason}`),
    }),
  );
  try {
    const input = rendered.host.querySelector<HTMLInputElement>('input[type="file"]');
    assert.ok(input);
    const blocked = new File(["blocked"], "blocked.txt", { type: "text/plain" });
    const accepted = new File(["accepted"], "accepted.txt", { type: "text/plain" });
    const overflow = new File(["overflow"], "overflow.txt", { type: "text/plain" });
    Object.defineProperty(input, "files", { configurable: true, value: [blocked, accepted, overflow] });
    await act(async () => {
      input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
      await new Promise((resolve) => dom.window.setTimeout(resolve, 0));
    });
    assert.deepEqual(updates.at(-1), ["accepted.txt"]);
    assert.deepEqual(rejected, []);
    assert.equal(rendered.host.querySelectorAll(".biu-ui-file-item").length, 1);
  } finally {
    await unmount(rendered);
  }
});

test("Upload controlled fileList receives the same queue used by the visible file list", async () => {
  function ControlledUpload() {
    const [items, setItems] = React.useState<BiuFileItem[]>([]);
    return React.createElement(Upload, {
      fileList: items,
      multiple: true,
      autoUpload: false,
      onFileListChange: (next: BiuFileItem[]) => setItems(next),
    });
  }
  const rendered = await mount(React.createElement(ControlledUpload));
  try {
    const input = rendered.host.querySelector<HTMLInputElement>('input[type="file"]');
    assert.ok(input);
    const file = new File(["controlled"], "controlled.txt", { type: "text/plain" });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    await act(async () => {
      input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
      await Promise.resolve();
    });
    assert.equal(rendered.host.querySelectorAll(".biu-ui-file-item").length, 1);
    assert.match(rendered.host.textContent ?? "", /controlled\.txt/);
  } finally {
    await unmount(rendered);
  }
});

test("Upload does not reserve an empty metadata row for a ready file", async () => {
  const rendered = await mount(
    React.createElement(Upload, {
      fileList: [{ uid: "ready-guide", name: "guide.pdf", status: "ready" }],
    }),
  );
  try {
    const item = rendered.host.querySelector<HTMLElement>(".biu-ui-file-item");
    assert.ok(item);
    assert.ok(item.querySelector(".biu-ui-file-item__name"));
    assert.equal(item.querySelector(".biu-ui-file-item__meta"), null);
  } finally {
    await unmount(rendered);
  }
});
