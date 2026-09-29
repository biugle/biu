import { messages as enUS } from "./en-US.js";
import { messages as zhCN } from "./zh-CN.js";

export type BiuLocale = "zh-CN" | "en-US" | (string & {});

export interface BiuLocaleOption {
  code: BiuLocale;
  label: string;
}

export interface BiuLanguageResource {
  key: BiuLocale;
  desc: string;
  translation: Record<string, string>;
}

export interface BiuI18nOptions {
  resources?: Record<string, BiuLanguageResource>;
  defaultLocale?: BiuLocale;
  fallbackLocale?: BiuLocale;
  storageKey?: string;
}

export const defaultBiuLocales: readonly BiuLocaleOption[] = [
  { code: "zh-CN", label: "简体中文" },
  { code: "en-US", label: "English" },
];

/** Normalize persisted/bridge locale values before they reach the UI. */
export function normalizeBiuLocale(
  value: unknown,
  supported: readonly BiuLocale[] = defaultBiuLocales.map((item) => item.code),
) {
  const candidates = supported.filter((item): item is BiuLocale => typeof item === "string" && item.trim().length > 0);
  const fallback = candidates.find((item) => item === "zh-CN") ?? candidates[0] ?? "zh-CN";
  if (typeof value !== "string" || !value.trim()) return fallback;
  const normalized = value.trim();
  return (
    candidates.find((item) => item === normalized) ??
    candidates.find((item) => item.toLowerCase() === normalized.toLowerCase()) ??
    candidates.find((item) => item.split("-")[0].toLowerCase() === normalized.toLowerCase()) ??
    fallback
  );
}

const builtinResources: Record<string, BiuLanguageResource> = {
  "zh-CN": { key: "zh-CN", desc: "简体中文", translation: zhCN },
  "en-US": { key: "en-US", desc: "English", translation: enUS },
};

function normalizeResource(resource: unknown, fallbackKey?: string): BiuLanguageResource | undefined {
  if (!resource || typeof resource !== "object" || Array.isArray(resource)) return undefined;
  const value = resource as Record<string, unknown>;
  const key = typeof value.key === "string" && value.key.trim() ? value.key.trim() : fallbackKey?.trim();
  if (!key || !value.translation || typeof value.translation !== "object" || Array.isArray(value.translation))
    return undefined;
  const translation = Object.fromEntries(
    Object.entries(value.translation as Record<string, unknown>).filter(
      ([messageKey, message]) => typeof messageKey === "string" && typeof message === "string",
    ),
  ) as Record<string, string>;
  return {
    key,
    desc: typeof value.desc === "string" && value.desc.trim() ? value.desc : key,
    translation,
  };
}

function interpolate(value: string, params: Record<string, string | number> = {}) {
  return value.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}

export function getBrowserLocale(supported: readonly BiuLocale[] = ["zh-CN", "en-US"]): BiuLocale {
  const candidates = supported.filter(
    (locale): locale is BiuLocale => typeof locale === "string" && locale.trim().length > 0,
  );
  const fallback = candidates.find((locale) => locale === "zh-CN") ?? candidates[0] ?? "zh-CN";
  const browser = typeof window !== "undefined" && typeof navigator !== "undefined" ? navigator.language : undefined;
  if (!browser) return fallback;
  const match =
    candidates.find((locale) => locale.toLowerCase() === browser.toLowerCase()) ??
    candidates.find((locale) => locale.split("-")[0].toLowerCase() === browser.split("-")[0].toLowerCase());
  return match ?? fallback;
}

export interface BiuI18n {
  readonly locale: BiuLocale;
  setLocale(locale: BiuLocale): BiuI18n;
  getLocale(): BiuLocale;
  getLocaleList(): BiuLocaleOption[];
  getResource(locale?: BiuLocale): BiuLanguageResource | undefined;
  getTranslations(locale?: BiuLocale): Record<string, string>;
  has(key: string, locale?: BiuLocale): boolean;
  addLocale(resource: BiuLanguageResource): BiuI18n;
  removeLocale(locale: BiuLocale): BiuI18n;
  subscribe(listener: (locale: BiuLocale) => void): () => void;
  $t(key: string, params?: Record<string, string | number>, locale?: BiuLocale): string;
}

/**
 * Small resource-oriented i18n core. It keeps the useful parts of the
 * reference implementation (resources, language list, runtime switching,
 * interpolation and fallback) without introducing a dependency into the
 * foundation package.
 */
export function createI18n(initialLocale?: BiuLocale, options: BiuI18nOptions = {}): BiuI18n {
  const resources = new Map<string, BiuLanguageResource>();
  for (const [key, resource] of Object.entries({ ...builtinResources, ...(options.resources ?? {}) })) {
    const normalized = normalizeResource(resource, key);
    if (normalized) resources.set(normalized.key, normalized);
  }
  const resourceLocales = [...resources.keys()] as BiuLocale[];
  const fallbackLocale = normalizeBiuLocale(options.fallbackLocale ?? "zh-CN", resourceLocales);
  const storageKey = options.storageKey;
  const listeners = new Set<(locale: BiuLocale) => void>();
  const readStorage = () => {
    if (!storageKey || typeof localStorage === "undefined") return null;
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };
  const supported = [...resources.keys()] as BiuLocale[];
  let currentLocale = normalizeBiuLocale(
    initialLocale ?? options.defaultLocale ?? readStorage() ?? getBrowserLocale(supported),
    supported,
  );

  const persist = () => {
    if (storageKey && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(storageKey, currentLocale);
      } catch {
        // Private browsing and server-side runtimes may not expose writable storage.
      }
    }
  };
  const notify = () => listeners.forEach((listener) => listener(currentLocale));
  return {
    get locale() {
      return currentLocale;
    },
    setLocale(locale) {
      const nextLocale = normalizeBiuLocale(locale, [...resources.keys()] as BiuLocale[]);
      if (nextLocale === currentLocale) return this;
      currentLocale = nextLocale;
      persist();
      notify();
      return this;
    },
    getLocale() {
      return currentLocale;
    },
    getLocaleList() {
      return [...resources.values()].map(({ key, desc }) => ({ code: key, label: desc }));
    },
    getResource(locale = currentLocale) {
      return resources.get(normalizeBiuLocale(locale, [...resources.keys()] as BiuLocale[]));
    },
    getTranslations(locale = currentLocale) {
      return this.getResource(locale)?.translation ?? {};
    },
    has(key, locale = currentLocale) {
      return Object.prototype.hasOwnProperty.call(this.getTranslations(locale), key);
    },
    addLocale(resource) {
      const normalized = normalizeResource(resource);
      if (!normalized) throw new TypeError("A locale resource must include key and translation");
      resources.set(normalized.key, normalized);
      notify();
      return this;
    },
    removeLocale(locale) {
      const normalized = [...resources.keys()].find(
        (candidate) => candidate === locale || candidate.toLowerCase() === String(locale).toLowerCase(),
      );
      if (!normalized || normalized === fallbackLocale) return this;
      resources.delete(normalized);
      if (!resources.has(currentLocale)) currentLocale = fallbackLocale;
      persist();
      notify();
      return this;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    $t(key, params, locale = currentLocale) {
      const supported = [...resources.keys()] as BiuLocale[];
      const resolvedLocale = normalizeBiuLocale(locale, supported);
      const lookupLocales = [...new Set([resolvedLocale, "en-US", fallbackLocale, "zh-CN"])].filter((candidate) =>
        resources.has(candidate),
      );
      const value =
        lookupLocales.reduce<string | undefined>(
          (result, candidate) => result ?? resources.get(candidate)?.translation[key],
          undefined,
        ) ?? key;
      return interpolate(value, params);
    },
  };
}

/** Non-React utilities use this stable resource registry. */
export const i18n = createI18n();
