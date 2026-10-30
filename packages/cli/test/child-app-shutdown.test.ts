import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import { installChildAppShutdownHandlers, manageChildApps } from "../src/child-app-shutdown.js";

test("child APP servers are stopped and the parent re-raises its shutdown signal", () => {
  const signalProcess = Object.assign(new EventEmitter(), {
    pid: 42,
    forwardedSignals: [] as Array<[number, "SIGINT" | "SIGTERM"]>,
    kill(pid: number, signal: "SIGINT" | "SIGTERM") {
      this.forwardedSignals.push([pid, signal]);
      return true;
    },
  });
  const childSignals: string[] = [];

  installChildAppShutdownHandlers([{ kill: (signal: "SIGTERM") => childSignals.push(signal) }], signalProcess);

  signalProcess.emit("SIGINT");
  signalProcess.emit("SIGTERM");

  assert.deepEqual(childSignals, ["SIGTERM"]);
  assert.deepEqual(signalProcess.forwardedSignals, [[42, "SIGINT"]]);
});

function childFixture() {
  let reject!: (reason: unknown) => void;
  const signals: string[] = [];
  const child = Object.assign(
    new Promise((_resolve, rejectPromise) => {
      reject = rejectPromise;
    }),
    {
      kill(signal: "SIGTERM") {
        signals.push(signal);
        reject(new Error("terminated"));
      },
    },
  );
  return { child, reject, signals };
}

test("a failed APP is observed and stops all coordinated child servers", async () => {
  const first = childFixture();
  const second = childFixture();
  const failures: unknown[] = [];
  const lifecycle = manageChildApps([first.child, second.child], (reason) => failures.push(reason));
  const failure = new Error("startup failed");
  first.reject(failure);
  await new Promise((resolveTurn) => setImmediate(resolveTurn));
  await lifecycle.stop();
  assert.deepEqual(failures, [failure]);
  assert.deepEqual(first.signals, ["SIGTERM"]);
  assert.deepEqual(second.signals, ["SIGTERM"]);
});

test("intentional APP cleanup drains rejections without reporting a startup failure", async () => {
  const child = childFixture();
  const failures: unknown[] = [];
  const lifecycle = manageChildApps([child.child], (reason) => failures.push(reason));
  await lifecycle.stop();
  await lifecycle.stop();
  assert.deepEqual(child.signals, ["SIGTERM"]);
  assert.deepEqual(failures, []);
});
