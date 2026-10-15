import { catalogRows, type CatalogStatus } from "./mock.js";

export function queryCatalogRows(status: CatalogStatus | "all", keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  return catalogRows.filter((row) => {
    if (status !== "all" && row.status !== status) return false;
    if (!normalized) return true;
    return [row.code, row.name, row.group, row.owner].some((value) => value.toLowerCase().includes(normalized));
  });
}

export type { CatalogRow, CatalogStatus } from "./mock.js";
