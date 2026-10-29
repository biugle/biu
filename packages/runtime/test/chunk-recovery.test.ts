import assert from "node:assert/strict";
import { test } from "node:test";
import { CHUNK_RECOVERY_COOLDOWN_MS, claimChunkLoadRecovery, isChunkLoadError } from "../src/chunk-recovery.js";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

test("只将明确的动态模块和脚本加载失败识别为 chunk 错误", () => {
  assert.equal(
    isChunkLoadError(new TypeError("Failed to fetch dynamically imported module: https://example.com/old.js")),
    true,
  );
  assert.equal(isChunkLoadError(new Error("Loading chunk 12 failed (missing: /assets/page.js)")), true);
  assert.equal(
    isChunkLoadError(
      Object.assign(new SyntaxError("Unexpected token '<'"), { stack: "at https://example.com/app.js:1:1" }),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new TypeError("Cannot read properties of undefined (reading 'reduce')")), false);
  assert.equal(isChunkLoadError(new SyntaxError("Unexpected token '<'")), false);
  assert.equal(isChunkLoadError(new Error("API request failed")), false);
});

test("同一 chunk 在十分钟冷却期内只申请一次自动恢复", () => {
  const storage = createStorage();
  const error = new TypeError("Failed to fetch dynamically imported module: https://example.com/old.js");
  const now = 1_800_000_000_000;

  assert.equal(claimChunkLoadRecovery(error, storage, "https://example.com/ComponentUIShowcase", now), "claimed");
  assert.equal(
    claimChunkLoadRecovery(error, storage, "https://example.com/ComponentUIShowcase", now + 1),
    "recently-attempted",
  );
  assert.equal(
    claimChunkLoadRecovery(error, storage, "https://example.com/ComponentUIShowcase", now + CHUNK_RECOVERY_COOLDOWN_MS),
    "claimed",
  );
});

test("不同 chunk 的失败分别限流，普通业务异常不会占用恢复次数", () => {
  const storage = createStorage();
  const page = "https://example.com/ComponentUIShowcase";
  const now = 1_800_000_000_000;

  assert.equal(
    claimChunkLoadRecovery(new Error("Cannot read properties of undefined (reading 'reduce')"), storage, page, now),
    "not-chunk-error",
  );
  assert.equal(
    claimChunkLoadRecovery(
      new TypeError("Failed to fetch dynamically imported module: /assets/first.js"),
      storage,
      page,
      now,
    ),
    "claimed",
  );
  assert.equal(
    claimChunkLoadRecovery(
      new TypeError("Failed to fetch dynamically imported module: /assets/second.js"),
      storage,
      page,
      now,
    ),
    "claimed",
  );
});

test("sessionStorage 不可用时关闭自动刷新并保留手动恢复路径", () => {
  const storage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };

  assert.equal(
    claimChunkLoadRecovery(
      new TypeError("Failed to fetch dynamically imported module: /assets/page.js"),
      storage,
      "https://example.com/ComponentUIShowcase",
    ),
    "storage-unavailable",
  );
});
