import React from "react";
import { i18n } from "@biugle/biu-i18n";
import { postBiuMessage } from "@biugle/biu-bridge";
import type {
  BiuEventBus,
  BiuFrameworkAdapter,
  BiuContextValue,
  BiuLayoutOverrides,
  BiuOverlayState,
} from "./types.js";

export const htmlAdapter: BiuFrameworkAdapter = {
  framework: "html",
  loadPage(module) {
    if (typeof module === "string") return module;
    if (module && typeof module === "object" && "default" in module) return (module as { default: unknown }).default;
    return module;
  },
  renderPage(container, page, context) {
    if (typeof page !== "string")
      throw new Error(i18n.$t("HTML 页面模块必须导出字符串内容", undefined, context.locale));
    // This is a trust boundary: `page` must come from the application's own
    // trusted module, never from user input or an API response.
    container.innerHTML = page;
  },
  unmountPage(container) {
    container.replaceChildren();
  },
};

const noopNavigate = () => false;
const noopAuth = () => undefined;
const noopSetAuth = () => undefined;
const noopLayout = () => undefined;
const noopSetPreference = () => undefined;
const emptyEventBus: BiuEventBus = {
  publish: () => undefined,
  subscribe: () => () => undefined,
  clear: () => undefined,
};

export const BiuContext = React.createContext<BiuContextValue>({
  appId: "",
  navigateByCode: noopNavigate,
  navigateByKey: noopNavigate,
  resolveMenuPath: () => undefined,
  navigate: noopNavigate,
  requestAuth: noopAuth,
  login: noopAuth,
  logout: noopAuth,
  refreshAuth: noopAuth,
  setAuth: noopSetAuth,
  layoutOverrides: {},
  setLayoutOverrides: noopLayout,
  resetLayoutOverrides: noopLayout,
  setLocale: noopSetPreference,
  reloadMenus: noopSetPreference,
  reloadLocale: noopSetPreference,
  setTheme: noopSetPreference,
  setDirection: noopSetPreference,
  setTimezone: noopSetPreference,
  events: emptyEventBus,
});

export function useBiuContext() {
  return React.useContext(BiuContext);
}

/** Authentication context is identity-only; token/session transport remains the SSO provider's concern. */
export function useBiuAuthContext() {
  const { auth, requestAuth, login, logout, refreshAuth, setAuth } = useBiuContext();
  return { auth, requestAuth, login, logout, refreshAuth, setAuth };
}

/** Page-scoped layout controls reset automatically on the next navigation. */
export function useBiuLayoutControl() {
  const { layoutOverrides, setLayoutOverrides, resetLayoutOverrides } = useBiuContext();
  return {
    layoutOverrides,
    setLayoutOverrides: React.useCallback(
      (overrides: BiuLayoutOverrides) => setLayoutOverrides(overrides),
      [setLayoutOverrides],
    ),
    resetLayoutOverrides,
  };
}

/** Locale-aware helper for React pages; the current Portal context is always used. */
export function useBiuI18n() {
  const { locale } = useBiuContext();
  const getResourceSnapshot = React.useMemo(() => {
    let snapshot: Array<ReturnType<typeof i18n.getResource>> | undefined;
    return () => {
      const next = [i18n.getResource(locale), i18n.getResource("en-US"), i18n.getResource("zh-CN")];
      if (!snapshot || next.some((resource, index) => resource !== snapshot![index])) snapshot = next;
      return snapshot;
    };
  }, [locale]);
  // Include fallback resources: a same-language reload can change translations
  // used by memoized columns without changing the selected locale itself.
  const resources = React.useSyncExternalStore(i18n.subscribe, getResourceSnapshot, getResourceSnapshot);
  return {
    locale,
    $t: React.useCallback(
      (key: string, params?: Record<string, string | number>) => i18n.$t(key, params, locale),
      [locale, resources],
    ),
  };
}

export function useBiuPermission(code: string) {
  const { permissionCodes } = useBiuContext();
  return permissionCodes ? permissionCodes.has(code) : true;
}

/** Requests a host-controlled mask or workspace state from an embedded APP. */
export function useBiuOverlay() {
  const context = useBiuContext();
  return React.useCallback(
    (state: BiuOverlayState) => {
      postBiuMessage({ TYPE: "UI_OVERLAY_STATE", APP_ID: context.appId, PAYLOAD: state }, context.hostOrigin);
    },
    [context.appId, context.hostOrigin],
  );
}

export function LinkByCode({
  code,
  children,
  query,
}: {
  code: string;
  children: React.ReactNode;
  query?: string | Record<string, string>;
}) {
  const { navigateByCode, resolveMenuPath } = useBiuContext();
  const path = resolveMenuPath(code) ?? "#";
  return (
    <a
      href={path}
      onClick={(event) => {
        event.preventDefault();
        navigateByCode(code, { query });
      }}
    >
      {children}
    </a>
  );
}
