import type { QueryTableResponse } from "./types.js";

export function stableSerialize(value: unknown, seen = new WeakSet<object>()): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    return JSON.stringify(value);
  if (typeof value === "bigint") return `bigint:${value.toString()}`;
  if (value instanceof Date) return `date:${value.toISOString()}`;
  if (typeof FormData !== "undefined" && value instanceof FormData) return "[FormData]";
  if (typeof Blob !== "undefined" && value instanceof Blob) return `[Blob:${value.type}:${value.size}]`;
  if (Array.isArray(value)) return `[${value.map((item) => stableSerialize(item, seen)).join(",")}]`;
  if (typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    const result = `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize((value as Record<string, unknown>)[key], seen)}`)
      .join(",")}}`;
    seen.delete(value);
    return result;
  }
  return String(value);
}

export function normalizeQueryTableResponse<T>(response: unknown): QueryTableResponse<T> {
  const value = response as {
    items?: T[];
    data?:
      | T[]
      | {
          items?: T[];
          data?: T[];
          records?: T[];
          results?: T[];
          total?: number;
          pagination?: { totalResult?: number; total?: number };
        };
    results?: T[];
    records?: T[];
    total?: number;
    totalResult?: number;
    pagination?: { totalResult?: number; total?: number };
  };
  const nested = value?.data && !Array.isArray(value.data) ? value.data : undefined;
  const items =
    value?.items ??
    (Array.isArray(value?.data) ? value.data : undefined) ??
    value?.results ??
    nested?.items ??
    nested?.data ??
    nested?.records ??
    nested?.results ??
    [];
  const total =
    value?.total ??
    value?.pagination?.totalResult ??
    value?.pagination?.total ??
    value?.totalResult ??
    nested?.total ??
    nested?.pagination?.totalResult ??
    nested?.pagination?.total ??
    items.length;
  return {
    items: Array.isArray(items) ? items : [],
    total: Number.isFinite(Number(total)) ? Number(total) : Array.isArray(items) ? items.length : 0,
  };
}
