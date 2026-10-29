import type { ReactNode } from "react";

export function nodeText(value: ReactNode) {
  if (typeof value === "string" || typeof value === "number") return String(value).toLowerCase();
  return "";
}
