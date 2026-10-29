// Publish only after the separate GitHub-origin check succeeds. Status 2 is a
// deliberate non-release skip, translated to a successful no-op for Actions.
import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const verifyPath = resolve(scriptDirectory, "verify-release-origin.mjs");

export function runReleasePublish({
  run = spawnSync,
  stdout = process.stdout,
  stderr = process.stderr,
  env = process.env,
} = {}) {
  const verification = run(process.execPath, [verifyPath], { encoding: "utf8", env });
  if (verification.stdout) stdout.write(verification.stdout);
  if (verification.stderr) stderr.write(verification.stderr);
  if (verification.error) {
    stderr.write(`${verification.error.message}\n`);
    return 1;
  }
  // verify-release-origin reserves 2 for safe skips (for example, an ordinary push).
  if (verification.status === 2) return 0;
  if (verification.status !== 0) return verification.status ?? 1;

  const publish = run(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["changeset", "publish"], {
    env,
    stdio: "inherit",
  });
  if (publish.error) {
    stderr.write(`${publish.error.message}\n`);
    return 1;
  }
  return publish.status ?? 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runReleasePublish();
}
