// Called by verify-packages.mjs --cli-install with the same audited tarballs.
// These consumers live outside the checkout and install actual npm archives.
import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import { access, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import process, { execPath } from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { promisify, stripVTControlCharacters } from "node:util";

const run = promisify(execFile);
const cliName = "@biugle/biu-cli";
const cases = [
  { name: "installed-app", type: "APP", preset: "custom" },
  { name: "installed-portal", type: "PORTAL", preset: "sidebar" },
];
const publicEntrypoints = [
  "@biugle/react-components/pro",
  "@biugle/react-table/pro",
  "@biugle/react-form",
  "@biugle/tanstack-query/react",
];

function isInside(parent, path) {
  const value = relative(parent, path);
  return value === "" || (!isAbsolute(value) && value !== ".." && !value.startsWith(`..${sep}`));
}

async function command(binary, args, cwd, label) {
  console.log(`[biu] installed CLI: ${label}`);
  try {
    return await run(binary, args, {
      cwd,
      env: { ...process.env, CI: "true", BIU_ENV: "local" },
      timeout: 180_000,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join("\n").slice(-12_000);
    throw new Error(
      `${label} failed (${error.killed ? "timeout" : `exit ${error.code ?? "unknown"}`}):\n${output || error.message}`,
    );
  }
}

async function install(cwd, label) {
  await command("pnpm", ["install", "--ignore-scripts", "--prefer-offline", "--reporter=append-only"], cwd, label);
}

async function assertInstalledPackage(consumer, manifest, checkout) {
  const installedRoot = await realpath(resolve(consumer, "node_modules", manifest.name));
  if (!isInside(consumer, installedRoot) || isInside(checkout, installedRoot))
    throw new Error(
      `${manifest.name}: expected a tarball installation inside the external consumer, got ${installedRoot}`,
    );
  const installedManifest = JSON.parse(await readFile(join(installedRoot, "package.json"), "utf8"));
  if (installedManifest.name !== manifest.name || installedManifest.version !== manifest.version)
    throw new Error(`${manifest.name}: installed version differs from the audited archive`);
}

async function availablePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  await new Promise((resolveClose, reject) => server.close((error) => (error ? reject(error) : resolveClose())));
  return port;
}

function terminateGroup(child, signal) {
  if (!child.pid) return;
  try {
    if (process.platform === "win32") child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

async function stopServer(child, exited) {
  terminateGroup(child, "SIGTERM");
  await Promise.race([exited, delay(5000, undefined, { ref: false })]);
  // Kill the whole group even if the parent has exited: compiler descendants
  // must not keep listening or retain a fixture that is about to be removed.
  terminateGroup(child, "SIGKILL");
  if (child.exitCode === null && child.signalCode === null)
    await Promise.race([exited, delay(5000, undefined, { ref: false })]);
  if (child.exitCode === null && child.signalCode === null) throw new Error("installed CLI dev process did not exit");
}

async function verifyDev(cliBin, consumer) {
  const port = await availablePort();
  const child = spawn(execPath, [cliBin, "dev", "--all", "--env", "local", "--port", String(port)], {
    cwd: consumer,
    env: { ...process.env, CI: "true", BIU_ENV: "local" },
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  let serverOrigin;
  let spawnError;
  child.on("error", (error) => {
    spawnError = error;
  });
  const capture = (chunk) => {
    output = `${output}${chunk}`.slice(-12_000);
    // Rsbuild can move to another port between our probe and its bind. Trust
    // the URL announced by this CLI child rather than the requested port.
    const announcedUrl = stripVTControlCharacters(output).match(
      /^\[biu\] (?:开发服务器：|Development server: )(http:\/\/localhost:\d{1,5})\/?\s*$/m,
    )?.[1];
    if (announcedUrl) {
      const url = new URL(announcedUrl);
      url.hostname = "127.0.0.1";
      serverOrigin = url.origin;
    }
  };
  child.stdout.on("data", capture);
  child.stderr.on("data", capture);
  const exited = new Promise((resolveExit) => {
    child.once("close", resolveExit);
  });
  try {
    const deadline = Date.now() + 60_000;
    let ready = false;
    let readyOrigin;
    while (Date.now() < deadline) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null || child.signalCode !== null)
        throw new Error(`dev exited before serving HTTP: ${output}`);
      if (!serverOrigin) {
        await delay(250);
        continue;
      }
      try {
        const response = await globalThis.fetch(`${serverOrigin}/`, {
          signal: globalThis.AbortSignal.timeout(1500),
        });
        if (response.ok && (await response.text()).includes('id="root"')) {
          ready = true;
          readyOrigin = serverOrigin;
          break;
        }
      } catch {
        // Startup and the first compilation may take several seconds.
      }
      await delay(250);
    }
    if (!ready) throw new Error(`dev did not serve the generated page within 60 seconds: ${output}`);
    const manifestResponse = await globalThis.fetch(`${readyOrigin}/manifest/routes.json`, {
      signal: globalThis.AbortSignal.timeout(3000),
    });
    const rawManifest = await manifestResponse.text();
    let manifest;
    try {
      manifest = JSON.parse(rawManifest);
    } catch {
      throw new Error(
        `dev /manifest/routes.json returned a non-JSON response: ${rawManifest.slice(0, 200)}\n${output}`,
      );
    }
    if (
      !manifestResponse.ok ||
      manifest.appId !== consumer.split(/[\\/]/).at(-1) ||
      manifest.environment !== "local" ||
      !Array.isArray(manifest.selectedCodes)
    )
      throw new Error(`dev manifest is missing or invalid: ${JSON.stringify(manifest)}`);
    console.log(`[biu] installed CLI: ${consumer.split(/[\\/]/).at(-1)} dev HTTP 200 and local manifest passed`);
  } finally {
    await stopServer(child, exited);
  }
}

export async function verifyInstalledCli({ root, archives }) {
  const checkout = await realpath(root);
  const workRoot = await realpath(await mkdtemp(join(tmpdir(), "biu-cli-install-audit-")));
  try {
    if (isInside(checkout, workRoot)) throw new Error("CLI installation fixtures must live outside the checkout");
    const manifests = new Map(archives.map(({ manifest }) => [manifest.name, manifest]));
    const overrides = Object.fromEntries(archives.map(({ manifest, path }) => [manifest.name, `file:${path}`]));
    const cliManifest = manifests.get(cliName);
    if (!cliManifest) throw new Error("the audited tarballs do not contain the CLI");
    await writeFile(
      join(workRoot, "package.json"),
      JSON.stringify(
        {
          name: "biu-installed-cli-audit",
          private: true,
          type: "module",
          packageManager: "pnpm@9.14.4",
          dependencies: { [cliName]: overrides[cliName] },
          pnpm: { overrides },
        },
        null,
        2,
      ),
    );
    await install(workRoot, "install packed CLI in an external consumer");
    await assertInstalledPackage(workRoot, cliManifest, checkout);
    const creatorBin = resolve(workRoot, "node_modules", cliName, "bin/biu.mjs");
    const version = await command(execPath, [creatorBin, "--version"], workRoot, "check installed CLI version");
    if (version.stdout.trim() !== cliManifest.version) throw new Error("installed CLI reports a stale package version");

    for (const scenario of cases) {
      await command(
        execPath,
        [creatorBin, "create", scenario.name, "--type", scenario.type, "--preset", scenario.preset],
        workRoot,
        `create ${scenario.type}/${scenario.preset} from the installed CLI`,
      );
      const consumer = resolve(workRoot, scenario.name);
      const packagePath = join(consumer, "package.json");
      const template = JSON.parse(await readFile(packagePath, "utf8"));
      const dependencies = { ...template.dependencies, ...template.devDependencies };
      for (const [name, versionRange] of Object.entries(dependencies)) {
        if (!name.startsWith("@biugle/")) continue;
        const manifest = manifests.get(name);
        if (!manifest || versionRange !== `^${manifest.version}`)
          throw new Error(
            `${scenario.name}: template declares ${name}=${versionRange}, expected ^${manifest?.version}`,
          );
      }
      template.pnpm = { ...template.pnpm, overrides };
      await writeFile(packagePath, JSON.stringify(template, null, 2) + "\n");
      await install(consumer, `install generated ${scenario.type}/${scenario.preset} with audited tarballs`);
      // Exercise the public Pro entries inside Rsbuild's graph, not only Node
      // resolution: root aliases must not turn /pro into index.js/pro.
      await writeFile(
        join(consumer, "src/pages/index.tsx"),
        `import { Button } from "@biugle/react-components/pro";
import { ProTable } from "@biugle/react-table/pro";

export default function InstalledEntrypoints() {
  return (
    <div>
      <Button>安装消费验收</Button>
      <ProTable columns={[]} dataSource={[]} />
    </div>
  );
}
`,
      );
      for (const script of ["typecheck", "lint", "format:check"])
        await command("pnpm", [script], consumer, `run ${script} in generated ${scenario.type}/${scenario.preset}`);
      for (const name of Object.keys(dependencies).filter((name) => name.startsWith("@biugle/")))
        await assertInstalledPackage(consumer, manifests.get(name), checkout);
      await command(
        execPath,
        [
          "--input-type=module",
          "--eval",
          `for (const name of ${JSON.stringify(publicEntrypoints)}) await import(name);`,
        ],
        consumer,
        `resolve public React entrypoints in installed ${scenario.type}/${scenario.preset}`,
      );
      const cliBin = resolve(consumer, "node_modules", cliName, "bin/biu.mjs");
      await command(
        execPath,
        [cliBin, "build", "--all", "--env", "prod"],
        consumer,
        `build installed ${scenario.type}/${scenario.preset}`,
      );
      const indexPath = resolve(consumer, "dist/index.html");
      const productionIndex = await readFile(indexPath, "utf8");
      const manifest = JSON.parse(await readFile(resolve(consumer, "dist/manifest/index.json"), "utf8"));
      if (!productionIndex.includes('id="root"') || manifest.environment !== "prod")
        throw new Error(`${scenario.name}: production entry or manifest is invalid`);
      await access(resolve(consumer, "dist/manifest/routes.json"));
      await verifyDev(cliBin, consumer);
      if ((await readFile(indexPath, "utf8")) !== productionIndex)
        throw new Error(`${scenario.name}: starting dev overwrote the production entry`);
    }
    console.log(
      `[biu] verified ${cases.length} external tarball CLI consumers: template versions, install, typecheck/lint/format, prod build, dev and cleanup`,
    );
  } finally {
    await rm(workRoot, { recursive: true, force: true });
  }
}
