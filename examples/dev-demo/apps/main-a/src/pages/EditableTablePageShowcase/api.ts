import { editableRows } from "./mock.js";

export type { EditableCatalogRow } from "./mock.js";

export function queryEditableRows(keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  return editableRows.filter(
    (row) =>
      !normalized || [row.name, row.category, row.note].some((value) => value.toLowerCase().includes(normalized)),
  );
}
