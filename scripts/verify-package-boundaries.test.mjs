import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const checkout = fileURLToPath(new URL("..", import.meta.url));
const gate = resolve(checkout, "scripts/verify-package-boundaries.mjs");
const areas = {
  packages: "packages",
  apps: "examples/dev-demo/apps",
  shared: "examples/dev-demo/packages",
};

function library(directory, sources, manifest = {}) {
  return {
    area: "packages",
    directory,
    manifest: { name: `@biugle/${directory}`, exports: { ".": "./dist/index.js" }, ...manifest },
    sources,
  };
}

async function audit(workspaces) {
  const root = await mkdtemp(resolve(tmpdir(), "biu-boundary-regression-"));
  try {
    await mkdir(resolve(root, "scripts"), { recursive: true });
    for (const area of Object.values(areas)) await mkdir(resolve(root, area), { recursive: true });
    await copyFile(gate, resolve(root, "scripts/verify-package-boundaries.mjs"));
    await symlink(
      resolve(checkout, "node_modules"),
      resolve(root, "node_modules"),
      process.platform === "win32" ? "junction" : "dir",
    );
    for (const workspace of workspaces) {
      const directory = resolve(root, areas[workspace.area], workspace.directory);
      await mkdir(resolve(directory, "src"), { recursive: true });
      await writeFile(resolve(directory, "package.json"), JSON.stringify(workspace.manifest));
      for (const [path, source] of Object.entries(workspace.sources)) {
        const file = resolve(directory, "src", path);
        await mkdir(resolve(file, ".."), { recursive: true });
        await writeFile(file, source);
      }
    }
    try {
      const result = await run(process.execPath, [resolve(root, "scripts/verify-package-boundaries.mjs")], {
        cwd: root,
        maxBuffer: 1024 * 1024,
      });
      return { code: 0, output: result.stdout + result.stderr };
    } catch (error) {
      return { code: error.code, output: error.stdout + error.stderr };
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("public aliases, acyclic peers, import types, Pro-to-UI and Demo shared imports are permitted", async () => {
  const result = await audit([
    library("base", { "index.ts": "export interface Base { value: string }" }),
    library(
      "react-components",
      {
        "index.ts": 'export * from "./ui.js";',
        "ui.tsx": 'export * from "./ui/index.js";',
        "ui/index.ts": 'export const Button = "button";',
        "pro.tsx": 'export * from "./pro/index.js";',
        "pro/index.ts": 'import { Button } from "@biugle/react-components/ui"; export const ProButton = Button;',
      },
      { exports: { ".": "./dist/index.js", "./ui": "./dist/ui.js", "./pro": "./dist/pro.js" } },
    ),
    {
      ...library(
        "shared",
        {
          "index.ts":
            'import type { Base } from "@biugle/base"; export type Shared = import("@biugle/base").Base & Base;',
        },
        {
          name: "@biugle/dev-demo-shared",
          peerDependencies: { "@biugle/base": "*" },
          exports: { ".": "./src/index.ts" },
        },
      ),
      area: "shared",
    },
    {
      ...library(
        "demo",
        { "index.ts": 'import type { Shared } from "@biugle/dev-demo-shared"; export type Demo = Shared;' },
        { name: "demo", dependencies: { "@biugle/dev-demo-shared": "*" } },
      ),
      area: "apps",
    },
  ]);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /2 public packages, 1 Demos/);
});

test("both UI packages reject their own public Pro alias, including top-level UI barrels", async () => {
  for (const name of ["react-components", "react-table"]) {
    const result = await audit([
      library(
        name,
        {
          "ui.tsx": `export { Thing } from "@biugle/${name}/pro";`,
          "pro.tsx": 'export * from "./pro/index.js";',
          "pro/index.ts": "export const Thing = 1;",
        },
        { exports: { "./ui": "./dist/ui.js", "./pro": "./dist/pro.js" } },
      ),
    ]);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /UI must not import Pro/);
  }
});

test("peer-only package cycles are rejected even before source imports use them", async () => {
  const result = await audit([
    library("a", { "index.ts": "export interface A {}" }, { peerDependencies: { "@biugle/b": "*" } }),
    library("b", { "index.ts": "export interface B {}" }, { peerDependencies: { "@biugle/a": "*" } }),
  ]);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /Package cycle: @biugle\/a -> @biugle\/b -> @biugle\/a/);
});

test("import type expressions cannot access private or undeclared package entries", async () => {
  const result = await audit([
    library("a", {
      "index.ts":
        'export type Private = import("@biugle/a/private").Thing; export type Missing = import("@biugle/missing").Thing;',
    }),
  ]);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /private package entry @biugle\/a\/private/);
  assert.match(result.output, /undeclared dependency @biugle\/missing/);
});

test("source cycles through public self aliases and declaration export targets are rejected", async () => {
  const result = await audit([
    library(
      "a",
      {
        "index.ts": 'export type A = import("@biugle/a/other").B;',
        "other.ts": 'import type { A } from "@biugle/a"; export type B = A;',
      },
      { exports: { ".": { types: "./dist/index.d.ts", import: "./dist/index.js" }, "./other": "./dist/other.js" } },
    ),
  ]);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /Source cycle/);
});

test("a helper re-export cannot hide a UI-to-Pro dependency", async () => {
  const result = await audit([
    library("react-components", {
      "ui/button.ts": 'import { Thing } from "../shared/proxy.js"; export { Thing };',
      "shared/proxy.ts": 'export * from "../pro/index.js";',
      "pro/index.ts": "export const Thing = 1;",
    }),
  ]);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /UI reaches Pro source/);
});

test("Demo sources cannot use another application's private relative source", async () => {
  const result = await audit([
    {
      ...library("first", { "index.ts": 'import { value } from "../../second/src/index.js";' }, { name: "first" }),
      area: "apps",
    },
    { ...library("second", { "index.ts": "export const value = 1;" }, { name: "second" }), area: "apps" },
  ]);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /cross-package relative import/);
});

test("explicitly blocked exports cannot be reopened by a public wildcard", async () => {
  const result = await audit([
    library(
      "a",
      {
        "index.ts": 'export type Private = import("@biugle/a/private").Thing;',
        "private.ts": "export type Thing = string;",
      },
      { exports: { ".": "./dist/index.js", "./*": "./dist/*.js", "./private": null } },
    ),
  ]);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /private package entry/);
});
