import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const packagesRoot = resolve(root, "packages");
const packDirectory = await mkdtemp(join(tmpdir(), "biu-package-audit-"));

try {
  const packageDirectories = await readdir(packagesRoot, { withFileTypes: true });
  const publicPackages = [];
  for (const directory of packageDirectories) {
    if (!directory.isDirectory()) continue;
    const packageDirectory = resolve(packagesRoot, directory.name);
    const packageJsonPath = resolve(packageDirectory, "package.json");
    let packageJson;
    try {
      packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    } catch {
      continue;
    }
    if (!packageJson.name?.startsWith("@biugle/")) continue;
    await run("pnpm", ["--dir", packageDirectory, "pack", "--pack-destination", packDirectory], {
      cwd: root,
      maxBuffer: 10 * 1024 * 1024,
    });
    publicPackages.push(packageJson);
  }

  const archives = (await readdir(packDirectory)).filter((file) => file.endsWith(".tgz"));
  if (archives.length !== publicPackages.length)
    throw new Error(`expected ${publicPackages.length} package archives, found ${archives.length}`);

  const reports = [];
  for (const archive of archives) {
    const archivePath = join(packDirectory, archive);
    const entries = (await run("tar", ["-tzf", archivePath], { cwd: root, maxBuffer: 10 * 1024 * 1024 })).stdout
      .trim()
      .split("\n");
    const packageJsonText = (
      await run("tar", ["-xOf", archivePath, "package/package.json"], { cwd: root, maxBuffer: 10 * 1024 * 1024 })
    ).stdout;
    const packedPackage = JSON.parse(packageJsonText);
    const localPackage = publicPackages.find((item) => item.name === packedPackage.name);
    if (!localPackage) throw new Error(`unexpected package in archive: ${packedPackage.name}`);
    if (packedPackage.version !== localPackage.version)
      throw new Error(`${packedPackage.name}: packed ${packedPackage.version}, expected ${localPackage.version}`);

    for (const requiredFile of ["package/package.json", "package/README.md", "package/LICENSE"]) {
      if (!entries.includes(requiredFile)) throw new Error(`${packedPackage.name}: missing ${requiredFile}`);
    }
    if (entries.some((entry) => /^package\/(?:node_modules|\.biu|\.scenario-work)\//.test(entry)))
      throw new Error(`${packedPackage.name}: generated or dependency files leaked into the archive`);
    for (const [dependency, version] of Object.entries(packedPackage.dependencies ?? {})) {
      if (String(version).startsWith("workspace:"))
        throw new Error(`${packedPackage.name}: unresolved workspace dependency ${dependency}=${version}`);
    }

    const exportTargets = Object.values(packedPackage.exports ?? {}).flatMap((entry) =>
      typeof entry === "string" ? [entry] : Object.values(entry ?? {}).filter((value) => typeof value === "string"),
    );
    const binaryTargets =
      typeof packedPackage.bin === "string"
        ? [packedPackage.bin]
        : Object.values(packedPackage.bin ?? {}).filter((value) => typeof value === "string");
    for (const target of [...exportTargets, ...binaryTargets]) {
      const archiveEntry = `package/${target.replace(/^\.\//, "")}`;
      if (!entries.includes(archiveEntry))
        throw new Error(`${packedPackage.name}: declared target is missing: ${target}`);
    }
    reports.push(`${packedPackage.name}@${packedPackage.version} (${entries.length} files)`);
  }

  reports.sort((left, right) => left.localeCompare(right));
  console.log(`[biu] packed and verified ${reports.length} public packages:`);
  for (const report of reports) console.log(`  ${report}`);
} finally {
  await rm(packDirectory, { recursive: true, force: true });
}
