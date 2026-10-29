import type { BiuAuthConfig, BiuAuthContext, BiuRemoteAppResolvedConfig, BiuRuntimeConfig } from "./types.js";
import { normalizeOrigin } from "@biugle/biu-bridge";

/** Runtime-only resolution stays here; the protocol package remains framework independent. */
export function remoteAppFor(
  config: BiuRuntimeConfig,
  node: { appId?: string },
): BiuRemoteAppResolvedConfig & { url?: string } {
  const value = node.appId ? config.remoteApps?.[node.appId] : undefined;
  return {
    url: value?.APP_URL,
    allowedOrigins: value?.ALLOWED_ORIGINS ?? config.remoteAppOrigins,
    overlayMode: value?.OVERLAY_MODE ?? "IFRAME",
  };
}

export function authContextFor(config: Pick<BiuRuntimeConfig, "auth">): BiuAuthContext {
  const auth: BiuAuthConfig | undefined = config.auth;
  return {
    mode: auth?.mode ?? "NONE",
    authenticated: auth?.authenticated ?? Boolean(auth?.user),
    user: auth?.user,
  };
}

/** Auth commands from embedded APPs must match an explicit configured origin. */
export function isAllowedAuthActionOrigin(
  config: Pick<BiuRuntimeConfig, "remoteApps" | "remoteAppOrigins">,
  origin: string,
) {
  const normalizedEventOrigin = normalizeOrigin(origin);
  // MessageEvent.origin may be the opaque string "null". normalizeOrigin
  // treats ordinary strings as relative URLs, so require a canonical origin.
  if (!normalizedEventOrigin || normalizedEventOrigin !== origin) return false;
  const allowedOrigins = [
    ...(config.remoteAppOrigins ?? []),
    ...Object.values(config.remoteApps ?? {}).flatMap((remote) => remote.ALLOWED_ORIGINS ?? []),
  ];
  return allowedOrigins.some((value) => normalizeOrigin(value) === normalizedEventOrigin);
}
