import zhCN from "./zh-CN.json";
import enUS from "./en-US.json";

export type BiuComponentsLocale = string;

export type BiuComponentsLocaleText = Record<string, string>;
export type BiuComponentsLocaleTextOverrides = Partial<Record<string, string>>;

const resources: Record<string, BiuComponentsLocaleText> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};

function resourceLocale(locale?: string) {
  if (typeof locale !== "string" || !locale.trim()) return "zh-CN";
  const normalized = locale.trim().toLowerCase();
  return (
    Object.keys(resources).find((key) => key.toLowerCase() === normalized) ??
    Object.keys(resources).find((key) => key.split("-")[0].toLowerCase() === normalized.split("-")[0]) ??
    "zh-CN"
  );
}

export function getBiuComponentsLocaleText(
  locale = "zh-CN",
  overrides?: BiuComponentsLocaleTextOverrides,
): BiuComponentsLocaleText {
  return Object.fromEntries(
    Object.entries({ ...resources[resourceLocale(locale)], ...overrides }).filter(([, value]) => value !== undefined),
  ) as BiuComponentsLocaleText;
}

export const biuComponentsLocales = {
  "zh-CN": resources["zh-CN"],
  "en-US": resources["en-US"],
} as const;
