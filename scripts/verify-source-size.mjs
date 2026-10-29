// Keep generated output out of the 800-line source budget. Oversized legacy
// files need a reviewed owner/date/reason, and stale exceptions must be removed.
import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const baseline = JSON.parse(await readFile(resolve(root, "scripts/source-size-baseline.json"), "utf8"));
const extensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const skippedDirectories = new Set([".biu", "coverage", "dist", "node_modules"]);

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return skippedDirectories.has(entry.name) ? [] : sourceFiles(path);
      return extensions.has(extname(entry.name)) ? [path] : [];
    }),
  );
  return nested.flat();
}

const trackedExceptions = new Map(Object.entries(baseline.exceptions));
const failures = [];
const unresolved = new Set(trackedExceptions.keys());

for (const directory of ["packages", "examples/dev-demo/apps"]) {
  for (const path of await sourceFiles(resolve(root, directory))) {
    const name = relative(root, path);
    const lineCount = (await readFile(path, "utf8")).split(/\r?\n/).length - 1;
    if (lineCount <= baseline.maxLines) continue;
    const exception = trackedExceptions.get(name);
    if (!exception) {
      failures.push(`${name} has ${lineCount} lines; the limit is ${baseline.maxLines}`);
      continue;
    }
    unresolved.delete(name);
    const reviewTimestamp = Date.parse(`${exception.reviewBy}T00:00:00.000Z`);
    if (
      !Number.isInteger(exception.maxLines) ||
      exception.maxLines <= baseline.maxLines ||
      typeof exception.owner !== "string" ||
      !exception.owner.trim() ||
      !Number.isFinite(reviewTimestamp) ||
      reviewTimestamp < Date.now() ||
      typeof exception.reason !== "string" ||
      !exception.reason.trim()
    ) {
      failures.push(
        `${name} has an invalid or overdue source-size exception; add an owner, future review date and reason`,
      );
      continue;
    }
    if (lineCount > exception.maxLines) {
      failures.push(`${name} grew to ${lineCount} lines; its tracked ceiling is ${exception.maxLines}`);
    }
  }
}

for (const name of unresolved)
  failures.push(`${name} no longer exceeds the source-size limit; remove its stale exception`);

if (failures.length) throw new Error(`Source size budget failed:\n- ${failures.join("\n- ")}`);
console.log(
  `[biu] source size budget passed: no new files above ${baseline.maxLines} lines; ${trackedExceptions.size - unresolved.size} tracked oversized files stayed within their ceilings`,
);
