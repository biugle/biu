import assert from "node:assert/strict";
import { access, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { execa } from "execa";
import { discoverProject } from "../src/project.js";

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
    assert.equal(packageJson.version, "1.0.0");
    const queryManifest = JSON.parse(
      await readFile(new URL("../../tanstack-query/package.json", import.meta.url), "utf8"),
    );
    assert.equal(
      packageJson.dependencies["@tanstack/react-query"],
      queryManifest.peerDependencies["@tanstack/react-query"],
    );
    const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
    const versions = new Map<string, string>();
    for (const entry of await readdir(packageRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const directory = entry.name;
      const manifest = JSON.parse(await readFile(join(packageRoot, directory, "package.json"), "utf8"));
      versions.set(manifest.name, manifest.version);
    }
    for (const [name, range] of Object.entries({ ...packageJson.dependencies, ...packageJson.devDependencies })) {
      if (name.startsWith("@biugle/")) assert.equal(range, `^${versions.get(name)}`, name);
    }

    assert.equal(
      packageJson.dependencies["@biugle/biu-preset"],
      `^${JSON.parse(await readFile(new URL("../../preset/package.json", import.meta.url), "utf8")).version}`,
    );
    assert.equal(
      packageJson.dependencies["@biugle/biu-adapter-react"],
      `^${JSON.parse(await readFile(new URL("../../adapter-react/package.json", import.meta.url), "utf8")).version}`,
    );
    assert.equal(
      packageJson.dependencies["@biugle/biu-bridge"],
      `^${JSON.parse(await readFile(new URL("../../bridge/package.json", import.meta.url), "utf8")).version}`,
    );
    assert.equal(
      packageJson.dependencies["@biugle/react-components"],
      `^${JSON.parse(await readFile(new URL("../../react-components/package.json", import.meta.url), "utf8")).version}`,
    );
    assert.equal(
      packageJson.dependencies["@biugle/react-form"],
      `^${JSON.parse(await readFile(new URL("../../react-form/package.json", import.meta.url), "utf8")).version}`,
    );
    assert.equal(
      packageJson.dependencies["@biugle/http"],
      `^${JSON.parse(await readFile(new URL("../../http/package.json", import.meta.url), "utf8")).version}`,
    );
    assert.equal(
      packageJson.dependencies["@biugle/icons"],
      `^${JSON.parse(await readFile(new URL("../../icons/package.json", import.meta.url), "utf8")).version}`,
    );
    assert.equal(
      packageJson.dependencies["@biugle/react-table"],
      `^${JSON.parse(await readFile(new URL("../../react-table/package.json", import.meta.url), "utf8")).version}`,
    );
    assert.match(await readFile(join(project, "local-routes/index.ts"), "utf8"), /\.\/pages\.js/);
    assert.doesNotMatch(await readFile(join(project, "local-routes/pages.ts"), "utf8"), /path: "\/"/);
    assert.deepEqual(
      (await discoverProject(project)).routes.map((route) => route.code),
      ["Welcome"],
    );
    await assert.rejects(access(join(project, "local-routes/portal-pages.ts")));
    await assert.rejects(access(join(project, "src/apps/Welcome/index.tsx")));
    await assert.rejects(access(join(project, "src/i18n/zh-CN.ts")));
    await execa("prettier", ["--check", "."], { cwd: project });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("biu --version matches the published CLI package version", async () => {
  const cliSource = join(dirname(fileURLToPath(import.meta.url)), "../src/cli.ts");
  const result = await execa("tsx", [cliSource, "--version"]);
  const packageJson = JSON.parse(
    await readFile(join(dirname(fileURLToPath(import.meta.url)), "../package.json"), "utf8"),
  );
  assert.equal(result.stdout.trim(), packageJson.version);
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
    assert.match(config, /includeInDevelopment: true/);
    assert.match(config, /includeInBuild: false/);
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
    assert.match(config, /layout: \{[\s\S]*preset: "custom"/);
    assert.match(config, /includeInDevelopment: true/);
    assert.match(config, /includeInBuild: true/);
    assert.match(config, /framework: "react"/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("biu rejects missing option values before creating files or starting a build", async () => {
  const root = await mkdtemp(join(tmpdir(), "biu-option-test-"));
  const cliSource = join(dirname(fileURLToPath(import.meta.url)), "../src/cli.ts");
  try {
    for (const args of [
      ["create", "starter", "--type"],
      ["create", "starter", "--type="],
      ["create", "starter", "--preset", "--type", "APP"],
      ["create", "starter", "--lang"],
      ["--lang=", "create", "starter"],
      ["--locale", "--help"],
      ["build", "--env"],
      ["dev", "--portal="],
      ["dev", "--apps"],
      ["dev", "--port"],
      ["start", "--filter="],
    ]) {
      const result = await execa("tsx", [cliSource, ...args], { cwd: root, reject: false });
      assert.equal(result.exitCode, 1, args.join(" "));
      assert.match(result.stderr, /参数必须提供值/, args.join(" "));
      assert.deepEqual(await readdir(root), [], args.join(" "));
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("biu start preserves options before an inline workspace filter", async () => {
  const root = await mkdtemp(join(tmpdir(), "biu-forward-test-"));
  const cliSource = join(dirname(fileURLToPath(import.meta.url)), "../src/cli.ts");
  const capture = join(root, "capture.cjs");
  try {
    await writeFile(capture, "console.log(JSON.stringify(process.argv.slice(2)));\n");
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({ name: "forward-fixture", scripts: { start: "node capture.cjs" } }),
    );
    for (const args of [
      ["--apps", "../child-app", "--filter=forward-fixture", "--env", "test"],
      ["--filter", "forward-fixture", "--", "--apps", "../child-app", "--env", "test"],
    ]) {
      const result = await execa("tsx", [cliSource, "start", ...args], { cwd: root });
      assert.ok(result.stdout.includes('["--","--apps","../child-app","--env","test"]'), result.stdout);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("biu init exits with a clear error in a non-interactive session", async () => {
  const cliSource = join(dirname(fileURLToPath(import.meta.url)), "../src/cli.ts");
  const result = await execa("tsx", [cliSource, "init"], { reject: false });
  assert.equal(result.exitCode, 1);
  assert.match(result.stderr, /交互式初始化需要在终端中运行/);
});
