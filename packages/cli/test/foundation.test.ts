import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { ensureFoundationPackages } from "../src/foundation.js";

const installedPackages = [
  ["biu-i18n", "i18n"],
  ["biu-bridge", "bridge"],
  ["biu-router", "router"],
  ["biu-store", "store"],
  ["icons", "icons"],
  ["react-components", "components"],
  ["react-form", "form"],
  ["react-table", "react-table"],
  ["http", "http"],
  ["tanstack-query", "tanstack-query"],
  ["biu-runtime", "runtime"],
  ["biu-adapter-react", "adapter-react"],
  ["biu-preset", "preset"],
];

async function installFixturePackage(root: string, name: string, files = ["index.js"]) {
  const packageRoot = join(root, "node_modules/@biugle", name);
  await mkdir(join(packageRoot, "dist"), { recursive: true });
  await writeFile(
    join(packageRoot, "package.json"),
    JSON.stringify({ name: `@biugle/${name}`, exports: { ".": { import: "./dist/index.js" } } }),
  );
  for (const file of files) await writeFile(join(packageRoot, "dist", file), `// ${name}/${file}\n`);
  return packageRoot;
}

test("standalone projects snapshot installed ESM packages and their transitive dependencies", async () => {
  const root = await mkdtemp(join(tmpdir(), "biu-installed-foundation-"));
  try {
    for (const [name] of installedPackages) {
      const files =
        name === "biu-preset"
          ? ["sidebar.js", "styles.css"]
          : name === "tanstack-query"
            ? ["index.js", "react.js"]
            : ["index.js"];
      await installFixturePackage(root, name!, files);
    }
    const runtimeRoot = join(root, "node_modules/@biugle/biu-runtime");
    await installFixturePackage(runtimeRoot, "biu-events");
    await ensureFoundationPackages(root, "sidebar");
    for (const [, snapshot] of installedPackages) {
      await access(join(root, ".biu/foundation", snapshot!, snapshot === "preset" ? "sidebar.js" : "index.js"));
    }
    assert.equal(await readFile(join(root, ".biu/foundation/events/index.js"), "utf8"), "// biu-events/index.js\n");
    await access(join(root, ".biu/foundation/runtime/node_modules/@biugle/biu-events/dist/index.js"));

    await writeFile(join(runtimeRoot, "dist/index.js"), "// updated runtime\n");
    await ensureFoundationPackages(root, "sidebar");
    assert.equal(await readFile(join(root, ".biu/foundation/runtime/index.js"), "utf8"), "// updated runtime\n");

    await rm(join(root, "node_modules/@biugle/biu-preset/dist/styles.css"));
    await assert.rejects(ensureFoundationPackages(root, "sidebar"), /基座包构建产物不完整/);
    assert.equal(await readFile(join(root, ".biu/foundation/runtime/index.js"), "utf8"), "// updated runtime\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("standalone projects report missing installed packages without invoking workspace builds", async () => {
  const root = await mkdtemp(join(tmpdir(), "biu-missing-foundation-"));
  try {
    await assert.rejects(ensureFoundationPackages(root, "sidebar"), /请先执行 pnpm install/);
    await assert.rejects(access(join(root, ".biu")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
