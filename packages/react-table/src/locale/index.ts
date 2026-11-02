import zhCN from "./zh-CN.json";
import enUS from "./en-US.json";

export type BiuTableLocale = string;

export type BiuTableLocaleText = Record<string, string>;
export type BiuTableLocaleTextOverrides = Partial<Record<string, string>>;

const resources: Record<string, BiuTableLocaleText> = {
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

export function getBiuTableLocaleText(locale = "zh-CN", overrides?: BiuTableLocaleTextOverrides): BiuTableLocaleText {
  return Object.fromEntries(
    Object.entries({ ...resources[resourceLocale(locale)], ...overrides }).filter(([, value]) => value !== undefined),
  ) as BiuTableLocaleText;
}

/** Join a column title and its resolved control label without changing Chinese labels or caller spacing. */
export function joinTableLocaleLabel(title: string, label: string, labelFirst = false) {
  const [left, right] = labelFirst ? [label, title] : [title, label];
  const separator =
    !left || !right || /\p{Script=Han}/u.test(label) || /\s$/u.test(left) || /^\s/u.test(right) ? "" : " ";
  return left + separator + right;
}

export const biuTableLocales = { "zh-CN": resources["zh-CN"], "en-US": resources["en-US"] } as const;
