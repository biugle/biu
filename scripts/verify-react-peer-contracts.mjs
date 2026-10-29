// Public React adapters share one host-owned React 19 peer; React must never
// be installed as a package runtime dependency, while query core stays optional.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const expectedRange = "^19.0.0";
const packages = [
  "adapter-react",
  "icons",
  "preset",
  "react-components",
  "react-form",
  "react-table",
  "runtime",
  "tanstack-query",
];

for (const directory of packages) {
  const manifest = JSON.parse(await readFile(resolve(root, "packages", directory, "package.json"), "utf8"));
  if (manifest.peerDependencies?.react !== expectedRange) {
    throw new Error(`${manifest.name} must declare react@${expectedRange} as a peer dependency`);
  }
  if (manifest.dependencies?.react || manifest.devDependencies?.react !== expectedRange) {
    throw new Error(`${manifest.name} must use react@${expectedRange} as a workspace-only development dependency`);
  }
  if (manifest.peerDependencies?.["react-dom"] && manifest.peerDependencies["react-dom"] !== expectedRange) {
    throw new Error(`${manifest.name} must align its react-dom peer dependency with ${expectedRange}`);
  }
  if (
    manifest.dependencies?.["react-dom"] ||
    (manifest.devDependencies?.["react-dom"] && manifest.devDependencies["react-dom"] !== expectedRange)
  ) {
    throw new Error(`${manifest.name} must not install react-dom at runtime and must align its workspace version`);
  }
}

const query = JSON.parse(await readFile(resolve(root, "packages/tanstack-query/package.json"), "utf8"));
if (query.peerDependenciesMeta?.react?.optional !== true) {
  throw new Error(`${query.name} must keep its React peer optional for the core entry`);
}

console.log(`[biu] verified React ${expectedRange} peer contracts for ${packages.length} public packages`);
