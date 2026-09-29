import assert from "node:assert/strict";
import test from "node:test";
import {
  isAppEventPayload,
  isAuthContext,
  isBridgeMessage,
  isHostContextPayload,
  isSafeRemoteUrl,
  normalizeOrigin,
  postBiuMessage,
  publicAuthContext,
} from "../src/index.js";

test("normalizes only http and https origins", () => {
  assert.equal(normalizeOrigin("https://example.test/path"), "https://example.test");
  assert.equal(normalizeOrigin("javascript:alert(1)"), undefined);
});

test("validates bridge payloads", () => {
  assert.equal(isBridgeMessage({ CHANNEL: "BIU", TYPE: "READY" }), true);
  assert.equal(isBridgeMessage({ CHANNEL: "OTHER", TYPE: "READY" }), false);
  assert.equal(isAppEventPayload({ name: "refresh", payload: { id: 1 } }), true);
  assert.equal(isAppEventPayload({ name: "" }), false);
  assert.equal(isAppEventPayload({ name: "  " }), false);
  assert.equal(isAppEventPayload({ name: "refresh", source: "x".repeat(161) }), false);
  assert.equal(isAuthContext({ mode: "NONE", authenticated: false }), true);
  assert.equal(isHostContextPayload({ THEME: "dark", DIRECTION: "ltr" }), true);
});

test("redacts credentials by construction and validates remote origins", () => {
  const value = publicAuthContext({
    mode: "SSO",
    authenticated: true,
    user: { name: "Admin", extra: { department: "platform", accessToken: "secret", nested: { ok: true } } },
  });
  assert.deepEqual(value?.user, { name: "Admin", extra: { department: "platform", nested: { ok: true } } });
  assert.equal(isSafeRemoteUrl("https://child.example.test", ["https://child.example.test"]), true);
  assert.equal(isSafeRemoteUrl("javascript:alert(1)", ["https://child.example.test"]), false);
});

test("postBiuMessage normalizes explicit origins and cannot be used to override the channel", () => {
  const previousWindow = (globalThis as { window?: unknown }).window;
  const calls: unknown[] = [];
  const parent = { postMessage: (message: unknown, origin: string) => calls.push([message, origin]) };
  (globalThis as { window?: unknown }).window = {
    location: { origin: "https://host.example.test" },
    parent,
  };
  try {
    postBiuMessage({ TYPE: "READY", CHANNEL: "EVIL" }, "https://child.example.test/path");
    assert.deepEqual(calls, [[{ TYPE: "READY", CHANNEL: "BIU" }, "https://child.example.test"]]);
  } finally {
    if (previousWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else (globalThis as { window?: unknown }).window = previousWindow;
  }
});
