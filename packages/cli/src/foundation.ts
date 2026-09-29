import { cpSync, existsSync, rmSync, symlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execa } from "execa";

let foundationBuildPromise: Promise<void> | undefined;

function findWorkspaceRoot(projectRoot: string) {
  let current = resolve(projectRoot);
  while (true) {
    if (
      existsSync(resolve(current, "pnpm-workspace.yaml")) &&
      existsSync(resolve(current, "packages/runtime/package.json"))
    )
      return current;
    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

function foundationFiles(projectRoot: string, preset: string) {
  return [
    resolve(projectRoot, ".biu/foundation/events/index.js"),
    resolve(projectRoot, ".biu/foundation/i18n/index.js"),
    resolve(projectRoot, ".biu/foundation/bridge/index.js"),
    resolve(projectRoot, ".biu/foundation/router/index.js"),
    resolve(projectRoot, ".biu/foundation/store/index.js"),
    resolve(projectRoot, ".biu/foundation/components/index.js"),
    resolve(projectRoot, ".biu/foundation/icons/index.js"),
    resolve(projectRoot, ".biu/foundation/form/index.js"),
    resolve(projectRoot, ".biu/foundation/react-table/index.js"),
    resolve(projectRoot, ".biu/foundation/http/index.js"),
    resolve(projectRoot, ".biu/foundation/tanstack-query/index.js"),
    resolve(projectRoot, ".biu/foundation/tanstack-query/react.js"),
    resolve(projectRoot, ".biu/foundation/runtime/index.js"),
    resolve(projectRoot, ".biu/foundation/adapter-react/index.js"),
    resolve(projectRoot, `.biu/foundation/preset/${preset}.js`),
    resolve(projectRoot, `.biu/foundation/preset/${preset}.css`),
  ];
}

function stageFoundationPackages(projectRoot: string, workspaceRoot: string) {
  const foundationRoot = resolve(projectRoot, ".biu/foundation");
  rmSync(foundationRoot, { recursive: true, force: true });
  for (const [sourceName, snapshotName] of [
    ["events", "events"],
    ["i18n", "i18n"],
    ["bridge", "bridge"],
    ["router", "router"],
    ["store", "store"],
    ["icons", "icons"],
    ["react-components", "components"],
    ["react-form", "form"],
    ["react-table", "react-table"],
    ["http", "http"],
    ["tanstack-query", "tanstack-query"],
    ["runtime", "runtime"],
    ["adapter-react", "adapter-react"],
    ["preset", "preset"],
  ] as const) {
    const packageNodeModules = resolve(workspaceRoot, "packages", sourceName, "node_modules");
    cpSync(resolve(workspaceRoot, "packages", sourceName, "dist"), resolve(foundationRoot, snapshotName), {
      recursive: true,
    });
    if (existsSync(packageNodeModules)) {
      symlinkSync(packageNodeModules, resolve(foundationRoot, snapshotName, "node_modules"), "dir");
    }
  }
}

export async function ensureFoundationPackages(projectRoot: string, preset: string) {
  const workspaceRoot = findWorkspaceRoot(projectRoot);
  if (!workspaceRoot) throw new Error("Biu 基座包尚未构建，请先执行 pnpm build 或 pnpm install。 ");
  const packageFiles = [
    resolve(workspaceRoot, "packages/events/dist/index.js"),
    resolve(workspaceRoot, "packages/i18n/dist/index.js"),
    resolve(workspaceRoot, "packages/bridge/dist/index.js"),
    resolve(workspaceRoot, "packages/router/dist/index.js"),
    resolve(workspaceRoot, "packages/store/dist/index.js"),
    resolve(workspaceRoot, "packages/icons/dist/index.js"),
    resolve(workspaceRoot, "packages/react-components/dist/index.js"),
    resolve(workspaceRoot, "packages/react-form/dist/index.js"),
    resolve(workspaceRoot, "packages/react-table/dist/index.js"),
    resolve(workspaceRoot, "packages/http/dist/index.js"),
    resolve(workspaceRoot, "packages/tanstack-query/dist/index.js"),
    resolve(workspaceRoot, "packages/runtime/dist/index.js"),
    resolve(workspaceRoot, "packages/adapter-react/dist/index.js"),
    resolve(workspaceRoot, `packages/preset/dist/${preset}.js`),
    resolve(workspaceRoot, `packages/preset/dist/${preset}.css`),
  ];
  // Refresh the per-project snapshot even when it already exists. Keeping an
  // old .biu/foundation snapshot is the main cause of “module not found” and
  // stale UI reports after the workspace packages were rebuilt.
  if (packageFiles.every((file) => existsSync(file))) {
    stageFoundationPackages(projectRoot, workspaceRoot);
    return;
  }
  if (foundationBuildPromise) return foundationBuildPromise;

  foundationBuildPromise = (async () => {
    for (const packageName of [
      "@biugle/biu-events",
      "@biugle/biu-i18n",
      "@biugle/biu-bridge",
      "@biugle/biu-router",
      "@biugle/biu-store",
      "@biugle/icons",
      "@biugle/react-components",
      "@biugle/react-form",
      "@biugle/react-table",
      "@biugle/http",
      "@biugle/tanstack-query",
      "@biugle/biu-runtime",
      "@biugle/biu-preset",
      "@biugle/biu-adapter-react",
    ]) {
      await execa("pnpm", ["--filter", packageName, "build"], {
        cwd: workspaceRoot,
        stdio: "inherit",
      });
    }
    stageFoundationPackages(projectRoot, workspaceRoot);
    if (!foundationFiles(projectRoot, preset).every((file) => existsSync(file)))
      throw new Error("Biu 基座包构建完成但仍无法解析，请检查 workspace 依赖链接。 ");
  })();

  try {
    await foundationBuildPromise;
  } catch (error) {
    foundationBuildPromise = undefined;
    throw error;
  }
}
