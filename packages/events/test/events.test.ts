import test from "node:test";
import assert from "node:assert/strict";
import { createBiuEventBus } from "../src/index.js";

test("event bus publishes typed envelopes and unsubscribes cleanly", () => {
  const bus = createBiuEventBus();
  const received: number[] = [];
  const unsubscribe = bus.subscribe<{ value: number }>("demo", (event) => {
    received.push(event.payload.value);
  });

  bus.publish("demo", { value: 1 }, "test");
  unsubscribe();
  bus.publish("demo", { value: 2 });

  assert.deepEqual(received, [1]);
});

test("event bus snapshots subscribers, isolates subscriber errors and clears by name", () => {
  const errors: unknown[] = [];
  const bus = createBiuEventBus({ onError: (error) => errors.push(error) });
  const received: string[] = [];
  bus.subscribe("demo", () => {
    throw new Error("subscriber failed");
  });
  bus.subscribe("demo", () => received.push("second"));
  bus.publish("demo", { value: 1 });
  assert.deepEqual(received, ["second"]);
  assert.equal(errors.length, 1);
  bus.clear("demo");
  bus.publish("demo", { value: 2 });
  assert.deepEqual(received, ["second"]);
});

test("event bus rejects unsafe event names", () => {
  const bus = createBiuEventBus();
  assert.throws(() => bus.subscribe("", () => undefined), TypeError);
  assert.throws(() => bus.publish("x".repeat(161), null), TypeError);
});
