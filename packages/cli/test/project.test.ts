import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { discoverProject, getDevPortRange, resolveDevPort } from "../src/project.js";

test("Portal 和 APP 使用不同的默认端口范围并支持自定义端口", async () => {
  assert.deepEqual(getDevPortRange({ projectType: "PORTAL" }), { start: 9001, end: 9999 });
  assert.deepEqual(getDevPortRange({ projectType: "APP" }), { start: 8001, end: 8888 });
  const portalPort = await resolveDevPort({ appId: "portal", projectType: "PORTAL" });
  assert.ok(portalPort >= 9001 && portalPort <= 9999);
  assert.equal(await resolveDevPort({ appId: "app", projectType: "APP", dev: { port: 8765 } }), 8765);
  const appPort = await resolveDevPort({ appId: "app", projectType: "APP" }, undefined, new Set([8001]));
  assert.ok(appPort >= 8002 && appPort <= 8888);
});

test("端口被占用时不会误判并继续使用旧服务地址", async () => {
  const server = createNetServer();
  server.listen(0);
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    const next = await resolveDevPort({
      appId: "occupied-port-app",
      projectType: "APP",
      dev: { port: address.port, portRange: { start: address.port, end: address.port + 1 } },
    });
    assert.equal(next, address.port + 1);
  } finally {
    server.close();
  }
});

async function createFixture(config: string) {
  const root = await mkdtemp(join(tmpdir(), "biu-cli-test-"));
  await writeFile(
    join(root, "biu.config.ts"),
    config.replace("export default {", 'export default {\n    projectType: "PORTAL",'),
  );
  await writeFile(
    join(root, "src-routes.ts"),
    `export default [
    { code: "PageA", type: "MENU", target: "APP", source: "APP" },
    { code: "PageB", type: "MENU", target: "APP", source: "APP" },
  ];`,
  );
  return root;
}

test("根首页读取 src/pages/index.*，并排除 index、path=/ 与 _ 前缀内部路由", async () => {
  const root = await mkdtemp(join(tmpdir(), "biu-cli-home-route-"));
  await mkdir(join(root, "local-routes"), { recursive: true });
  await mkdir(join(root, "src/pages/_internal"), { recursive: true });
  await writeFile(join(root, "biu.config.ts"), `export default { appId: "home-route-test", projectType: "APP" };`);
  await writeFile(join(root, "package.json"), JSON.stringify({ name: "home-route-test", version: "3.4.5" }));
  await writeFile(
    join(root, "local-routes/index.ts"),
    `export default [
  { code: "Home", type: "MENU", target: "APP", source: "APP", path: "/" },
  { code: "index", type: "MENU", target: "APP", source: "APP" },
  { code: "_Login", type: "MENU", target: "APP", source: "APP" },
  { code: "Dashboard", type: "MENU", target: "APP", source: "APP" },
];`,
  );
  await writeFile(join(root, "src/pages/index.tsx"), "export default function Home() { return null; }\n");
  try {
    const result = await discoverProject(root);
    assert.deepEqual(
      result.routes.map((route) => route.code),
      ["Dashboard"],
    );
    assert.deepEqual(result.selectedCodes, ["Dashboard"]);
    assert.equal(result.packageVersion, "3.4.5");
    assert.equal(result.homePage, join(root, "src/pages/index.tsx"));
    assert.deepEqual(
      result.fallbackMenus[0]?.children?.map((item) => item.code),
      ["Dashboard"],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("按门户菜单接口返回的 Code 编译页面", async () => {
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ code: 0, data: [{ code: "PageA", type: "MENU" }] }));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const root = await createFixture(`export default {
    appId: "test",
    portal: { code: "portal-a" },
    menu: { portalTreeUrl: "http://127.0.0.1:${address.port}" },
    routes: { files: ["src-routes.ts"] },
  };`);
  try {
    const result = await discoverProject(root);
    assert.deepEqual(result.selectedCodes, ["PageA"]);
    assert.equal(result.menus[0]?.code, "PageA");
  } finally {
    server.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("没有菜单接口时使用本地路由，--all 保留全部页面", async () => {
  const root = await createFixture(`export default {
    appId: "test",
    portal: { code: "portal-a" },
    routes: { files: ["src-routes.ts"] },
  };`);
  try {
    const result = await discoverProject(root);
    assert.deepEqual(result.selectedCodes, ["PageA", "PageB"]);
    assert.deepEqual((await discoverProject(root, true)).selectedCodes, ["PageA", "PageB"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("菜单接口成功返回空树时不编译本地页面", async () => {
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ code: 0, data: [] }));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const root = await createFixture(`export default {
    appId: "test",
    portal: { code: "portal-a" },
    menu: { portalTreeUrl: "http://127.0.0.1:${address.port}" },
    routes: { files: ["src-routes.ts"] },
  };`);
  try {
    assert.deepEqual((await discoverProject(root)).selectedCodes, []);
  } finally {
    server.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("菜单接口失败且 fallback=false 时构建发现失败", async () => {
  const server = createServer((_request, response) => {
    response.statusCode = 503;
    response.end("down");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const root = await createFixture(`export default {
    appId: "test",
    portal: { code: "portal-a" },
    menu: { portalTreeUrl: "http://127.0.0.1:${address.port}", fallback: false },
    routes: { files: ["src-routes.ts"] },
  };`);
  try {
    await assert.rejects(() => discoverProject(root), /Request failed|请求失败/);
  } finally {
    server.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("重复路由 Code 会在发现阶段失败", async () => {
  const root = await mkdtemp(join(tmpdir(), "biu-cli-duplicate-route-"));
  await writeFile(
    join(root, "biu.config.ts"),
    `export default {
    appId: "test",
    projectType: "APP",
    routes: { files: ["routes-a.ts", "routes-b.ts"] },
  };`,
  );
  await writeFile(
    join(root, "routes-a.ts"),
    `export default [{ code: "PageA", type: "MENU", target: "APP", source: "APP" }];`,
  );
  await writeFile(
    join(root, "routes-b.ts"),
    `export default [{ code: "PageA", type: "MENU", target: "APP", source: "APP" }];`,
  );
  try {
    await assert.rejects(() => discoverProject(root), /Duplicate route Code|路由 Code 重复/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("门户配置控制门户路由入口和权限前缀", async () => {
  const root = await createFixture(`export default {
    appId: "test",
    portal: { code: "portal-a", permissionPrefix: "CUSTOM_PORTAL_A" },
    routes: { files: ["src-routes.ts"] },
  };`);
  try {
    const result = await discoverProject(root);
    assert.equal(result.fallbackMenus[0]?.children?.find((item) => item.code === "PageA")?.permissionCode, "PageA");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("按 --env 加载环境配置并递归覆盖公共配置", async () => {
  const root = await createFixture(`export default {
    appId: "test",
    portal: { code: "portal-a" },
    menu: { fallback: false, headers: { common: "base" } },
    routes: { files: ["src-routes.ts"] },
  };`);
  await mkdir(join(root, "config"), { recursive: true });
  await writeFile(
    join(root, "config/dev.ts"),
    `export default {
    environment: "dev",
    menu: { fallback: true, headers: { env: "dev" } },
  };`,
  );
  try {
    const result = await discoverProject(root, false, undefined, "dev");
    assert.equal(result.config.environment, "dev");
    assert.equal(result.config.menu?.fallback, true);
    assert.deepEqual(result.config.menu?.headers, { common: "base", env: "dev" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("目录树递归展开并使用权限 Code 过滤编译白名单", async () => {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    response.setHeader("content-type", "application/json");
    if (url.pathname.endsWith("/portal")) {
      response.end(JSON.stringify({ code: 0, data: [{ code: "Operation", type: "DIRECTORY", titleKey: "操作" }] }));
      return;
    }
    if (url.pathname.endsWith("/directory")) {
      response.end(
        JSON.stringify({ code: 0, data: [{ code: "PageA", type: "MENU", target: "APP", permissionCode: "PageA" }] }),
      );
      return;
    }
    response.end(JSON.stringify({ code: 0, data: ["Operation", "PageA"] }));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const root = await mkdtemp(join(tmpdir(), "biu-cli-directory-tree-"));
  await writeFile(
    join(root, "biu.config.ts"),
    `export default {
    appId: "test-app",
    projectType: "APP",
    menu: {
      portalTreeUrl: "http://127.0.0.1:${address.port}/portal",
      directoryTreeUrl: "http://127.0.0.1:${address.port}/directory",
      permissionCodesUrl: "http://127.0.0.1:${address.port}/permissions",
    },
    routes: { files: ["src-routes.ts"] },
  };`,
  );
  await writeFile(
    join(root, "src-routes.ts"),
    `export default [
    { code: "PageA", type: "MENU", target: "APP", source: "APP", permissionCode: "PageA" },
    { code: "PageB", type: "MENU", target: "APP", source: "APP", permissionCode: "PageB" },
  ];`,
  );
  try {
    const result = await discoverProject(root);
    assert.deepEqual(
      result.menus[0]?.children?.map((item) => item.code),
      ["PageA"],
    );
    assert.deepEqual(result.selectedCodes, ["PageA"]);
  } finally {
    server.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("菜单接口 Schema 非法时 fallback=false 阻断发现", async () => {
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ code: 0, data: [{ code: "Bad", type: "INVALID" }] }));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const root = await createFixture(`export default {
    appId: "test",
    portal: { code: "portal-a" },
    menu: { portalTreeUrl: "http://127.0.0.1:${address.port}", fallback: false },
    routes: { files: ["src-routes.ts"] },
  };`);
  try {
    await assert.rejects(() => discoverProject(root), /Invalid menu node type|菜单节点类型错误/);
  } finally {
    server.close();
    await rm(root, { recursive: true, force: true });
  }
});
