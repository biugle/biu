import assert from "node:assert/strict";
import test from "node:test";
import { createI18n, normalizeBiuLocale } from "../src/index.js";

test("normalizes locale, interpolates values and falls back to the fallback resource", () => {
  const i18n = createI18n("en-US", {
    resources: {
      "en-US": { key: "en-US", desc: "English", translation: { 问候: "Hello {name}" } },
      "zh-CN": { key: "zh-CN", desc: "中文", translation: { 问候: "你好 {name}", 仅中文: "仅中文" } },
    },
  });
  assert.equal(i18n.$t("问候", { name: "Biu" }), "Hello Biu");
  assert.equal(i18n.$t("仅中文"), "仅中文");
  assert.equal(i18n.$t("不存在"), "不存在");
});

test("resources can be registered, observed and removed without global pollution", () => {
  const i18n = createI18n("zh-CN");
  const locales: string[] = [];
  const unsubscribe = i18n.subscribe((locale) => locales.push(locale));
  i18n.addLocale({ key: "fr-FR", desc: "Français", translation: { 问候: "Bonjour" } }).setLocale("fr-FR");
  assert.equal(i18n.$t("问候"), "Bonjour");
  assert.equal(i18n.has("问候"), true);
  i18n.removeLocale("fr-FR");
  unsubscribe();
  assert.equal(i18n.getLocale(), "zh-CN");
  assert.deepEqual(locales, ["zh-CN", "fr-FR", "zh-CN"]);
});

test("locale normalization accepts language-only browser values", () => {
  assert.equal(normalizeBiuLocale("EN", ["zh-CN", "en-US"]), "en-US");
  assert.equal(normalizeBiuLocale("unknown", ["zh-CN", "en-US"]), "zh-CN");
});

test("falls back from every target locale through English, Chinese and the key", () => {
  const i18n = createI18n("zh-CN", {
    resources: {
      "zh-CN": { key: "zh-CN", desc: "中文", translation: { 仅中文: "中文" } },
      "en-US": { key: "en-US", desc: "English", translation: { 仅英文: "English" } },
      "fr-FR": { key: "fr-FR", desc: "Français", translation: {} },
    },
  });
  i18n.setLocale("fr-FR");
  assert.equal(i18n.$t("仅英文"), "English");
  assert.equal(i18n.$t("仅中文"), "中文");
  assert.equal(i18n.$t("不存在"), "不存在");
});

test("uses a safe Chinese default outside the browser and does not remove the fallback locale", () => {
  const i18n = createI18n(undefined, { resources: { "zh-CN": { key: "zh-CN", desc: "中文", translation: {} } } });
  assert.equal(i18n.getLocale(), "zh-CN");
  i18n.removeLocale("zh-CN");
  assert.equal(i18n.getLocale(), "zh-CN");
});

test("sanitizes runtime locale resources and persists fallback after removal", () => {
  const storage = new Map<string, string>();
  const previousStorage = (globalThis as { localStorage?: unknown }).localStorage;
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  };
  try {
    const instance = createI18n("fr-FR", {
      storageKey: "biu-locale-test",
      resources: {
        "fr-FR": {
          key: "fr-FR",
          desc: "Français",
          translation: { 问候: "Bonjour", 无效值: 10 as unknown as string },
        },
      },
    });
    assert.equal(instance.$t("问候"), "Bonjour");
    assert.equal(instance.$t("无效值"), "无效值");
    instance.removeLocale("fr-FR");
    assert.equal(instance.getLocale(), "zh-CN");
    assert.equal(storage.get("biu-locale-test"), "zh-CN");
  } finally {
    if (previousStorage === undefined) delete (globalThis as { localStorage?: unknown }).localStorage;
    else (globalThis as { localStorage?: unknown }).localStorage = previousStorage;
  }
});
