export * from "lucide-react";

import { icons as lucideIconMap, type LucideIcon } from "lucide-react";

export type BiuIconCategory =
  | "navigation"
  | "actions"
  | "communication"
  | "files"
  | "editor"
  | "media"
  | "business"
  | "devices"
  | "layout"
  | "security"
  | "shapes"
  | "brands"
  | "other";

export interface BiuIconCatalogItem {
  name: string;
  kebabName: string;
  aliases: string[];
  keywords: string[];
  category: BiuIconCategory;
  icon: LucideIcon;
}

const categoryRules: Array<[BiuIconCategory, RegExp]> = [
  ["navigation", /arrow|chevron|menu|navigation|route|compass|map|home|panel|sidebar|move|corner/i],
  [
    "actions",
    /check|x|plus|minus|edit|save|trash|download|upload|refresh|search|filter|sort|copy|play|pause|zoom|more/i,
  ],
  ["communication", /mail|message|chat|bell|phone|send|share|at-sign|contact|megaphone/i],
  ["files", /file|folder|archive|book|clipboard|paperclip|notebook|receipt|package/i],
  ["editor", /text|bold|italic|underline|code|quote|heading|align|eraser|type|spell/i],
  ["media", /image|camera|video|music|audio|mic|film|radio|volume|headphones|gallery/i],
  ["business", /briefcase|building|bank|chart|calendar|badge|dollar|wallet|store|shopping|truck|users|user/i],
  ["devices", /computer|monitor|laptop|tablet|mobile|phone|keyboard|mouse|printer|wifi|bluetooth|usb/i],
  ["layout", /columns|rows|grid|layout|panel|table|list|square|box|layers|component/i],
  ["security", /lock|shield|key|password|fingerprint|eye|scan|verified|shield-check/i],
  ["shapes", /circle|triangle|diamond|hexagon|octagon|star|heart|sparkle|badge|sun|moon/i],
  ["brands", /github|gitlab|google|facebook|twitter|linkedin|youtube|instagram|apple|microsoft|slack/i],
];

function kebabCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

function classify(name: string): BiuIconCategory {
  return categoryRules.find(([, pattern]) => pattern.test(name))?.[0] ?? "other";
}

const iconEntries = Object.entries(lucideIconMap as Record<string, LucideIcon>)
  .filter(([, icon]) => typeof icon === "object" || typeof icon === "function")
  .map(
    ([name, icon]) =>
      ({
        name,
        kebabName: kebabCase(name),
        aliases: [kebabCase(name), name.toLowerCase()],
        keywords: name
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .toLowerCase()
          .split(" "),
        category: classify(name),
        icon,
      }) satisfies BiuIconCatalogItem,
  );

export const biuIconCatalog: readonly BiuIconCatalogItem[] = iconEntries;
export const biuIconCategories = [...new Set(iconEntries.map((item) => item.category))] as BiuIconCategory[];
export const biuIcons = lucideIconMap as Record<string, LucideIcon>;

export function searchBiuIcons(query = "", category?: BiuIconCategory) {
  const normalized = query.trim().toLowerCase();
  return biuIconCatalog.filter((item) => {
    if (category && item.category !== category) return false;
    if (!normalized) return true;
    return [item.name, item.kebabName, ...item.aliases, ...item.keywords].some((value) => value.includes(normalized));
  });
}

export function getBiuIcon(name: string) {
  return biuIcons[name] ?? biuIcons[Object.keys(biuIcons).find((key) => kebabCase(key) === name) ?? ""];
}
