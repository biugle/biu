import test from "node:test";
import assert from "node:assert/strict";
import { createLogger } from "../src/index.js";

function mockConsole() {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const output = {} as Console & Record<string, (...args: unknown[]) => void>;
  for (const method of ["log", "info", "debug", "warn", "error", "table", "group", "groupEnd", "dir"]) {
    output[method] = (...args: unknown[]) => calls.push({ method, args });
  }
  return { output, calls };
}

test("logger formats typed messages and preserves multiple arguments", () => {
  const { output, calls } = mockConsole();
  const logger = createLogger({ console: output });
  const payload = { id: 1 };
  logger.success("loaded", payload);
  logger.warning("slow");
  logger.error("failed");
  assert.equal(calls.length, 3);
  assert.match(String(calls[0].args[0]), /\[Biu\]\[success\]/);
  assert.equal(calls[0].args.at(-1), payload);
  assert.equal(calls[1].method, "warn");
  assert.equal(calls[2].method, "error");
  logger.destroy();
});

test("console guard patches selected methods and restores them", () => {
  const { output, calls } = mockConsole();
  const original = output.warn;
  const logger = createLogger({ console: output, disableConsole: ["warn"] });
  output.warn("hidden");
  assert.equal(calls.length, 0);
  logger.restoreConsole();
  output.warn("visible");
  assert.equal(calls.length, 1);
  assert.equal(output.warn, original);
  logger.destroy();
});

test("watermark callback is isolated and logger destroy is idempotent", () => {
  const { output } = mockConsole();
  let calls = 0;
  const logger = createLogger({ console: output, onWatermarkRefresh: () => calls++ });
  logger.start();
  logger.destroy();
  logger.destroy();
  assert.equal(calls, 0);
});
