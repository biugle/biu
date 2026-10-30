import { type BiuLocale } from "@biugle/biu-i18n";
import { type MenuNode } from "@biugle/biu-router";
import { menuLabelPath } from "./layout-components.js";

export function tabPathParts(_portalLabel: string, node: MenuNode, menus: MenuNode[], locale?: BiuLocale) {
  return menuLabelPath(node, menus, locale).split(" / ").filter(Boolean);
}
