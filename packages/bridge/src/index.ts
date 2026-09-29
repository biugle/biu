import type {
  BiuBridgeAuthContext,
  BiuBridgeMessage,
  BiuBridgeOverlayState,
  BiuBridgeTheme,
  BiuHostContextPayload,
} from "./types.js";

export type * from "./types.js";

export function normalizeOrigin(value: string) {
  try {
    const baseOrigin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
    const url = new URL(value, baseOrigin);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

export function parentOrigin(allowedOrigins?: string[]) {
  if (typeof window === "undefined" || window.parent === window) return "";
  try {
    if (document.referrer) {
      const origin = new URL(document.referrer).origin;
      if (!allowedOrigins?.length || allowedOrigins.some((value) => normalizeOrigin(value) === origin)) return origin;
      return "";
    }
  } catch {
    // Fall through to an explicit allowlist when the referrer is unavailable.
  }
  return allowedOrigins?.map(normalizeOrigin).find((value): value is string => Boolean(value)) ?? "";
}

export function postBiuMessage(message: Record<string, unknown>, targetOrigin?: string) {
  if (typeof window === "undefined" || window.parent === window) return;
  const origin = targetOrigin ? normalizeOrigin(targetOrigin) : parentOrigin();
  if (!origin) return;
  window.parent.postMessage({ ...message, CHANNEL: "BIU" }, origin);
}

export function isBridgeMessage(value: unknown): value is BiuBridgeMessage {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return data.CHANNEL === "BIU" && typeof data.TYPE === "string";
}

export function isAppEventPayload(value: unknown): value is { name: string; payload: unknown; source?: string } {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.name === "string" &&
    data.name.trim().length > 0 &&
    data.name.length <= 160 &&
    (data.source === undefined || (typeof data.source === "string" && data.source.length <= 160))
  );
}

export function isAuthContext(value: unknown): value is BiuBridgeAuthContext {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  if ((data.mode !== "SSO" && data.mode !== "NONE") || typeof data.authenticated !== "boolean") return false;
  if (data.user !== undefined) {
    if (!data.user || typeof data.user !== "object") return false;
    const user = data.user as Record<string, unknown>;
    if (typeof user.name !== "string" || !user.name.trim() || user.name.length > 240) return false;
    if (user.id !== undefined && (typeof user.id !== "string" || user.id.length > 240)) return false;
    if (user.role !== undefined && (typeof user.role !== "string" || user.role.length > 240)) return false;
    if (user.avatar !== undefined && (typeof user.avatar !== "string" || user.avatar.length > 2048)) return false;
    if (
      user.roles !== undefined &&
      (!Array.isArray(user.roles) || user.roles.some((item) => typeof item !== "string" || item.length > 240))
    )
      return false;
    if (
      user.permissions !== undefined &&
      (!Array.isArray(user.permissions) ||
        user.permissions.some((item) => typeof item !== "string" || item.length > 240))
    )
      return false;
    if (user.extra !== undefined && (!user.extra || typeof user.extra !== "object" || Array.isArray(user.extra)))
      return false;
  }
  return true;
}

export function isHostContextPayload(value: unknown): value is BiuHostContextPayload {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    (data.PORTAL_CODE === undefined || typeof data.PORTAL_CODE === "string") &&
    (data.ENVIRONMENT === undefined || typeof data.ENVIRONMENT === "string") &&
    (data.LOCALE === undefined || typeof data.LOCALE === "string") &&
    (data.THEME === undefined || ["light", "dark", "system"].includes(String(data.THEME))) &&
    (data.DIRECTION === undefined || ["ltr", "rtl"].includes(String(data.DIRECTION))) &&
    (data.TIMEZONE === undefined || typeof data.TIMEZONE === "string") &&
    (data.CURRENT_CODE === undefined || typeof data.CURRENT_CODE === "string") &&
    (data.AUTH === undefined || isAuthContext(data.AUTH))
  );
}

export function isAuthAction(value: unknown): value is "LOGIN" | "LOGOUT" | "REFRESH" {
  return value === "LOGIN" || value === "LOGOUT" || value === "REFRESH";
}

export function isOverlayState(value: unknown): value is BiuBridgeOverlayState {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.ID === "string" &&
    data.ID.length > 0 &&
    data.ID.length <= 120 &&
    typeof data.OPEN === "boolean" &&
    (data.MODE === undefined || ["IFRAME", "WORKSPACE", "FULLSCREEN"].includes(String(data.MODE))) &&
    (data.SCOPE === undefined || ["IFRAME", "HOST_CHROME", "WORKSPACE"].includes(String(data.SCOPE)))
  );
}

export function isSafeRemoteUrl(value: string, allowedOrigins?: string[]) {
  const origin = normalizeOrigin(value);
  if (!origin) return false;
  if (allowedOrigins?.length) return allowedOrigins.some((item) => normalizeOrigin(item) === origin);
  return typeof window !== "undefined" && origin === window.location.origin;
}

const privateFieldPattern = /(token|secret|password|cookie|session|authorization|credential|csrf|private.?key)/i;

function sanitizePublicValue(value: unknown, depth = 0): unknown {
  if (depth > 3 || value === null) return depth > 3 ? undefined : null;
  if (typeof value === "string") return value.length <= 2048 ? value : value.slice(0, 2048);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizePublicValue(item, depth + 1));
  if (typeof value !== "object") return undefined;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (privateFieldPattern.test(key)) continue;
    const safe = sanitizePublicValue(item, depth + 1);
    if (safe !== undefined) result[key] = safe;
  }
  return result;
}

/** Remove credentials and other private fields before crossing the bridge. */
export function publicAuthContext(auth?: BiuBridgeAuthContext): BiuBridgeAuthContext | undefined {
  if (!auth) return undefined;
  const user = auth.user
    ? (Object.fromEntries(
        Object.entries({
          id: auth.user.id,
          name: auth.user.name,
          role: auth.user.role,
          avatar: auth.user.avatar,
          roles: auth.user.roles?.filter((item) => typeof item === "string").slice(0, 100),
          permissions: auth.user.permissions?.filter((item) => typeof item === "string").slice(0, 100),
          extra: sanitizePublicValue(auth.user.extra),
        }).filter(([, value]) => value !== undefined),
      ) as unknown as BiuBridgeAuthContext["user"])
    : undefined;
  return { mode: auth.mode, authenticated: auth.authenticated, user };
}

export type { BiuBridgeTheme };
