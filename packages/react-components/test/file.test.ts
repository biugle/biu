import assert from "node:assert/strict";
import test from "node:test";
import { fileMatchesAccept, resolveFilePreviewKind } from "../src/ui/file/index.js";

test("file preview resolves common media types and a safe unsupported fallback", () => {
  assert.equal(resolveFilePreviewKind({ name: "photo.png" }), "image");
  assert.equal(resolveFilePreviewKind({ name: "document.pdf" }), "pdf");
  assert.equal(resolveFilePreviewKind({ name: "movie.mp4" }), "video");
  assert.equal(resolveFilePreviewKind({ name: "voice.mp3" }), "audio");
  assert.equal(resolveFilePreviewKind({ name: "README.md" }), "text");
  assert.equal(resolveFilePreviewKind({ name: "archive.zip" }), "unsupported");
});

test("upload accept matching supports extensions, exact MIME types and wildcards", () => {
  assert.equal(fileMatchesAccept({ name: "photo.PNG", type: "image/png" }, "image/*"), true);
  assert.equal(fileMatchesAccept({ name: "report.pdf", type: "application/pdf" }, ".pdf"), true);
  assert.equal(fileMatchesAccept({ name: "report.pdf", type: "application/pdf" }, "image/*,.txt"), false);
  assert.equal(fileMatchesAccept({ name: "unknown.bin", type: "" }, "application/octet-stream"), false);
  assert.equal(fileMatchesAccept({ name: "unknown.bin", type: "" }), true);
});
