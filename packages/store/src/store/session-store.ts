import type { BiuTabSession } from "../types.js";
export type { BiuTabSession } from "../types.js";

const TAB_SESSION_PREFIX = "BIU_TABS_SESSION:";

function sessionKey(scope: string) {
  return `${TAB_SESSION_PREFIX}${encodeURIComponent(scope.trim() || "default")}`;
}

function normalizeScope(scope?: string) {
  return typeof scope === "string" && scope.trim() ? scope.trim() : "default";
}

export function readBiuTabSession(scope: string): BiuTabSession {
  if (typeof window === "undefined") return { keys: [] };
  try {
    const value = JSON.parse(
      window.sessionStorage.getItem(sessionKey(normalizeScope(scope))) || "null",
    ) as Partial<BiuTabSession> | null;
    const keys = Array.isArray(value?.keys)
      ? value.keys.filter((key): key is string => typeof key === "string" && key.trim().length > 0).slice(0, 50)
      : [];
    return {
      keys,
      selectedKey:
        typeof value?.selectedKey === "string" && keys.includes(value.selectedKey) ? value.selectedKey : undefined,
    };
  } catch {
    return { keys: [] };
  }
}

export function writeBiuTabSession(scope: string, value: BiuTabSession) {
  if (typeof window === "undefined") return;
  try {
    const keys = Array.isArray(value?.keys)
      ? value.keys.filter((key): key is string => typeof key === "string" && key.trim().length > 0).slice(0, 50)
      : [];
    window.sessionStorage.setItem(
      sessionKey(normalizeScope(scope)),
      JSON.stringify({
        keys,
        selectedKey:
          typeof value?.selectedKey === "string" && keys.includes(value.selectedKey) ? value.selectedKey : undefined,
      }),
    );
  } catch {
    // Private mode and quota failures must not interrupt navigation.
  }
}
