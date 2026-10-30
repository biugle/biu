export interface BiuUpdateChecker {
  initialize: () => Promise<void>;
  check: () => Promise<boolean>;
}

interface ManifestSnapshot {
  raw: string;
  buildId?: string;
}

function withCacheBust(url: string) {
  const value = new URL(url, window.location.origin);
  value.searchParams.set("biu_check", String(Date.now()));
  return value.toString();
}

export function createBiuUpdateChecker(manifestUrl = "/manifest/routes.json", onUpdate?: () => void): BiuUpdateChecker {
  let baseline: ManifestSnapshot | undefined;
  let notified = false;
  const read = async () => {
    const response = await fetch(withCacheBust(manifestUrl), {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) return undefined;
    const raw = await response.text();
    try {
      const value: unknown = JSON.parse(raw);
      const buildId =
        value && typeof value === "object" && typeof (value as { buildId?: unknown }).buildId === "string"
          ? (value as { buildId: string }).buildId
          : undefined;
      return { raw, buildId } satisfies ManifestSnapshot;
    } catch {
      return { raw } satisfies ManifestSnapshot;
    }
  };
  const initialize = async () => {
    try {
      const initial = await read();
      // A navigation may already have established the first successful
      // baseline while this startup request was still pending.
      if (!baseline) baseline = initial;
    } catch {
      // Keep a baseline established by a concurrent navigation check.
    }
  };
  const check = async () => {
    if (notified) return false;
    try {
      const current = await read();
      // Another navigation may have completed its read while this one was
      // pending. Recheck after awaiting to keep the notification single-shot.
      if (notified || !current) return false;
      // A transient failure during startup should not permanently disable
      // update detection. The first successful later read becomes baseline.
      if (!baseline) {
        baseline = current;
        return false;
      }
      const changed =
        baseline.buildId && current.buildId ? baseline.buildId !== current.buildId : baseline.raw !== current.raw;
      if (changed) {
        notified = true;
        onUpdate?.();
        return true;
      }
    } catch {
      // Network failures never interrupt navigation.
    }
    return false;
  };
  return { initialize, check };
}
