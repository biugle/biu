import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createBiuEventBus,
  createI18n,
  fetchPortalMenuTree,
  filterMenus,
  htmlAdapter,
  normalizeBiuLocale,
  resolveDocumentTitle,
  useBiuMenuStore,
  type BiuRuntimeConfig,
} from "../src/index.js";
import { isAppEventPayload, isSafeRemoteUrl, normalizeOrigin, publicAuthContext } from "@biugle/biu-bridge";
import { annotateMenuKeys, findMenuByPath, findMenuTrailByKey, menuRoutePath } from "@biugle/biu-router";
import { createBiuUpdateChecker } from "../src/update-check.js";

test("权限 Code 过滤菜单和目录", () => {
  const result = filterMenus(
    [
      {
        code: "Operation",
        type: "DIRECTORY",
        children: [
          { code: "PageA", type: "MENU", permissionCode: "PageA" },
          { code: "PageB", type: "MENU", permissionCode: "PageB" },
        ],
      },
    ],
    new Set(["PageA"]),
  );
  assert.deepEqual(
    result.map((item) => item.code),
    ["Operation"],
  );
  assert.deepEqual(
    result[0]?.children?.map((item) => item.code),
    ["PageA"],
  );

  const keyed = annotateMenuKeys([
    {
      code: "A",
      type: "DIRECTORY" as const,
      children: [{ code: "Page", type: "MENU" as const, permissionCode: "backend-permission" }],
    },
    {
      code: "B",
      type: "DIRECTORY" as const,
      children: [{ code: "Page", type: "MENU" as const, permissionCode: "backend-permission" }],
    },
  ]);
  assert.deepEqual(
    filterMenus(keyed, new Set(["A/Page"])).map((item) => item.code),
    ["A"],
  );
});

test("按完整菜单层级生成稳定 URL，并仅兼容明确的业务 Path", () => {
  const menus = annotateMenuKeys([
    {
      code: "portal-a",
      type: "DIRECTORY" as const,
      children: [
        { code: "Operation", type: "DIRECTORY" as const, children: [{ code: "PageA", type: "MENU" as const }] },
      ],
    },
  ]);
  const page = findMenuByPath(menus, "/portal-a/Operation/PageA");
  assert.equal(page?.code, "PageA");
  assert.equal(menuRoutePath(page!), "/portal-a/Operation/PageA");
  assert.equal(findMenuByPath(menus, "/PageA"), undefined);

  const fixed = annotateMenuKeys([{ code: "Login", type: "MENU" as const, path: "/Login" }]);
  assert.equal(findMenuByPath(fixed, "/Login")?.code, "Login");

  const rawMenus = [
    { code: "raw-root", type: "DIRECTORY" as const, children: [{ code: "RawPage", type: "MENU" as const }] },
  ];
  assert.equal(findMenuByPath(rawMenus, "/raw-root/RawPage")?.code, "RawPage");

  const backendPathMenus = annotateMenuKeys([
    {
      code: "ignored-root",
      type: "DIRECTORY" as const,
      children: [{ code: "PageA", type: "MENU" as const, path: "/backend/settings/PageA" }],
    },
  ]);
  assert.equal(menuRoutePath(findMenuByPath(backendPathMenus, "/backend/settings/PageA")!), "/backend/settings/PageA");
});

test("同一页面 Code 在不同目录下必须按完整层级区分", () => {
  const menus = annotateMenuKeys([
    { code: "A", type: "DIRECTORY" as const, children: [{ code: "Page", type: "MENU" as const }] },
    { code: "B", type: "DIRECTORY" as const, children: [{ code: "Page", type: "MENU" as const }] },
  ]);
  assert.equal(findMenuByPath(menus, "/A/Page")?.meta?.__BIU_MENU_KEY, "A/Page");
  assert.equal(findMenuByPath(menus, "/B/Page")?.meta?.__BIU_MENU_KEY, "B/Page");
  assert.equal(findMenuByPath(menus, "/Page"), undefined);
  assert.deepEqual(
    findMenuTrailByKey(menus, "B/Page").map((item) => item.code),
    ["B", "Page"],
  );
});

test("独立 APP 的合成根不进入分享 URL 和面包屑", () => {
  const menus = annotateMenuKeys([
    {
      code: "child-app",
      type: "DIRECTORY" as const,
      meta: { __BIU_SYNTHETIC_ROOT: true },
      children: [{ code: "PageA", type: "MENU" as const }],
    },
  ]);
  const page = findMenuByPath(menus, "/PageA");
  assert.equal(page?.code, "PageA");
  assert.equal(menuRoutePath(page!), "/PageA");
  assert.deepEqual(
    findMenuTrailByKey(menus, "PageA").map((item) => item.code),
    ["PageA"],
  );
});

test("重复的显式旧 Path 不会静默选择错误菜单", () => {
  const menus = annotateMenuKeys([
    { code: "A", type: "DIRECTORY" as const, children: [{ code: "One", type: "MENU" as const, path: "/Dashboard" }] },
    { code: "B", type: "DIRECTORY" as const, children: [{ code: "Two", type: "MENU" as const, path: "/Dashboard" }] },
  ]);
  assert.equal(findMenuByPath(menus, "/Dashboard"), undefined);
});

test("内置 HTML Adapter 挂载和卸载 HTML 字符串", () => {
  const container = documentLike();
  htmlAdapter.renderPage(container, "<p>hello</p>", { appId: "test", code: "PageA" });
  assert.equal(container.innerHTML, "<p>hello</p>");
  htmlAdapter.unmountPage?.(container, { appId: "test", code: "PageA" });
  assert.equal(container.innerHTML, "");
  assert.throws(
    () => htmlAdapter.renderPage(container, {}, { appId: "test", code: "PageA", locale: "en-US" }),
    /An HTML page module must export a string/,
  );
});

test("远程 APP 默认拒绝未授权跨域地址，并规范化 Origin", () => {
  const previousWindow = (globalThis as { window?: unknown }).window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { origin: "https://portal.example.com" } },
  });
  try {
    assert.equal(normalizeOrigin("https://child.example.com/"), "https://child.example.com");
    assert.equal(isSafeRemoteUrl("https://child.example.com"), false);
    assert.equal(isSafeRemoteUrl("https://child.example.com", ["https://child.example.com/"]), true);
    assert.equal(isSafeRemoteUrl("javascript:alert(1)", ["https://child.example.com"]), false);
    assert.equal(isSafeRemoteUrl("/same-origin"), true);
  } finally {
    if (previousWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
  }
});

test("Bridge 只暴露非敏感身份，不传递 session id", () => {
  const privateAuth = {
    mode: "SSO" as const,
    authenticated: true,
    sessionId: "private-session",
    user: { id: "u1", name: "用户" },
  } as unknown as Parameters<typeof publicAuthContext>[0];
  assert.deepEqual(publicAuthContext(privateAuth), {
    mode: "SSO",
    authenticated: true,
    user: { id: "u1", name: "用户" },
  });
  assert.equal(publicAuthContext(), undefined);
});

test("类型化事件总线支持发布、订阅和取消订阅", () => {
  const bus = createBiuEventBus();
  const received: string[] = [];
  const unsubscribe = bus.subscribe<{ code: string }>("demo:event", (event) =>
    received.push(`${event.payload.code}:${event.source}`),
  );
  bus.publish("demo:event", { code: "A" }, "portal-a");
  unsubscribe();
  bus.publish("demo:event", { code: "B" }, "portal-a");
  assert.deepEqual(received, ["A:portal-a"]);
  assert.equal(isAppEventPayload({ name: "demo:event", payload: {} }), true);
  assert.equal(isAppEventPayload({ name: "" }), false);
});

test("自建 i18n 支持资源、插值、语言列表和回退", () => {
  const messages = createI18n("en-US", {
    resources: {
      "zh-CN": { key: "zh-CN", desc: "简体中文", translation: { 问候: "你好，{name}", 仅中文: "仅中文" } },
      "en-US": { key: "en-US", desc: "English", translation: { 问候: "Hello, {name}" } },
    },
  });
  assert.equal(messages.$t("问候", { name: "Biu" }), "Hello, Biu");
  assert.deepEqual(
    messages.getLocaleList().map((item) => item.code),
    ["zh-CN", "en-US"],
  );
  messages.setLocale("zh-CN");
  assert.equal(messages.$t("问候", { name: "Biu" }), "你好，Biu");
  assert.equal(messages.$t("不存在"), "不存在");
  messages.setLocale("en-US");
  assert.equal(messages.$t("仅中文"), "仅中文");
});

test("默认基座资源覆盖页面和菜单弹窗使用的中英文 key", () => {
  const messages = createI18n("en-US");
  const requiredKeys = [
    "请通过统一身份认证完成访问",
    "配置区",
    "菜单",
    "收起所有目录",
    "自定义 body 内容",
    "打开自定义 body 内容",
    "这个内容由 fire.render 独立挂载，不依赖基座布局。",
    "切换语言、主题、时区和方向后，可回到这里确认上下文同步。",
  ];
  for (const key of requiredKeys) assert.notEqual(messages.$t(key), key);
});

test("语言值为空或非法时回退到合法中文，并支持配置语言别名", () => {
  assert.equal(normalizeBiuLocale(""), "zh-CN");
  assert.equal(normalizeBiuLocale("not-a-locale"), "zh-CN");
  assert.equal(normalizeBiuLocale("EN-us"), "en-US");
  assert.equal(normalizeBiuLocale("fr", ["zh-CN", "fr-FR"]), "fr-FR");
  assert.equal(
    resolveDocumentTitle({ systemTitle: "Portal A", menuTitle: "基本信息", menuCode: "PageA" }),
    "Portal A - 基本信息",
  );
  assert.equal(resolveDocumentTitle({ appId: "child-app", menuTitle: "", menuCode: "PageA" }), "child-app - PageA");
});

test("菜单接口请求携带当前 locale，支持切换后重新读取业务菜单", async () => {
  const previousFetch = globalThis.fetch;
  const previousWindow = (globalThis as { window?: unknown }).window;
  let requested = "";
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { origin: "https://portal.example.com" }, setTimeout, clearTimeout },
  });
  globalThis.fetch = async (input) => {
    requested = String(input);
    return new Response(JSON.stringify({ code: 0, data: [{ code: "PageA", type: "MENU", titleKey: "基本信息" }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const config = { appId: "portal", menu: { portalTreeUrl: "/api/menu" } } as BiuRuntimeConfig;
    await fetchPortalMenuTree(config, "en-US");
    assert.equal(new URL(requested).searchParams.get("locale"), "en-US");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
  }
});

test("更新检查优先比较 buildId，并在首次请求失败后恢复基线", async () => {
  const previousFetch = globalThis.fetch;
  const previousWindow = (globalThis as { window?: unknown }).window;
  let manifest: string | undefined;
  let updates = 0;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { origin: "https://portal.example.com" } },
  });
  globalThis.fetch = async () => {
    if (manifest === undefined) return new Response("", { status: 503 });
    return new Response(manifest, { status: 200 });
  };
  try {
    const checker = createBiuUpdateChecker("/manifest/routes.json", () => {
      updates += 1;
    });
    await checker.initialize();
    manifest = JSON.stringify({ buildId: "build-a", selectedCodes: ["A"] });
    assert.equal(await checker.check(), false);
    manifest = JSON.stringify({ buildId: "build-a", selectedCodes: ["B"] });
    assert.equal(await checker.check(), false);
    manifest = JSON.stringify({ buildId: "build-b", selectedCodes: ["B"] });
    assert.equal(await checker.check(), true);
    assert.equal(updates, 1);
    assert.equal(await checker.check(), false);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
  }
});

test("菜单 store 只操作当前右侧目录作用域，并支持同级手风琴展开", () => {
  const store = useBiuMenuStore.getState();
  const menus = [
    {
      code: "group/a",
      type: "DIRECTORY" as const,
      meta: { __BIU_MENU_KEY: "group/a" },
      children: [{ code: "group/a/page", type: "MENU" as const }],
    },
    {
      code: "group/b",
      type: "DIRECTORY" as const,
      meta: { __BIU_MENU_KEY: "group/b" },
      children: [{ code: "group/b/page", type: "MENU" as const }],
    },
  ];
  store.setDirectoryScope(menus);
  store.setAllCollapsed();
  assert.equal(useBiuMenuStore.getState().isExpanded("group/a"), false);
  assert.equal(useBiuMenuStore.getState().isExpanded("group/b"), false);
  store.setDirectoryScope([menus[0]!]);
  store.setAllExpanded();
  assert.equal(useBiuMenuStore.getState().isExpanded("group/a"), true);
  assert.equal(useBiuMenuStore.getState().isExpanded("group/b"), false);
  store.setDirectoryScope(menus);
  store.setAllExpanded();
  store.setAccordion(true);
  assert.equal(useBiuMenuStore.getState().isExpanded("group/a"), true);
  assert.equal(useBiuMenuStore.getState().isExpanded("group/b"), false);
  useBiuMenuStore.getState().toggleDirectory("group/b");
  assert.equal(useBiuMenuStore.getState().isExpanded("group/a"), false);
  assert.equal(useBiuMenuStore.getState().isExpanded("group/b"), true);
  store.setTree([]);
});

test("菜单 store 按门户隔离收藏和最近使用并限制数量", () => {
  const store = useBiuMenuStore.getState();
  store.setStorageScope("test-portal-menu-state");
  for (let index = 0; index < 101; index += 1) {
    store.toggleFavorite({
      key: `favorite-${index}`,
      code: `Favorite${index}`,
      title: `收藏 ${index}`,
      path: `/Favorite${index}`,
      target: "PORTAL",
    });
  }
  assert.equal(useBiuMenuStore.getState().favorites.length, 100);
  for (let index = 0; index < 11; index += 1) {
    store.addRecent({
      key: `recent-${index}`,
      code: `Recent${index}`,
      title: `最近 ${index}`,
      path: `/Recent${index}`,
      target: "PORTAL",
    });
  }
  assert.equal(useBiuMenuStore.getState().recent.length, 10);
  store.setStorageScope("another-portal-menu-state");
  assert.equal(useBiuMenuStore.getState().favorites.length, 0);
  assert.equal(useBiuMenuStore.getState().recent.length, 0);
  store.setStorageScope("default");
});

function documentLike() {
  let value = "";
  return {
    get innerHTML() {
      return value;
    },
    set innerHTML(next: string) {
      value = next;
    },
    replaceChildren() {
      value = "";
    },
  } as unknown as Element;
}
