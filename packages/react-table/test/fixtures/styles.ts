import { readFileSync } from "node:fs";

/** Resolve the public stylesheet's ordered source imports without depending on dist. */
export function readTableStyles() {
  function readStyles(url: URL, ancestors: ReadonlySet<string>): string {
    if (ancestors.has(url.href)) throw new Error(`Circular stylesheet import: ${url.href}`);
    const nextAncestors = new Set([...ancestors, url.href]);
    return readFileSync(url, "utf8").replace(/@import\s+["']([^"']+)["']\s*;/g, (_, path: string) =>
      readStyles(new URL(path, url), nextAncestors),
    );
  }
  return readStyles(new URL("../../src/styles.css", import.meta.url), new Set());
}
