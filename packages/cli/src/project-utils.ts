import { dirname, isAbsolute, relative, resolve } from "node:path";
import { t } from "./i18n/index.js";
import type { BiuConfig, LocalRoute } from "./types.js";

export function projectPath(projectRoot: string, value: string) {
  return isAbsolute(value) ? value : resolve(projectRoot, value);
}

function configuredOrigin(value: string) {
  try {
    const url = new URL(value, "http://localhost");
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) return undefined;
    return {
      origin: url.origin,
      relative: !/^[a-z][a-z\d+.-]*:\/\//i.test(value),
    };
  } catch {
    return undefined;
  }
}

export function validateRemoteApp(
  route: LocalRoute,
  config: BiuConfig,
  remote: NonNullable<NonNullable<BiuConfig["remoteApps"]>[string]>,
) {
  const parsed = configuredOrigin(remote.APP_URL);
  if (!parsed) throw new Error(t("远程 APP_URL 必须是 HTTP(S) 地址：{code}", { code: route.code }));
  const origins = remote.ALLOWED_ORIGINS ?? config.remoteAppOrigins ?? [];
  if (
    !parsed.relative &&
    (!origins.length || !origins.some((origin) => configuredOrigin(origin)?.origin === parsed.origin))
  ) {
    throw new Error(t("远程 APP_URL 必须配置 ALLOWED_ORIGINS：{code}", { code: route.code }));
  }
  for (const origin of origins) {
    if (!configuredOrigin(origin)) throw new Error(t("远程 APP 白名单地址无效：{code}", { code: route.code }));
  }
}

export function isPortalProject(config: BiuConfig) {
  return config.projectType === "PORTAL";
}

export function toImportPath(from: string, target: string) {
  let value = relative(dirname(from), target).replace(/\\/g, "/");
  if (!value.startsWith(".")) value = `./${value}`;
  return value;
}
