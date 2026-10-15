import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import { installChildAppShutdownHandlers } from "../src/child-app-shutdown.js";

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
