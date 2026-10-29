const CHUNK_RECOVERY_KEY_PREFIX = "__BIU_CHUNK_RECOVERY_V1__:";
export const CHUNK_RECOVERY_COOLDOWN_MS = 10 * 60 * 1000;

type ChunkRecoveryStorage = Pick<Storage, "getItem" | "setItem">;

export type ChunkRecoveryResult =
  "reloading" | "recently-attempted" | "not-chunk-error" | "storage-unavailable" | "offline";

const chunkLoadErrorPatterns = [
  /\bChunkLoadError\b/i,
  /\bLoading (?:CSS )?chunk\b[\s\S]*?\bfailed\b/i,
  /\bFailed to fetch dynamically imported module\b/i,
  /\bImporting a module script failed\b/i,
  /\bError loading dynamically imported module\b/i,
  /\bUnable to preload (?:CSS|module)\b/i,
  /\bFailed to load module script\b/i,
];

function getErrorText(error: unknown) {
  if (typeof error === "string") return { name: "", message: error, stack: "" };
  if (!error || typeof error !== "object") return { name: "", message: "", stack: "" };

  const value = error as { name?: unknown; message?: unknown; stack?: unknown };
  return {
    name: typeof value.name === "string" ? value.name : "",
    message: typeof value.message === "string" ? value.message : "",
    stack: typeof value.stack === "string" ? value.stack : "",
  };
}

/**
 * Conservative fallback for a stale lazy-loaded asset. A full-page reload can
 * clear in-memory business state, so only explicit chunk failures qualify;
 * ordinary render and API errors stay in the existing error flow.
 */
export function isChunkLoadError(error: unknown) {
  const { name, message, stack } = getErrorText(error);
  if (!message) return false;
  if (name === "SyntaxError" && !/\bUnexpected token\s+['"]?</i.test(message)) return false;

  const details = `${message}\n${stack}`;
  if (chunkLoadErrorPatterns.some((pattern) => pattern.test(details))) return true;

  // Some browsers describe an HTML fallback served as JavaScript as an
  // unexpected '<'. Requiring both that token and a JS stack avoids retrying
  // unrelated syntax errors in application code.
  return (
    name === "SyntaxError" && /\bUnexpected token\s+['"`]?</i.test(message) && /\.m?js(?:[?#:\s)\]]|$)/i.test(details)
  );
}

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  }
  return (result >>> 0).toString(36);
}

function getPageIdentity(href: string) {
  try {
    const url = new URL(href);
    return `${url.origin}${url.pathname}`;
  } catch {
    return href.split(/[?#]/, 1)[0] ?? href;
  }
}

function getAssetIdentity(details: string) {
  const match = details.match(/(?:https?:\/\/|\/)[^\s"'`()\]}]*?\.m?js(?:\?[^\s"'`()\]}]*)?/i);
  return match?.[0]?.replace(/[),.;]+$/, "").replace(/[?#].*$/, "");
}

function getRecoveryKey(error: unknown, href: string) {
  const { name, message, stack } = getErrorText(error);
  const details = `${message}\n${stack}`;
  const identity = getAssetIdentity(details) ?? `${name}:${message}`;
  return `${CHUNK_RECOVERY_KEY_PREFIX}${hash(`${getPageIdentity(href)}\n${identity}`)}`;
}

/**
 * Claim one retry per page and asset. sessionStorage survives the reload, which
 * prevents a broken deployment from sending the user through a reload loop.
 */
export function claimChunkLoadRecovery(
  error: unknown,
  storage: ChunkRecoveryStorage,
  href: string,
  now = Date.now(),
): "claimed" | "recently-attempted" | "not-chunk-error" | "storage-unavailable" {
  if (!isChunkLoadError(error)) return "not-chunk-error";

  try {
    const key = getRecoveryKey(error, href);
    const previousAttempt = storage.getItem(key);
    const previousTime = previousAttempt === null ? Number.NaN : Number(previousAttempt);
    if (Number.isFinite(previousTime) && now >= previousTime && now - previousTime < CHUNK_RECOVERY_COOLDOWN_MS) {
      return "recently-attempted";
    }

    storage.setItem(key, String(now));
    return "claimed";
  } catch {
    return "storage-unavailable";
  }
}

export function recoverFromChunkLoadError(error: unknown): ChunkRecoveryResult {
  if (!isChunkLoadError(error)) return "not-chunk-error";
  if (typeof window === "undefined") return "storage-unavailable";

  // An explicit offline state cannot recover from a deployment mismatch;
  // keep the error view available instead of reloading into another failure.
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";

  try {
    const result = claimChunkLoadRecovery(error, window.sessionStorage, window.location.href);
    if (result === "claimed") {
      // Use the normal browser reload path so any registered beforeunload
      // handler can still protect unsaved business data.
      window.location.reload();
      return "reloading";
    }
    return result;
  } catch {
    return "storage-unavailable";
  }
}
