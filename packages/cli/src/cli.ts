#!/usr/bin/env node
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { execa, type ResultPromise } from "execa";
import { getLocale, setLocale, t } from "./i18n/index.js";
import { buildProject, loadProjectConfig, normalizeEnvironment, resolveDevPort } from "./project.js";

const rawArgs = process.argv.slice(2);
const firstArg = rawArgs.shift();
const globalLanguage = firstArg?.startsWith("--lang=")
  ? firstArg.slice("--lang=".length)
  : firstArg?.startsWith("--locale=")
    ? firstArg.slice("--locale=".length)
    : firstArg === "--lang" || firstArg === "--locale"
      ? rawArgs.shift()
      : undefined;
const command = globalLanguage ? (rawArgs.shift() ?? "dev") : (firstArg ?? "dev");
const args = rawArgs;
const projectRoot = process.cwd();

function flagValue(name: string) {
  const index = args.indexOf(name);
  if (index >= 0) {
    const value = args[index + 1];
    return value && !value.startsWith("--") ? value : undefined;
  }
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  return inline?.slice(name.length + 1);
}

function hasFlag(name: string) {
  return args.includes(name) || args.some((arg) => arg.startsWith(`${name}=`));
}

async function startWorkspace() {
  const selector = flagValue("--filter");
  if (!selector) throw new Error(t("请指定门户或子应用，例如：pnpm start --filter main-a"));
  const filterIndex = args.indexOf("--filter");
  const forwarded = args.filter(
    (arg, index) => arg !== "--filter" && arg !== "--" && index !== filterIndex + 1 && !arg.startsWith("--filter="),
  );
  const result = await execa(
    "pnpm",
    ["--filter", selector, "start", ...(forwarded.length ? ["--", ...forwarded] : [])],
    {
      cwd: projectRoot,
      stdio: "inherit",
    },
  );
  if (result.exitCode !== 0) process.exitCode = result.exitCode;
}

function appProjectPaths() {
  return (flagValue("--apps") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => resolve(projectRoot, value));
}

function validateProjectName(name: string) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) throw new Error(t("项目名称只能是单层安全目录名：{name}", { name }));
}

async function startChildApps(paths: string[], all = false, environment = "local") {
  const children: ResultPromise[] = [];
  const reservedPorts = new Set<number>();
  const remoteAppOverrides: Record<string, string> = {};
  for (const path of paths) {
    if (!existsSync(resolve(path, "biu.config.ts"))) throw new Error(t("子应用不是有效的 Biu 项目：{path}", { path }));
    const childConfig = await loadProjectConfig(path, undefined, environment);
    if (childConfig.projectType !== "APP") throw new Error(t("--apps 只能启动 APP 项目：{path}", { path }));
    const port = await resolveDevPort(childConfig, undefined, reservedPorts);
    reservedPorts.add(port);
    const childArgs = ["exec", "biu", "dev"];
    if (all) childArgs.push("--all");
    childArgs.push("--env", environment, "--port", String(port));
    const child = execa("pnpm", childArgs, { cwd: path, stdio: "inherit" });
    children.push(child);
    remoteAppOverrides[childConfig.appId] = `http://localhost:${port}`;
    console.log(`[biu] ${t("已启动子应用：{path}", { path })} (${port})`);
  }
  return { children, remoteAppOverrides };
}

type LayoutPreset = "sidebar" | "topbar" | "blank" | "dashboard" | "mobile" | "custom";

interface CreateProjectOptions {
  authEnabled?: boolean;
  breadcrumb?: boolean;
  menuSource?: "LOCAL" | "REMOTE";
  portalSlots?: boolean;
  tabs?: boolean;
}

async function createProject(
  name: string,
  projectType: "PORTAL" | "APP" = "PORTAL",
  layoutPreset: LayoutPreset = projectType === "PORTAL" ? "sidebar" : "sidebar",
  options: CreateProjectOptions = {},
) {
  validateProjectName(name);
  if (projectType === "PORTAL" && !["sidebar", "topbar"].includes(layoutPreset))
    throw new Error(
      t("Portal 只支持 sidebar 或 topbar 模式：{preset}", {
        preset: layoutPreset,
      }),
    );
  if (projectType === "APP" && !["sidebar", "blank", "dashboard", "mobile", "custom"].includes(layoutPreset))
    throw new Error(t("APP 模式不支持该 preset：{preset}", { preset: layoutPreset }));
  const projectOptions: Required<CreateProjectOptions> = {
    authEnabled: options.authEnabled ?? true,
    breadcrumb: options.breadcrumb ?? layoutPreset !== "custom",
    menuSource: options.menuSource ?? "LOCAL",
    portalSlots: options.portalSlots ?? false,
    tabs: options.tabs ?? false,
  };
  if (projectType !== "PORTAL") projectOptions.menuSource = "LOCAL";
  const target = resolve(projectRoot, name);
  if (existsSync(target)) throw new Error(t("目录已存在：{path}", { path: target }));
  mkdirSync(resolve(target, "src/pages"), { recursive: true });
  mkdirSync(resolve(target, "local-routes"), { recursive: true });
  mkdirSync(resolve(target, "config"), { recursive: true });
  mkdirSync(resolve(target, "public/static"), { recursive: true });
  mkdirSync(resolve(target, ".husky"), { recursive: true });
  mkdirSync(resolve(target, "scripts"), { recursive: true });
  writeFileSync(
    resolve(target, "biu.config.ts"),
    `export default {
  appId: ${JSON.stringify(name)},
  projectType: ${JSON.stringify(projectType)},
  locale: ${JSON.stringify(getLocale())},
  locales: [
    { code: "zh-CN", label: "简体中文" },
    { code: "en-US", label: "English" },
  ],
  environmentConfigDir: "config",
  framework: "react",
${
  projectType === "PORTAL"
    ? `  portal: { code: "portal-main", menuRootCode: "portal-main", permissionPrefix: "portal-main" },\n`
    : ""
}
${projectType === "APP" && layoutPreset === "custom" ? `  customLayout: { source: "./src/custom-layout.tsx" },\n` : ""}
  layout: { preset: ${JSON.stringify(layoutPreset)}, tabs: ${JSON.stringify(
    projectOptions.tabs,
  )}, breadcrumb: ${JSON.stringify(projectOptions.breadcrumb)} },
  auth: { enabled: ${JSON.stringify(projectOptions.authEnabled)} },
  // 未配置 dev.port 时：Portal 从 9001、APP 从 8001 开始自动选择空闲端口。
  menu: { fallback: true },
${
  projectType === "PORTAL" && projectOptions.portalSlots ? `  portalSlots: { source: "./src/portal-slots.tsx" },\n` : ""
}
  routes: { files: ["local-routes/index.ts"] },
};
`,
  );
  const remoteAppsConfig = (url: string) =>
    projectType === "PORTAL"
      ? `  remoteApps: { "child-app": { APP_URL: ${JSON.stringify(url)}, ALLOWED_ORIGINS: [${JSON.stringify(
          new URL(url).origin,
        )}], OVERLAY_MODE: "IFRAME" } },\n`
      : "";
  const environmentMenu = (environment: string) => {
    if (projectType !== "PORTAL" || projectOptions.menuSource === "LOCAL") return "  menu: { fallback: true },\n";
    return environment === "local"
      ? "  menu: { fallback: true },\n"
      : '  menu: { portalTreeUrl: "/api/menu/portal-tree", fallback: false },\n';
  };
  const environmentConfigs: Record<string, string> = {
    local: `import type { BiuEnvironmentConfig } from "@biugle/biu-cli";

export default {
  environment: "local",
${remoteAppsConfig("http://localhost:8001")}${environmentMenu("local")}
} satisfies BiuEnvironmentConfig;
`,
    dev: `import type { BiuEnvironmentConfig } from "@biugle/biu-cli";

export default {
  environment: "dev",
${remoteAppsConfig("https://child-app.dev.example.com")}${environmentMenu("dev")}
} satisfies BiuEnvironmentConfig;
`,
    test: `import type { BiuEnvironmentConfig } from "@biugle/biu-cli";

export default {
  environment: "test",
${remoteAppsConfig("https://child-app.test.example.com")}${environmentMenu("test")}
} satisfies BiuEnvironmentConfig;
`,
    pre: `import type { BiuEnvironmentConfig } from "@biugle/biu-cli";

export default {
  environment: "pre",
${remoteAppsConfig("https://child-app.pre.example.com")}${environmentMenu("pre")}
} satisfies BiuEnvironmentConfig;
`,
    prod: `import type { BiuEnvironmentConfig } from "@biugle/biu-cli";

export default {
  environment: "prod",
${remoteAppsConfig("https://child-app.example.com")}${environmentMenu("prod")}
} satisfies BiuEnvironmentConfig;
`,
  };
  for (const [environment, source] of Object.entries(environmentConfigs)) {
    writeFileSync(resolve(target, "config", `${environment}.ts`), source);
  }
  writeFileSync(
    resolve(target, "local-routes/index.ts"),
    `export { default } from "./pages.ts";
`,
  );
  writeFileSync(
    resolve(target, "local-routes/pages.ts"),
    projectType === "PORTAL"
      ? `export default [
  { code: "Welcome", type: "MENU", target: "APP", source: "APP", titleKey: "示例子应用", appId: "child-app", appPath: "/Welcome" },
];
`
      : `export default [];
`,
  );
  if (projectType === "PORTAL") {
    mkdirSync(resolve(target, "src/pages"), { recursive: true });
    writeFileSync(
      resolve(target, "src/pages/index.tsx"),
      `export default function Home() {
  return <section><h1>Portal Home</h1><p>从这里开始构建门户主应用。</p></section>;
}
`,
    );
    if (projectOptions.portalSlots) {
      writeFileSync(
        resolve(target, "src/portal-slots.tsx"),
        `import type { BiuPortalSlots } from "@biugle/biu-runtime";

// Keep custom workbar and toolbarActions here. toolbarActions are rendered on
// desktop and are also exposed through the compact mobile action menu.
const portalSlots: BiuPortalSlots = {};

export default portalSlots;
`,
      );
    }
  }

  if (projectType === "APP") {
    if (layoutPreset === "custom") {
      writeFileSync(
        resolve(target, "src/custom-layout.tsx"),
        `import type { LayoutContentProps } from "@biugle/biu-runtime";

export default function CustomLayout({ children }: LayoutContentProps) {
  return <div style={{ minHeight: "100vh", padding: 24 }}>{children}</div>;
}
`,
      );
    }
    mkdirSync(resolve(target, "src/pages"), { recursive: true });
    writeFileSync(
      resolve(target, "src/pages/index.tsx"),
      `export default function Welcome() {
  return <section><h1>Welcome</h1><p>这是一个可独立运行的子应用页面。</p></section>;
}
`,
    );
  }
  writeFileSync(
    resolve(target, "public/index.html"),
    `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Biu App</title></head><body><div id="root"></div></body></html>
`,
  );
  writeFileSync(
    resolve(target, "package.json"),
    JSON.stringify(
      {
        name,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: {
          start: "biu dev",
          dev: "biu dev",
          build: "biu build",
          "build:all": "biu build --all",
          typecheck: "tsc -p tsconfig.json --noEmit",
          check: "pnpm typecheck",
          lint: "eslint .",
          "format:check": "prettier --check .",
          prepare: "node scripts/prepare.mjs",
        },
        dependencies: {
          "@biugle/biu-adapter-react": "^0.2.1",
          "@biugle/biu-bridge": "^0.2.1",
          "@biugle/biu-i18n": "^0.2.1",
          "@biugle/biu-preset": "^0.2.1",
          "@biugle/biu-router": "^0.2.1",
          "@biugle/biu-runtime": "^0.2.1",
          "@biugle/biu-store": "^0.2.1",
          "@biugle/biu-ui": "^0.2.1",
          react: "^19.0.0",
          "react-dom": "^19.0.0",
        },
        devDependencies: {
          "@biugle/biu-cli": "^0.2.1",
          "@types/react": "^19.0.0",
          "@types/react-dom": "^19.0.0",
          "@eslint/js": "^9.17.0",
          eslint: "^9.17.0",
          husky: "^9.1.7",
          "lint-staged": "^15.2.11",
          prettier: "^3.4.2",
          "typescript-eslint": "^8.18.0",
          typescript: "^5.7.3",
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(
    resolve(target, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          jsx: "react-jsx",
          module: "ESNext",
          moduleResolution: "Bundler",
          target: "ES2022",
          strict: true,
          skipLibCheck: true,
        },
        include: ["src", "config", "local-routes", "biu.config.ts"],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    resolve(target, ".gitignore"),
    `node_modules/\ndist/\n.biu/\ncoverage/\n.cache/\n.rsbuild-cache/\n.env\n.env.*\n!.env.example\n*.tsbuildinfo\n*.log\n.eslintcache\n.stylelintcache\n.DS_Store\n.husky/_/\n`,
  );
  writeFileSync(
    resolve(target, ".editorconfig"),
    `# http://editorconfig.org\nroot = true\n\n[*]\ncharset = utf-8\nend_of_line = lf\nindent_size = 2\nindent_style = space\ninsert_final_newline = true\nmax_line_length = 120\ntrim_trailing_whitespace = true\n\n[*.md]\nmax_line_length = 120\n`,
  );
  writeFileSync(
    resolve(target, ".prettierrc.json"),
    JSON.stringify({ semi: true, singleQuote: false, trailingComma: "all", printWidth: 120 }, null, 2) + "\n",
  );
  writeFileSync(resolve(target, ".prettierignore"), "node_modules/\ndist/\n.biu/\npnpm-lock.yaml\n");
  writeFileSync(
    resolve(target, "eslint.config.js"),
    `import eslint from "@eslint/js";\nimport tseslint from "typescript-eslint";\n\nexport default tseslint.config(\n  { ignores: ["**/dist/**", "**/.biu/**", "node_modules/**"] },\n  eslint.configs.recommended,\n  ...tseslint.configs.recommended,\n);\n`,
  );
  writeFileSync(
    resolve(target, "lint-staged.config.js"),
    `export default {\n  "**/*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],\n  "**/*.{json,md,css,html}": ["prettier --write"],\n};\n`,
  );
  const hookPath = resolve(target, ".husky/pre-commit");
  writeFileSync(hookPath, "pnpm exec lint-staged\n");
  chmodSync(hookPath, 0o755);
  writeFileSync(
    resolve(target, "scripts/prepare.mjs"),
    `import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

if (existsSync(".git")) execFileSync("husky", [], { stdio: "inherit" });
`,
  );
  writeFileSync(
    resolve(target, "README.md"),
    `# ${name}

${t("这是由 biu create 生成的 Biu 项目。")}

## ${t("开始开发")}

\`\`\`bash
pnpm install
pnpm start
\`\`\`

${
  projectType === "PORTAL"
    ? t(
        "这是独立部署的 Portal。固定根首页位于 src/pages/index.*；门户自有业务页面位于 src/pages/<Code>，独立子应用通过当前环境 config/*.ts 中的 remoteApps.APP_URL 以 iframe 加载，菜单入口位于根目录 local-routes。",
      )
    : t(
        "这是独立部署的 APP。固定根首页位于 src/pages/index.*，业务页面位于 src/pages/<Code>，菜单入口位于根目录 local-routes；src/pages/_* 目录属于内部页面，不会被 CLI 自动解析。",
      )
}

${t(
  "环境配置位于 config/local.ts、config/dev.ts、config/test.ts、config/pre.ts、config/prod.ts，公共配置位于 biu.config.ts。",
)}

${t(
  '多语言由 Biu 基座提供；React 页面使用 useBiuI18n().$t("中文 key")，非 Hook 工具使用 @biugle/biu-runtime 的 i18n.$t()。业务项目只配置 localeUrl 或 locale 资源，不重复创建基座 i18n。',
)}

${t("跨应用共享组件、hooks、工具和类型使用 workspace package；业务页面不得覆盖 .biu-* 基座样式。")}

${t(
  "提交前会由 Husky 调用 lint-staged 执行 ESLint 和 Prettier；CI 或发布前使用 pnpm check、pnpm lint 和 pnpm format:check。",
)}

## ${t("常用命令")}

\`\`\`bash
pnpm build
pnpm build:all
pnpm typecheck
pnpm lint
pnpm format:check
pnpm start
biu dev --env dev
biu build --env prod
\`\`\`

${t("菜单接口接入方式和目录约定见 biu 文档。")}
`,
  );
  console.log(`[biu] ${t("已创建项目：{path}", { path: target })}`);
}

async function initializeWorkspace() {
  if (!input.isTTY || !output.isTTY) throw new Error(t("交互式初始化需要在终端中运行：biu init"));
  const rl = createInterface({ input, output });
  const ask = async (question: string, fallback: string) => {
    const value = (await rl.question(`${question} [${fallback}] `)).trim();
    return value || fallback;
  };
  const count = async (question: string, fallback: number) => {
    const value = Number(await ask(question, String(fallback)));
    return Number.isInteger(value) && value >= 0 && value <= 20 ? value : fallback;
  };
  const choice = async (question: string, fallback: string, allowed: readonly string[]) => {
    const value = await ask(question, fallback);
    return allowed.includes(value) ? value : fallback;
  };
  const yesNo = async (question: string, fallback: boolean) => {
    const value = (await ask(question, fallback ? "y" : "n")).toLowerCase();
    if (["y", "yes"].includes(value)) return true;
    if (["n", "no"].includes(value)) return false;
    return fallback;
  };
  try {
    console.log(t("Biu 一键初始化：先配置门户，再配置独立子应用。"));
    const defaultMode = await choice(
      t("先选择本次默认模式（1=Portal 双栏，2=Portal 顶部导航，3=独立 APP，4=React Custom）："),
      "1",
      ["1", "2", "3", "4"],
    );
    const defaultPortalPreset = defaultMode === "2" ? "topbar" : "sidebar";
    const defaultAppPreset = defaultMode === "4" ? "custom" : "sidebar";
    const portalCount = await count(t("需要创建几个门户？"), 1);
    const appCount = await count(t("需要创建几个子应用？"), 1);
    for (let index = 0; index < portalCount; index += 1) {
      const name = await ask(
        t("第 {index} 个门户名称：", { index: index + 1 }),
        `portal-${String.fromCharCode(97 + index)}`,
      );
      const mode = await choice(
        t("门户布局（1=双栏侧边菜单，2=顶部导航）："),
        defaultPortalPreset === "topbar" ? "2" : "1",
        ["1", "2"],
      );
      const tabs = await yesNo(t("是否启用多标签页？"), true);
      const breadcrumb = await yesNo(t("是否启用面包屑导航？"), true);
      const authEnabled = await yesNo(t("是否启用基座登录/注册认证？"), true);
      const menuSource = await choice(t("菜单来源（1=本地 fallback，2=远程菜单接口）："), "1", ["1", "2"]);
      const portalSlots = await yesNo(t("是否生成 Portal 工具栏/工作栏插槽示例？"), true);
      await createProject(name, "PORTAL", mode === "2" ? "topbar" : "sidebar", {
        authEnabled,
        breadcrumb,
        menuSource: menuSource === "2" ? "REMOTE" : "LOCAL",
        portalSlots,
        tabs,
      });
    }
    for (let index = 0; index < appCount; index += 1) {
      const name = await ask(
        t("第 {index} 个子应用名称：", { index: index + 1 }),
        `child-app-${String.fromCharCode(97 + index)}`,
      );
      const mode = await choice(
        t("子应用模式（1=侧栏，2=空白，3=仪表盘，4=移动，5=Custom React）："),
        defaultAppPreset === "custom" ? "5" : "1",
        ["1", "2", "3", "4", "5"],
      );
      const appPresets: LayoutPreset[] = ["sidebar", "blank", "dashboard", "mobile", "custom"];
      const preset = appPresets[Number(mode) - 1] ?? "sidebar";
      const authEnabled = await yesNo(t("是否启用基座登录/注册认证？"), true);
      const tabs = preset === "custom" ? false : await yesNo(t("是否启用多标签页？"), false);
      const breadcrumb = preset === "custom" ? false : await yesNo(t("是否启用面包屑导航？"), true);
      await createProject(name, "APP", preset, {
        authEnabled,
        breadcrumb,
        tabs,
      });
    }
    console.log(t("初始化完成，请分别进入生成的项目执行 pnpm install 和 pnpm start。"));
  } finally {
    rl.close();
  }
}

async function main() {
  const language = globalLanguage ?? flagValue("--lang") ?? flagValue("--locale");
  setLocale(language);
  if (command === "--help" || command === "-h" || hasFlag("--help")) {
    console.log(
      t(
        "biu\n\n用法：\n  biu init\n  biu start --filter <project> [-- --apps DIR,...]\n  biu create <name> [--type PORTAL|APP] [--preset sidebar|topbar|blank|dashboard|mobile|custom]\n  biu dev [--portal CODE] [--apps DIR,...] [--all] [--port PORT] [--env ENV]\n  biu build [--portal CODE] [--all] [--env ENV] [--lang zh-CN|en-US]\n",
      ),
    );
    return;
  }
  if (command === "--version" || command === "-v") {
    console.log("0.1.0");
    return;
  }
  if (command === "start") {
    await startWorkspace();
    return;
  }
  if (command === "init") {
    await initializeWorkspace();
    return;
  }
  if (command === "build" || command === "dev") {
    const all = hasFlag("--all");
    const portal = flagValue("--portal");
    const environment = normalizeEnvironment(
      flagValue("--env") ?? process.env.BIU_ENV,
      command === "build" ? "prod" : "local",
    );
    const portValue = flagValue("--port");
    if (hasFlag("--port") && !portValue) throw new Error(t("--port 必须提供端口值"));
    const port = portValue ? Number(portValue) : undefined;
    if (portValue && (!Number.isInteger(port) || port! < 1 || port! > 65535))
      throw new Error(t("--port 必须是 1 到 65535 的整数"));
    const childResult =
      command === "dev"
        ? await startChildApps(appProjectPaths(), all, environment)
        : { children: [], remoteAppOverrides: {} };
    const children = childResult.children;
    const stopChildren = () => children.forEach((child) => child.kill("SIGTERM"));
    if (children.length) {
      process.once("SIGINT", stopChildren);
      process.once("SIGTERM", stopChildren);
    }
    const result = await buildProject(projectRoot, {
      all,
      portal,
      port,
      environment,
      watch: command === "dev",
      remoteAppOverrides: childResult.remoteAppOverrides,
    });
    console.log(
      `[biu] ${t("{command} 完成：{codes}", {
        command,
        codes: result.discovery.selectedCodes.join(", ") || t("无页面"),
      })}`,
    );
    return;
  }
  if (command === "create") {
    const name = args[0];
    if (!name) {
      await initializeWorkspace();
      return;
    }
    const projectType = (flagValue("--type") ?? "PORTAL").toUpperCase();
    if (projectType !== "PORTAL" && projectType !== "APP")
      throw new Error(t("项目类型只能是 PORTAL 或 APP：{projectType}", { projectType }));
    const preset = (flagValue("--preset") ?? (projectType === "PORTAL" ? "sidebar" : "sidebar")) as LayoutPreset;
    await createProject(name, projectType, preset);
    return;
  }
  throw new Error(t("未知命令：{command}", { command }));
}

main().catch((error) => {
  console.error(`[biu] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
