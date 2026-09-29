import zhCN from "./zh-CN.json";
import enUS from "./en-US.json";

export type BiuFormLocale = string;

export type BiuFormLocaleText = Record<string, string>;
export type BiuFormLocaleTextOverrides = Partial<Record<string, string>>;

const resources: Record<string, BiuFormLocaleText> = {
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

export function getBiuFormLocaleText(locale = "zh-CN", overrides?: BiuFormLocaleTextOverrides): BiuFormLocaleText {
  return Object.fromEntries(
    Object.entries({ ...resources[resourceLocale(locale)], ...overrides }).filter(([, value]) => value !== undefined),
  ) as BiuFormLocaleText;
}

export const biuFormLocales = { "zh-CN": resources["zh-CN"], "en-US": resources["en-US"] } as const;
