// Exercise the CLI's argument compatibility matrix from a disposable folder
// inside the repo so project discovery works; the finally block removes only
// the fixtures created by this run.
import { access, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { execFile } from "node:child_process";
import { execPath } from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { join, resolve } from "node:path";

const run = promisify(execFile);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const cliSource = resolve(root, "packages/cli/src/cli.ts");
const cliBin = resolve(root, "packages/cli/bin/biu.mjs");
const cliPackage = JSON.parse(await readFile(resolve(root, "packages/cli/package.json"), "utf8"));
const tsxBin = resolve(root, "packages/cli/node_modules/.bin/tsx");
const environments = ["local", "dev", "test", "pre", "prod"];
const locales = ["zh-CN", "en-US"];
const layouts = [
  { type: "PORTAL", preset: "sidebar" },
  { type: "PORTAL", preset: "topbar" },
  { type: "APP", preset: "sidebar" },
  { type: "APP", preset: "blank" },
  { type: "APP", preset: "dashboard" },
  { type: "APP", preset: "mobile" },
  { type: "APP", preset: "custom" },
];
const localeArgumentModes = [
  "global-lang-inline",
  "global-locale-inline",
  "global-lang-separated",
  "command-lang",
  "command-locale",
];
const argumentVariants = [
  { typeSpelling: 0, typeSyntax: "separated", presetSyntax: "separated" },
  { typeSpelling: 1, typeSyntax: "inline", presetSyntax: "inline" },
  { typeSpelling: 2, typeSyntax: "separated", presetSyntax: "inline" },
];
const releaseVersionSource = await readFile(resolve(root, "packages/cli/src/version.ts"), "utf8");
const formalReleaseVersion = releaseVersionSource.match(/BIU_RELEASE_VERSION\s*=\s*"([^"]+)"/)?.[1];

if (!formalReleaseVersion) throw new Error("could not read the CLI template's stable release line");

async function command(args, cwd) {
  return run(tsxBin, [cliSource, ...args], {
    cwd,
    maxBuffer: 10 * 1024 * 1024,
  });
}

function projectName(index) {
  const id = String(index + 1).padStart(3, "0");
  return [`case-${id}`, `case_${id}`, `case.v${id}`, `${id}-case`][index % 4];
}

function createArguments(scenario) {
  const typeSpellings = [
    scenario.type,
    scenario.type.toLowerCase(),
    `${scenario.type[0]}${scenario.type.slice(1).toLowerCase()}`,
  ];
  const variant = argumentVariants[scenario.argumentVariant];
  const type = typeSpellings[variant.typeSpelling];
  const typeArguments = variant.typeSyntax === "separated" ? ["--type", type] : [`--type=${type}`];
  const presetArguments =
    variant.presetSyntax === "separated" ? ["--preset", scenario.preset] : [`--preset=${scenario.preset}`];
  const projectArguments = [scenario.name, ...typeArguments, ...presetArguments];
  switch (scenario.localeArgumentMode) {
    case "global-lang-inline":
      return [`--lang=${scenario.locale}`, "create", ...projectArguments];
    case "global-locale-inline":
      return [`--locale=${scenario.locale}`, "create", ...projectArguments];
    case "global-lang-separated":
      return ["--lang", scenario.locale, "create", ...projectArguments];
    case "command-lang":
      return ["create", ...projectArguments, "--lang", scenario.locale];
    case "command-locale":
      return ["create", ...projectArguments, `--locale=${scenario.locale}`];
    default:
      throw new Error(`unknown locale argument mode: ${scenario.localeArgumentMode}`);
  }
}

async function assertProject(projectRoot, scenario) {
  const config = await readFile(resolve(projectRoot, "biu.config.ts"), "utf8");
  const packageJson = JSON.parse(await readFile(resolve(projectRoot, "package.json"), "utf8"));
  if (!config.includes(`projectType: "${scenario.type}"`)) throw new Error("project type mismatch");
  if (!config.includes(`preset: "${scenario.preset}"`)) throw new Error("layout preset mismatch");
  if (!config.includes(`locale: "${scenario.locale}"`)) throw new Error("locale argument mismatch");
  if (packageJson.version !== formalReleaseVersion) throw new Error("template version mismatch");
  for (const script of ["start", "dev", "build", "build:all", "typecheck", "check", "lint", "format:check"]) {
    if (typeof packageJson.scripts[script] !== "string") throw new Error(`missing project script: ${script}`);
  }
  if (packageJson.scripts.start !== packageJson.scripts.dev) throw new Error("start/dev aliases should stay aligned");
  for (const [name, version] of Object.entries({ ...packageJson.dependencies, ...packageJson.devDependencies })) {
    if (name.startsWith("@biugle/") && version !== `^${formalReleaseVersion}`)
      throw new Error(`stale @biugle dependency version: ${name}`);
  }
  for (const file of [
    "README.md",
    "local-routes/index.ts",
    "src/pages/index.tsx",
    "config/local.ts",
    "config/dev.ts",
    "config/test.ts",
    "config/pre.ts",
    "config/prod.ts",
    "public/index.html",
    "scripts/prepare.mjs",
  ]) {
    await access(resolve(projectRoot, file));
  }
}

function buildScenarioMatrix() {
  const scenarios = [];
  const seen = new Set();
  const add = (layoutIndex, locale, localeArgumentMode, argumentVariant) => {
    const key = `${layoutIndex}:${locale}:${localeArgumentMode}:${argumentVariant}`;
    if (seen.has(key) || scenarios.length >= 100) return;
    seen.add(key);
    scenarios.push({
      ...layouts[layoutIndex],
      locale,
      localeArgumentMode,
      argumentVariant,
      name: projectName(scenarios.length),
    });
  };

  // First cover every valid type/preset/locale combination, then exercise each
  // documented locale flag spelling and placement until 100 distinct inputs.
  for (let layoutIndex = 0; layoutIndex < layouts.length; layoutIndex += 1) {
    for (let localeIndex = 0; localeIndex < locales.length; localeIndex += 1) {
      const mode = localeArgumentModes[(layoutIndex + localeIndex) % localeArgumentModes.length];
      add(layoutIndex, locales[localeIndex], mode, 0);
    }
  }
  for (let argumentVariant = 0; argumentVariant < argumentVariants.length; argumentVariant += 1) {
    for (const mode of localeArgumentModes) {
      for (let layoutIndex = 0; layoutIndex < layouts.length; layoutIndex += 1) {
        for (const locale of locales) add(layoutIndex, locale, mode, argumentVariant);
      }
    }
  }
  return scenarios;
}

const scenarios = buildScenarioMatrix();
const builtEnvironments = [];
let workRoot;
try {
  if (scenarios.length !== 100) throw new Error(`expected 100 distinct CLI inputs, got ${scenarios.length}`);
  workRoot = await mkdtemp(join(root, ".scenario-work-"));
  await symlink(
    resolve(root, "examples/dev-demo/apps/child-app/node_modules"),
    resolve(workRoot, "node_modules"),
    "dir",
  );

  for (let index = 0; index < scenarios.length; index += 1) {
    const scenario = scenarios[index];
    await command(createArguments(scenario), workRoot);
    await assertProject(resolve(workRoot, scenario.name), scenario);
  }

  const builtCliVersion = await run(execPath, [cliBin, "--version"], { cwd: root });
  if (builtCliVersion.stdout.trim() !== cliPackage.version)
    throw new Error(`built CLI version mismatch: ${builtCliVersion.stdout.trim()} != ${cliPackage.version}`);

  const buildCases = layouts.map((layout, index) => {
    const scenario = scenarios.find(
      (item) => item.type === layout.type && item.preset === layout.preset && item.locale === "zh-CN",
    );
    if (!scenario) throw new Error(`missing build fixture for ${layout.type}/${layout.preset}`);
    return { ...scenario, environment: environments[index % environments.length] };
  });
  for (const scenario of buildCases) {
    await command(["build", "--all", "--env", scenario.environment], resolve(workRoot, scenario.name));
    await access(resolve(workRoot, scenario.name, "dist/index.html"));
    await access(resolve(workRoot, scenario.name, "dist/manifest/index.json"));
    builtEnvironments.push(scenario.environment);
  }
  if (!environments.every((environment) => builtEnvironments.includes(environment)))
    throw new Error(`not all environment configurations were built: ${builtEnvironments.join(", ")}`);

  console.log(
    `[biu] verified ${scenarios.length} distinct CLI create inputs, ${buildCases.length} Portal/APP preset builds, and environments ${builtEnvironments.join(", ")}`,
  );
} finally {
  if (workRoot) await rm(workRoot, { recursive: true, force: true });
}
