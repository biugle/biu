import assert from "node:assert/strict";
import process from "node:process";
import { test } from "node:test";
import { runReleasePublish } from "./release-publish.mjs";

function capture() {
  let value = "";
  return { write: (chunk) => (value += chunk), value: () => value };
}

test("skips publishing on a normal push with no Changesets release PR", () => {
  const calls = [];
  const stdout = capture();
  const stderr = capture();
  const result = runReleasePublish({
    run(command, args) {
      calls.push({ command, args });
      return { status: 2, stdout: "[biu] Skipping npm publish: this push is not a merged Changesets release PR.\n" };
    },
    stdout,
    stderr,
  });

  assert.equal(result, 0);
  assert.equal(calls.length, 1);
  assert.match(stdout.value(), /Skipping npm publish/);
  assert.equal(stderr.value(), "");
});

test("runs Changesets publish only after release PR origin verification succeeds", () => {
  const calls = [];
  const stdout = capture();
  const stderr = capture();
  const result = runReleasePublish({
    run(command, args) {
      calls.push({ command, args });
      return calls.length === 1
        ? { status: 0, stdout: "[biu] Verified npm publish origin: merged Changesets release PR #6.\n" }
        : { status: 0 };
    },
    stdout,
    stderr,
  });

  assert.equal(result, 0);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].command, process.platform === "win32" ? "pnpm.cmd" : "pnpm");
  assert.deepEqual(calls[1].args, ["changeset", "publish"]);
  assert.match(stdout.value(), /Verified npm publish origin/);
});

test("fails closed when release origin cannot be verified", () => {
  const calls = [];
  const stderr = capture();
  const result = runReleasePublish({
    run(command, args) {
      calls.push({ command, args });
      return { status: 1, stderr: "GitHub could not verify the release PR\n" };
    },
    stdout: capture(),
    stderr,
  });

  assert.equal(result, 1);
  assert.equal(calls.length, 1);
  assert.match(stderr.value(), /GitHub could not verify/);
});
