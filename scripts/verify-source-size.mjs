// Called by pnpm verify:source-size. Source and stylesheet budgets apply to
// every workspace; generated output and data files do not need code splitting.
import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const maxLines = 800;
const extensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx", ".css"]);
const skippedDirectories = new Set([
  ".git",
  ".biu",
  ".cache",
  ".pnpm-store",
  ".scenario-work",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
]);

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return skippedDirectories.has(entry.name) ? [] : sourceFiles(path);
      return entry.isFile() && extensions.has(extname(entry.name)) ? [path] : [];
    }),
  );
  return nested.flat();
}

const failures = [];
const files = await sourceFiles(root);
for (const path of files) {
  const source = await readFile(path, "utf8");
  const lineCount = source ? source.split(/\r?\n/).length - Number(source.endsWith("\n")) : 0;
  if (lineCount > maxLines) failures.push(`${relative(root, path)} has ${lineCount} lines; limit ${maxLines}`);
}
if (failures.length) throw new Error(`Source size budget failed:\n- ${failures.join("\n- ")}`);
console.log(`[biu] source size budget passed: ${files.length} code/CSS files, limit ${maxLines}, no exceptions`);
