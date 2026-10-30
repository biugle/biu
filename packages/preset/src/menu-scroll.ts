import { useEffect } from "react";
import { type MenuNode } from "@biugle/biu-router";

function findAnchor(container: HTMLElement | null, key?: string) {
  if (!container || !key) return undefined;
  return [...container.querySelectorAll<HTMLElement>("[data-biu-menu-key]")].find(
    (element) => element.dataset.biuMenuKey === key,
  );
}

function scrollAnchor(container: HTMLElement | null, key?: string) {
  findAnchor(container, key)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
}

/** Keep every host navigation surface on the same selected menu anchor. */
export function useMenuScrollAnchors(selectedMenuKey?: string, selectedGroupKey?: string) {
  useEffect(() => {
    if (!selectedMenuKey && !selectedGroupKey) return;
    let frame = 0;
    let settleTimer = 0;
    const sync = () => {
      scrollAnchor(document.querySelector<HTMLElement>('[data-biu-menu-scroll="groups"]'), selectedGroupKey);
      scrollAnchor(document.querySelector<HTMLElement>('[data-biu-menu-scroll="menu"]'), selectedMenuKey);
      scrollAnchor(document.querySelector<HTMLElement>('[data-biu-menu-scroll="content"]'), selectedMenuKey);
      scrollAnchor(document.querySelector<HTMLElement>('[data-biu-menu-scroll="navigation"]'), selectedMenuKey);
      scrollAnchor(document.querySelector<HTMLElement>('[data-biu-menu-scroll="tabs"]'), selectedMenuKey);
    };
    frame = window.requestAnimationFrame(() => {
      sync();
      window.requestAnimationFrame(sync);
      // Directory expansion and lazy menu rendering commit after the first
      // frame. A final bounded pass makes navigation from search/favorites/
      // recent reliable without observing or polling the iframe document.
      settleTimer = window.setTimeout(sync, 80);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
    };
  }, [selectedGroupKey, selectedMenuKey]);
}

/** Return all directory keys that must be open before a leaf can be scrolled into view. */
export function directoryKeysForMenu(nodes: MenuNode[], targetKey: string, parents: string[] = []): string[] {
  for (const node of nodes) {
    const key =
      typeof node.meta?.__BIU_MENU_KEY === "string" && node.meta.__BIU_MENU_KEY
        ? String(node.meta.__BIU_MENU_KEY)
        : parents.length
          ? `${parents.at(-1)}/${node.code}`
          : node.code;
    if (key === targetKey) return node.type === "DIRECTORY" ? [...parents, key] : parents;
    const nextParents = node.type === "DIRECTORY" ? [...parents, key] : parents;
    const found = directoryKeysForMenu(node.children ?? [], targetKey, nextParents);
    if (found.length || (node.children ?? []).some((child) => String(child.meta?.__BIU_MENU_KEY ?? "") === targetKey))
      return found;
  }
  return [];
}
