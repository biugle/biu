import assert from "node:assert/strict";
import { test } from "node:test";
import { readBiuTabSession, useBiuMenuStore, useBiuPreferenceStore, writeBiuTabSession } from "../src/index.js";

test("missing stored preferences preserve configured values and persistence excludes auth", () => {
  const previousWindow = (globalThis as { window?: unknown }).window;
  const previousState = useBiuPreferenceStore.getState();
  const session = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    sessionStorage: {
      getItem: (key: string) => session.get(key) ?? null,
      setItem: (key: string, value: string) => session.set(key, value),
    },
  };
  try {
    useBiuPreferenceStore.getState().initialize(
      {
        locale: "en-US",
        theme: "dark",
        direction: "rtl",
        timezone: "UTC",
        auth: { mode: "SSO", authenticated: true },
      },
      "configured-preferences",
    );
    const state = useBiuPreferenceStore.getState();
    assert.equal(state.locale, "en-US");
    assert.equal(state.theme, "dark");
    assert.equal(state.direction, "rtl");
    assert.equal(state.timezone, "UTC");
    state.setLocale("zh-CN");
    assert.deepEqual(JSON.parse(session.get("BIU_PREFERENCES_SESSION:configured-preferences")!), {
      locale: "zh-CN",
      theme: "dark",
      direction: "rtl",
      timezone: "UTC",
    });
    session.set("BIU_PREFERENCES_SESSION:partial-preferences", JSON.stringify({ locale: "zh-CN" }));
    state.initialize({ theme: "system", direction: "rtl", timezone: "UTC" }, "partial-preferences");
    assert.equal(useBiuPreferenceStore.getState().theme, "system");
    assert.equal(useBiuPreferenceStore.getState().direction, "rtl");
    assert.equal(useBiuPreferenceStore.getState().timezone, "UTC");
  } finally {
    useBiuPreferenceStore.setState(previousState, true);
    if (previousWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else (globalThis as { window?: unknown }).window = previousWindow;
  }
});

test("store keeps directory actions scoped to the current tree", () => {
  const store = useBiuMenuStore;
  store.setState({
    directoryCodes: [],
    directoryParents: {},
    collapsedCodes: [],
    accordion: false,
    showMenuTitle: true,
    menuMode: "STANDARD",
    showTopSearch: false,
    selectedGroupCode: undefined,
    storageScope: "test-store",
    favorites: [],
    recent: [],
  });

  store.getState().setTree([
    {
      code: "system",
      type: "DIRECTORY",
      children: [
        { code: "basic", type: "DIRECTORY" },
        { code: "users", type: "MENU" },
      ],
    },
  ]);
  store.getState().setAllCollapsed();
  assert.equal(store.getState().isExpanded("system"), false);
  assert.equal(store.getState().isExpanded("system/basic"), false);

  store
    .getState()
    .setDirectoryScope([{ code: "system", type: "DIRECTORY", children: [{ code: "basic", type: "DIRECTORY" }] }]);
  store.getState().setAllExpanded();
  assert.equal(store.getState().isExpanded("system/basic"), true);
});

test("store does not notify subscribers for equivalent menu scopes", () => {
  const store = useBiuMenuStore;
  store.setState({ directoryCodes: [], directoryParents: {}, collapsedCodes: [] });
  const tree = [
    {
      code: "platform",
      type: "DIRECTORY" as const,
      children: [{ code: "overview", type: "MENU" as const }],
    },
  ];
  store.getState().setTree(tree);
  let notifications = 0;
  const unsubscribe = store.subscribe(() => {
    notifications += 1;
  });
  try {
    store.getState().setTree(tree.map((node) => ({ ...node, children: [...(node.children ?? [])] })));
    store.getState().setDirectoryScope(tree);
    assert.equal(notifications, 0);
  } finally {
    unsubscribe();
  }
});

test("store ignores malformed persisted menu records and unknown directory actions", () => {
  const previousWindow = (globalThis as { window?: unknown }).window;
  const local = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (key: string) => local.get(key) ?? null,
      setItem: (key: string, value: string) => local.set(key, value),
    },
  };
  try {
    local.set(
      "BIU_MENU_STATE:unsafe-scope",
      JSON.stringify({ favorites: [null, { key: "ok" }], recent: [{ key: "ok" }], collapsedCodes: ["a"] }),
    );
    useBiuMenuStore.getState().setStorageScope("unsafe-scope");
    assert.deepEqual(useBiuMenuStore.getState().favorites, []);
    assert.deepEqual(useBiuMenuStore.getState().recent, []);
    useBiuMenuStore.getState().setTree([{ code: "known", type: "DIRECTORY" }]);
    useBiuMenuStore.getState().toggleDirectory("unknown");
    assert.equal(useBiuMenuStore.getState().isExpanded("known"), true);
  } finally {
    if (previousWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else (globalThis as { window?: unknown }).window = previousWindow;
  }
});

test("tab session persistence keeps only valid selected keys", () => {
  const previousWindow = (globalThis as { window?: unknown }).window;
  const session = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    sessionStorage: {
      getItem: (key: string) => session.get(key) ?? null,
      setItem: (key: string, value: string) => session.set(key, value),
    },
  };
  try {
    writeBiuTabSession("session-test", { keys: ["a", "", "b"], selectedKey: "missing" });
    assert.deepEqual(readBiuTabSession("session-test"), { keys: ["a", "b"], selectedKey: undefined });
    writeBiuTabSession("session-test", { keys: ["a", "b"], selectedKey: "b" });
    assert.deepEqual(readBiuTabSession("session-test"), { keys: ["a", "b"], selectedKey: "b" });
  } finally {
    if (previousWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else (globalThis as { window?: unknown }).window = previousWindow;
  }
});
