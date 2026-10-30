import { cpSync, existsSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execa } from "execa";
import { t } from "./i18n/index.js";

let foundationBuildPromise: Promise<void> | undefined;

const foundationPackages = [
  ["events", "events", "@biugle/biu-events"],
  ["i18n", "i18n", "@biugle/biu-i18n"],
  ["bridge", "bridge", "@biugle/biu-bridge"],
  ["router", "router", "@biugle/biu-router"],
  ["store", "store", "@biugle/biu-store"],
  ["icons", "icons", "@biugle/icons"],
  ["react-components", "components", "@biugle/react-components"],
  ["react-form", "form", "@biugle/react-form"],
  ["react-table", "react-table", "@biugle/react-table"],
  ["http", "http", "@biugle/http"],
  ["tanstack-query", "tanstack-query", "@biugle/tanstack-query"],
  ["runtime", "runtime", "@biugle/biu-runtime"],
  ["adapter-react", "adapter-react", "@biugle/biu-adapter-react"],
  ["preset", "preset", "@biugle/biu-preset"],
] as const;

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

function requiredFiles(sourceName: string, preset: string) {
  if (sourceName === "preset") return [`${preset}.js`, "styles.css"];
  if (sourceName === "tanstack-query") return ["index.js", "react.js"];
  return ["index.js"];
}

function dependencyDirectories(location: string) {
  const paths: string[] = [];
  let current = resolve(location);
  while (true) {
    paths.push(resolve(current, "node_modules"));
    const parent = dirname(current);
    if (parent === current) return paths;
    current = parent;
  }
}

function installedPackageRoots(projectRoot: string) {
  const roots = new Map<string, string>();
  const pending = [...foundationPackages];
  // Package exports can intentionally expose only ESM imports. Resolve the
  // physical package through Node's search directories without requiring it.
  while (pending.length) {
    let found = false;
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      const [sourceName, , packageName] = pending[index]!;
      const locations = [projectRoot, ...roots.values()];
      for (const location of locations) {
        const searchPaths = dependencyDirectories(location);
        const packagePath = searchPaths
          .map((path) => resolve(path, packageName))
          .find((path) => existsSync(resolve(path, "package.json")));
        if (!packagePath) continue;
        roots.set(sourceName, realpathSync(packagePath));
        pending.splice(index, 1);
        found = true;
        break;
      }
    }
    if (!found) throw new Error(t("找不到已安装的基座包，请先执行 pnpm install：{name}", { name: pending[0]![2] }));
  }
  return roots;
}

function stageFoundationPackages(projectRoot: string, packageRoots: ReadonlyMap<string, string>, preset: string) {
  // Validate all inputs before replacing the previous snapshot.
  for (const [sourceName, , packageName] of foundationPackages) {
    const sourceRoot = packageRoots.get(sourceName)!;
    if (!requiredFiles(sourceName, preset).every((file) => existsSync(resolve(sourceRoot, "dist", file))))
      throw new Error(t("基座包构建产物不完整：{name}", { name: packageName }));
  }
  const foundationRoot = resolve(projectRoot, ".biu/foundation");
  rmSync(foundationRoot, { recursive: true, force: true });
  for (const [sourceName, snapshotName] of foundationPackages) {
    const sourceRoot = packageRoots.get(sourceName)!;
    const snapshotRoot = resolve(foundationRoot, snapshotName);
    cpSync(resolve(sourceRoot, "dist"), snapshotRoot, { recursive: true });
    // pnpm's installed dependencies sit beside the package in its store;
    // workspace dependencies and npm installs follow Node's same search list.
    const nodeModules = dependencyDirectories(sourceRoot).find((path) => existsSync(path));
    if (nodeModules) symlinkSync(nodeModules, resolve(snapshotRoot, "node_modules"), "dir");
  }
}

export async function ensureFoundationPackages(projectRoot: string, preset: string) {
  const workspaceRoot = findWorkspaceRoot(projectRoot);
  if (!workspaceRoot) {
    stageFoundationPackages(projectRoot, installedPackageRoots(projectRoot), preset);
    return;
  }
  const packageRoots = new Map(
    foundationPackages.map(([sourceName]) => [sourceName, resolve(workspaceRoot, "packages", sourceName)]),
  );
  const built = () =>
    foundationPackages.every(([sourceName]) =>
      requiredFiles(sourceName, preset).every((file) =>
        existsSync(resolve(packageRoots.get(sourceName)!, "dist", file)),
      ),
    );
  if (!built()) {
    foundationBuildPromise ??= (async () => {
      // These public utilities are dependencies of the foundation packages.
      for (const packageName of [
        "@biugle/render-code",
        "@biugle/watermark",
        "@biugle/logger",
        ...foundationPackages.map(([, , name]) => name),
      ]) {
        await execa("pnpm", ["--filter", packageName, "build"], { cwd: workspaceRoot, stdio: "inherit" });
      }
    })();
    try {
      await foundationBuildPromise;
    } finally {
      foundationBuildPromise = undefined;
    }
  }
  // Every waiting project needs its own refreshed snapshot after a shared build.
  stageFoundationPackages(projectRoot, packageRoots, preset);
}
