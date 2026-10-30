// Called by pnpm verify:boundaries. Audit source imports and the dependency DAG,
// including type-only edges, before building or packing the public packages.
import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const packagesRoot = resolve(root, "packages");
const demosRoot = resolve(root, "examples/dev-demo/apps");
const sharedRoot = resolve(root, "examples/dev-demo/packages");
const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const layeredPackages = new Set(["@biugle/react-components", "@biugle/react-table"]);
const packages = new Map();
const sourceOwners = new Map();
const failures = [];

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return files(path);
      return entry.isFile() && codeExtensions.has(extname(path)) ? [path] : [];
    }),
  );
  return nested.flat();
}

for (const entry of await readdir(packagesRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const directory = resolve(packagesRoot, entry.name);
  const manifest = JSON.parse(await readFile(resolve(directory, "package.json"), "utf8"));
  if (!manifest.name.startsWith("@biugle/")) continue;
  const sources = await files(resolve(directory, "src"));
  packages.set(manifest.name, { directory, manifest, sources, demo: false, public: true });
  for (const path of sources) sourceOwners.set(path, manifest.name);
}

for (const entry of await readdir(demosRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const directory = resolve(demosRoot, entry.name);
  const manifest = JSON.parse(await readFile(resolve(directory, "package.json"), "utf8"));
  const sources = await files(resolve(directory, "src"));
  packages.set(manifest.name, { directory, manifest, sources, demo: true, public: false });
  for (const path of sources) sourceOwners.set(path, manifest.name);
}

for (const entry of await readdir(sharedRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const directory = resolve(sharedRoot, entry.name);
  const manifest = JSON.parse(await readFile(resolve(directory, "package.json"), "utf8"));
  const sources = await files(resolve(directory, "src"));
  packages.set(manifest.name, { directory, manifest, sources, demo: false, public: false });
  for (const path of sources) sourceOwners.set(path, manifest.name);
}

const dependencyGraph = new Map();
const sourceGraph = new Map();
const orchestration = new Set([
  "@biugle/biu-runtime",
  "@biugle/biu-preset",
  "@biugle/biu-adapter-react",
  "@biugle/biu-cli",
]);
function exportedTargets(manifest, path) {
  const exports = manifest.exports;
  const entries =
    typeof exports === "string" || Array.isArray(exports)
      ? [[".", exports]]
      : Object.keys(exports ?? {}).some((key) => key.startsWith("."))
        ? Object.entries(exports)
        : [[".", exports]];
  let entry = entries.find(([pattern]) => pattern === path);
  let wildcard = "";
  if (!entry) {
    entry = entries
      .filter(([pattern]) => {
        if (!pattern.includes("*")) return false;
        const [prefix, suffix] = pattern.split("*");
        return path.startsWith(prefix) && path.endsWith(suffix) && path.length >= prefix.length + suffix.length;
      })
      .sort(([first], [second]) => {
        const prefixDifference = second.indexOf("*") - first.indexOf("*");
        return prefixDifference || second.length - first.length;
      })[0];
    if (entry) {
      const [prefix, suffix] = entry[0].split("*");
      wildcard = path.slice(prefix.length, path.length - suffix.length);
    }
  }
  const targets = (value) => {
    if (typeof value === "string") return [value.replaceAll("*", wildcard)];
    if (Array.isArray(value)) return value.flatMap(targets);
    if (value && typeof value === "object") return Object.values(value).flatMap(targets);
    return []; // A null export blocks the entry even when a broader wildcard exists.
  };
  return targets(entry?.[1]);
}

function sourcePath(base) {
  const stem = base.replace(/(?:\.d)?\.(?:ts|tsx|js|jsx|mjs)$/, "");
  return [
    base,
    ...[...codeExtensions].flatMap((extension) => [stem + extension, resolve(stem, `index${extension}`)]),
  ].find((candidate) => sourceOwners.has(candidate));
}

function exportedSources(target, paths) {
  return [
    ...new Set(
      paths.flatMap((path) => {
        if (!path.startsWith("./")) return [];
        // The public build mirrors entry names from src into dist. Entries
        // already exposing src (Demo shared packages) resolve directly.
        const source = sourcePath(resolve(target.directory, path.replace(/^\.\/dist\//, "./src/")));
        return source ? [source] : [];
      }),
    ),
  ];
}

function inLayer(path, owner, layer) {
  const source = relative(resolve(packages.get(owner).directory, "src"), path);
  return source.startsWith(`${layer}${sep}`) || [...codeExtensions].some((ext) => source === layer + ext);
}

for (const [name, { manifest, sources, demo }] of packages) {
  const declared = { ...manifest.dependencies, ...manifest.peerDependencies };
  const dependencies = Object.keys(declared).filter((dependency) => packages.has(dependency));
  dependencyGraph.set(name, dependencies);
  if (!demo && !orchestration.has(name))
    for (const dependency of dependencies) {
      if (orchestration.has(dependency))
        failures.push(`${name} must not depend on orchestration package ${dependency}`);
    }
  for (const path of sources) {
    const ast = ts.createSourceFile(path, await readFile(path, "utf8"), ts.ScriptTarget.Latest, true);
    const imports = [];
    const visit = (node) => {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        (ts.isStringLiteral(node.moduleSpecifier) || ts.isNoSubstitutionTemplateLiteral(node.moduleSpecifier))
      )
        imports.push(node.moduleSpecifier.text);
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments[0] &&
        (ts.isStringLiteral(node.arguments[0]) || ts.isNoSubstitutionTemplateLiteral(node.arguments[0]))
      )
        imports.push(node.arguments[0].text);
      if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal))
        imports.push(node.argument.literal.text);
      ts.forEachChild(node, visit);
    };
    visit(ast);
    const edges = [];
    for (const specifier of imports) {
      if (specifier.startsWith("@biugle/")) {
        const packageName = specifier.split("/").slice(0, 2).join("/");
        const target = packages.get(packageName);
        if (!target || (!declared[packageName] && packageName !== name)) {
          failures.push(`${relative(root, path)}: undeclared dependency ${specifier}`);
          continue;
        }
        const publicPath = specifier === packageName ? "." : `.${specifier.slice(packageName.length)}`;
        const targets = exportedTargets(target.manifest, publicPath);
        if (!targets.length) failures.push(`${relative(root, path)}: private package entry ${specifier}`);
        if (packageName !== name && !dependencies.includes(packageName)) dependencies.push(packageName);
        if (
          layeredPackages.has(name) &&
          inLayer(path, name, "ui") &&
          layeredPackages.has(packageName) &&
          (publicPath === "./pro" || publicPath.startsWith("./pro/"))
        )
          failures.push(`${relative(root, path)}: UI must not import Pro ${specifier}`);
        edges.push(...exportedSources(target, targets));
      } else if (specifier.startsWith(".")) {
        const target = sourcePath(resolve(dirname(path), specifier));
        if (!target) continue; // JSON/CSS resources are outside the code graph.
        if (sourceOwners.get(target) !== name)
          failures.push(`${relative(root, path)}: cross-package relative import ${specifier}`);
        if (
          layeredPackages.has(name) &&
          inLayer(path, name, "ui") &&
          sourceOwners.get(target) === name &&
          inLayer(target, name, "pro")
        )
          failures.push(`${relative(root, path)}: UI must not import Pro ${specifier}`);
        edges.push(target);
      }
    }
    sourceGraph.set(path, [...new Set(edges)]);
  }
}

// A UI file cannot reach its own Pro implementation through a helper or a
// public root barrel. Checking reachability closes alias and re-export detours.
for (const [path, owner] of sourceOwners) {
  if (!layeredPackages.has(owner) || !inLayer(path, owner, "ui")) continue;
  const visited = new Set([path]);
  const pending = [...(sourceGraph.get(path) ?? [])];
  while (pending.length) {
    const target = pending.pop();
    if (visited.has(target) || sourceOwners.get(target) !== owner) continue;
    visited.add(target);
    if (inLayer(target, owner, "pro")) {
      failures.push(`${relative(root, path)}: UI reaches Pro source ${relative(root, target)}`);
      break;
    }
    pending.push(...(sourceGraph.get(target) ?? []));
  }
}

function findCycles(graph, label) {
  const done = new Set();
  const visiting = new Set();
  const visit = (name, chain) => {
    if (visiting.has(name)) {
      failures.push(
        `${label} cycle: ${[...chain, name].map((value) => (value.startsWith(root) ? relative(root, value) : value)).join(" -> ")}`,
      );
      return;
    }
    if (done.has(name)) return;
    visiting.add(name);
    for (const target of graph.get(name) ?? []) visit(target, [...chain, name]);
    visiting.delete(name);
    done.add(name);
  };
  for (const name of graph.keys()) visit(name, []);
}
findCycles(dependencyGraph, "Package");
findCycles(sourceGraph, "Source");
if (failures.length) throw new Error(`Package boundary audit failed:\n- ${failures.join("\n- ")}`);
console.log(
  `[biu] package boundaries passed: ${[...packages.values()].filter((entry) => entry.public).length} public packages, ${[...packages.values()].filter((entry) => entry.demo).length} Demos, ${sourceOwners.size} sources, public imports, UI/Pro layering and acyclic dependencies`,
);
