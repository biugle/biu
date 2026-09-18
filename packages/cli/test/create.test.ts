import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { execa } from "execa";

test("biu create 生成可开始开发的模板", async () => {
  const root = await mkdtemp(join(tmpdir(), "biu-create-test-"));
  const cliSource = join(dirname(fileURLToPath(import.meta.url)), "../src/cli.ts");
  try {
    await execa("tsx", [cliSource, "create", "starter"], { cwd: root });
    const project = join(root, "starter");
    await Promise.all([
      access(join(project, "biu.config.ts")),
      access(join(project, "README.md")),
      access(join(project, "src/pages/index.tsx")),
      access(join(project, "local-routes/index.ts")),
      access(join(project, "config/local.ts")),
      access(join(project, "config/prod.ts")),
      access(join(project, ".gitignore")),
      access(join(project, ".editorconfig")),
      access(join(project, ".prettierignore")),
      access(join(project, ".husky/pre-commit")),
      access(join(project, "scripts/prepare.mjs")),
      access(join(project, "local-routes/pages.ts")),
      access(join(project, "eslint.config.js")),
    ]);
    const packageJson = JSON.parse(await readFile(join(project, "package.json"), "utf8"));
    const config = await readFile(join(project, "biu.config.ts"), "utf8");
    assert.equal(packageJson.scripts.dev, "biu dev");
    assert.equal(packageJson.scripts.start, "biu dev");
    assert.equal(packageJson.scripts.build, "biu build");
    assert.match(config, /locale: "zh-CN"/);
    assert.match(await readFile(join(project, ".editorconfig"), "utf8"), /max_line_length = 120/);
    assert.equal(packageJson.version, "0.1.0");
    assert.equal(packageJson.dependencies["@biugle/biu-preset"], "^0.2.1");
    assert.equal(packageJson.dependencies["@biugle/biu-adapter-react"], "^0.2.1");
    assert.equal(packageJson.dependencies["@biugle/biu-bridge"], "^0.2.1");
    assert.equal(packageJson.dependencies["@biugle/biu-ui"], "^0.2.1");
    assert.match(await readFile(join(project, "local-routes/index.ts"), "utf8"), /\.\/pages\.ts/);
    assert.doesNotMatch(await readFile(join(project, "local-routes/pages.ts"), "utf8"), /path: "\/"/);
    await assert.rejects(access(join(project, "local-routes/portal-pages.ts")));
    await assert.rejects(access(join(project, "src/apps/Welcome/index.tsx")));
    await assert.rejects(access(join(project, "src/i18n/zh-CN.ts")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("biu create --type APP 只生成独立子应用页面", async () => {
  const root = await mkdtemp(join(tmpdir(), "biu-create-app-test-"));
  const cliSource = join(dirname(fileURLToPath(import.meta.url)), "../src/cli.ts");
  try {
    await execa("tsx", [cliSource, "create", "starter-app", "--type", "APP"], { cwd: root });
    const project = join(root, "starter-app");
    await Promise.all([access(join(project, "src/pages/index.tsx")), access(join(project, "config/local.ts"))]);
    await assert.rejects(access(join(project, "src/portal-pages/main/index.tsx")));
    await assert.rejects(access(join(project, "local-routes/portal-pages.ts")));
    const config = await readFile(join(project, "biu.config.ts"), "utf8");
    assert.match(config, /projectType: "APP"/);
    assert.doesNotMatch(config, /portal:/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("biu create --preset custom 生成 React Custom 项目", async () => {
  const root = await mkdtemp(join(tmpdir(), "biu-create-custom-test-"));
  const cliSource = join(dirname(fileURLToPath(import.meta.url)), "../src/cli.ts");
  try {
    await execa("tsx", [cliSource, "create", "custom-app", "--type", "APP", "--preset", "custom"], { cwd: root });
    const project = join(root, "custom-app");
    const config = await readFile(join(project, "biu.config.ts"), "utf8");
    await access(join(project, "src/custom-layout.tsx"));
    assert.match(config, /projectType: "APP"/);
    assert.match(config, /layout: \{ preset: "custom"/);
    assert.match(config, /framework: "react"/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
