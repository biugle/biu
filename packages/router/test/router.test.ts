import assert from "node:assert/strict";
import { test } from "node:test";
import {
  annotateMenuKeys,
  filterMenus,
  fetchPortalMenuTree,
  findMenuByPath,
  menuPath,
  mergeMenuMetadata,
  replaceDirectoryChildren,
} from "../src/index.js";

test("menu request timeout covers response body consumption", async (context) => {
  const previousFetch = globalThis.fetch;
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let bodyStarted = false;
  let requestSignal: AbortSignal | undefined;
  globalThis.fetch = async (_input, init) => {
    requestSignal = init?.signal as AbortSignal;
    return {
      ok: true,
      json: () => {
        bodyStarted = true;
        return new Promise((_resolve, reject) => {
          requestSignal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), {
            once: true,
          });
        });
      },
    } as Response;
  };
  try {
    const result = fetchPortalMenuTree({ menu: { portalTreeUrl: "/menu", requestTimeoutMs: 1000 } });
    const rejection = assert.rejects(result, /请求超时/);
    await Promise.resolve();
    assert.equal(bodyStarted, true);
    context.mock.timers.tick(1000);
    // On failure, release the pending body so the test cannot hang.
    if (!requestSignal?.aborted) requestSignal?.dispatchEvent(new Event("abort"));
    await rejection;
    assert.equal(requestSignal?.aborted, true);
  } finally {
    globalThis.fetch = previousFetch;
    context.mock.timers.reset();
  }
});

test("router keeps duplicate page codes distinct by complete menu path", () => {
  const menus = annotateMenuKeys([
    { code: "system", type: "DIRECTORY", children: [{ code: "settings", type: "MENU" }] },
    { code: "operations", type: "DIRECTORY", children: [{ code: "settings", type: "MENU" }] },
  ]);

  const systemPage = findMenuByPath(menus, "/system/settings");
  const operationsPage = findMenuByPath(menus, "/operations/settings");
  assert.equal(systemPage?.meta?.__BIU_MENU_KEY, "system/settings");
  assert.equal(operationsPage?.meta?.__BIU_MENU_KEY, "operations/settings");
  assert.equal(menuPath(systemPage!), "/system/settings");
  assert.equal(findMenuByPath(menus, "/settings"), undefined);
});

test("router applies permission filtering without orphan directories", () => {
  const menus = annotateMenuKeys([
    {
      code: "admin",
      type: "DIRECTORY",
      children: [{ code: "users", type: "MENU", permissionCode: "users:read" }],
    },
  ]);

  assert.deepEqual(filterMenus(menus, new Set(["other:read"])), []);
  assert.deepEqual(
    filterMenus(menus, new Set(["users:read"])).map((item) => item.code),
    ["admin"],
  );
});

test("router merges duplicate codes by complete hierarchy and replaces one directory only", () => {
  const fallback = [
    {
      code: "system",
      type: "DIRECTORY" as const,
      meta: { local: "system" },
      children: [{ code: "settings", type: "MENU" as const, titleKey: "系统设置" }],
    },
    {
      code: "operations",
      type: "DIRECTORY" as const,
      meta: { local: "operations" },
      children: [{ code: "settings", type: "MENU" as const, titleKey: "运营设置" }],
    },
  ];
  const remote = fallback.map(({ children, ...node }) => ({
    ...node,
    children: children?.map(({ titleKey: _titleKey, ...item }) => {
      void _titleKey;
      return item;
    }),
  }));
  const merged = annotateMenuKeys(mergeMenuMetadata(remote, fallback));
  assert.equal(merged[0]?.children?.[0]?.titleKey, "系统设置");
  assert.equal(merged[1]?.children?.[0]?.titleKey, "运营设置");
  const replaced = replaceDirectoryChildren(merged, "operations", [{ code: "new", type: "MENU" }]);
  assert.equal(replaced[0]?.children?.[0]?.code, "settings");
  assert.equal(replaced[1]?.children?.[0]?.code, "new");
});
