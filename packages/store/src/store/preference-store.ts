import { create } from "zustand";
import type { BiuAuthContext, BiuDirection, BiuTheme } from "../types.js";
import { normalizeBiuLocale, type BiuLocale } from "@biugle/biu-i18n";
import { normalizeBiuDirection, normalizeBiuTheme, normalizeBiuTimezone } from "../config.js";
import { useBiuAuthStore } from "./auth-store.js";

export interface BiuPreferenceState {
  storageScope: string;
  locale: BiuLocale;
  theme: BiuTheme;
  direction: BiuDirection;
  timezone: string;
  /** Compatibility view of useBiuAuthStore.context; identity is never persisted here. */
  auth?: BiuAuthContext;
  setLocale: (locale: BiuLocale) => void;
  setTheme: (theme: BiuTheme) => void;
  setDirection: (direction: BiuDirection) => void;
  setTimezone: (timezone: string) => void;
  setStorageScope: (scope: string) => void;
  setAuth: (auth?: BiuAuthContext) => void;
  initialize: (
    values: Partial<Pick<BiuPreferenceState, "locale" | "theme" | "direction" | "timezone" | "auth">>,
    scope?: string,
  ) => void;
}

type PersistedPreferenceState = Pick<BiuPreferenceState, "locale" | "theme" | "direction" | "timezone">;
const PREFERENCE_SESSION_PREFIX = "BIU_PREFERENCES_SESSION:";

function storageKey(scope: string) {
  return `${PREFERENCE_SESSION_PREFIX}${encodeURIComponent(scope.trim() || "default")}`;
}

function readStored(scope: string): Partial<PersistedPreferenceState> {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(
      window.sessionStorage.getItem(storageKey(scope)) || "null",
    ) as Partial<PersistedPreferenceState> | null;
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return {
      locale: value.locale === undefined ? undefined : normalizeBiuLocale(value.locale),
      theme: value.theme === undefined ? undefined : normalizeBiuTheme(value.theme, "light"),
      direction: value.direction === undefined ? undefined : normalizeBiuDirection(value.direction, "ltr"),
      timezone: value.timezone === undefined ? undefined : normalizeBiuTimezone(value.timezone),
    };
  } catch {
    return {};
  }
}

function writeStored(scope: string, value: PersistedPreferenceState) {
  if (typeof window === "undefined") return;
  try {
    const { locale, theme, direction, timezone } = value;
    window.sessionStorage.setItem(storageKey(scope), JSON.stringify({ locale, theme, direction, timezone }));
  } catch {
    // Private mode and quota failures must not interrupt preference changes.
  }
}

function normalizeScope(scope?: string) {
  return scope?.trim() || "default";
}

/** Runtime preferences persist for the current browser tab and are scoped by portal/environment. */
export const useBiuPreferenceStore = create<BiuPreferenceState>((set) => ({
  storageScope: "default",
  locale: "zh-CN",
  theme: "light",
  direction: "ltr",
  timezone: "Asia/Shanghai",
  auth: useBiuAuthStore.getState().context,
  setLocale: (locale) =>
    set((state) => {
      const normalizedLocale = normalizeBiuLocale(locale);
      const next = { ...state, locale: normalizedLocale };
      writeStored(state.storageScope, next);
      return { locale: normalizedLocale };
    }),
  setTheme: (theme) =>
    set((state) => {
      const next = { ...state, theme: normalizeBiuTheme(theme) };
      writeStored(state.storageScope, next);
      return { theme: next.theme };
    }),
  setDirection: (direction) =>
    set((state) => {
      const next = { ...state, direction: normalizeBiuDirection(direction) };
      writeStored(state.storageScope, next);
      return { direction: next.direction };
    }),
  setTimezone: (timezone) =>
    set((state) => {
      const next = { ...state, timezone: normalizeBiuTimezone(timezone) };
      writeStored(state.storageScope, next);
      return { timezone: next.timezone };
    }),
  setStorageScope: (scope) =>
    set((state) => {
      const storageScope = normalizeScope(scope);
      if (state.storageScope === storageScope) return state;
      const stored = readStored(storageScope);
      return {
        storageScope,
        locale: normalizeBiuLocale(stored.locale),
        theme: normalizeBiuTheme(stored.theme),
        direction: normalizeBiuDirection(stored.direction),
        timezone: normalizeBiuTimezone(stored.timezone),
      };
    }),
  setAuth: (auth) => useBiuAuthStore.getState().setContext(auth),
  initialize: (values, scope) => {
    const storageScope = normalizeScope(scope);
    const stored = readStored(storageScope);
    useBiuPreferenceStore.setState({
      ...values,
      locale: normalizeBiuLocale(stored.locale ?? values.locale),
      theme: normalizeBiuTheme(stored.theme ?? values.theme),
      direction: normalizeBiuDirection(stored.direction ?? values.direction),
      timezone: normalizeBiuTimezone(stored.timezone ?? values.timezone),
      storageScope,
    });
  },
}));

// The auth store owns identity. This one-way projection keeps the old bound
// preference hook/getState/subscribe surface readable without a second source.
const setPreferenceState = useBiuPreferenceStore.setState;
interface LegacyPreferenceUpdate {
  state: Partial<BiuPreferenceState>;
  replace?: boolean;
  applied: boolean;
}
let pendingPreferenceUpdate: LegacyPreferenceUpdate | undefined;
function applyPreferenceUpdate(state: Partial<BiuPreferenceState>, replace?: boolean) {
  if (replace) setPreferenceState(state as BiuPreferenceState, true);
  else setPreferenceState(state);
}
useBiuAuthStore.subscribe(({ context }) => {
  const pending = pendingPreferenceUpdate;
  pendingPreferenceUpdate = undefined;
  if (pending) {
    pending.applied = true;
    applyPreferenceUpdate({ ...pending.state, auth: context }, pending.replace);
  } else if (!Object.is(useBiuPreferenceStore.getState().auth, context)) setPreferenceState({ auth: context });
});

// Existing integrations also wrote auth through the bound store's raw setter.
// Resolve their updater once, forward identity to its owner, then apply only
// preference changes. The projection above uses the original setter, so these
// writes never create a subscription cycle.
useBiuPreferenceStore.setState = ((
  partial:
    | BiuPreferenceState
    | Partial<BiuPreferenceState>
    | ((state: BiuPreferenceState) => BiuPreferenceState | Partial<BiuPreferenceState>),
  replace?: boolean,
) => {
  const next = typeof partial === "function" ? partial(useBiuPreferenceStore.getState()) : partial;
  if (!replace && Object.is(next, useBiuPreferenceStore.getState())) return;
  if (Object.hasOwn(next, "auth")) {
    const context = useBiuAuthStore.getState().context;
    if (!replace && Object.keys(next).length === 1 && Object.is(next.auth, context)) return;
    // Let the owner's projection apply identity and preference fields together
    // so legacy raw setters retain their single-notification behavior.
    const update: LegacyPreferenceUpdate = { state: next, replace, applied: false };
    pendingPreferenceUpdate = update;
    try {
      useBiuAuthStore.getState().setContext(next.auth);
      if (!update.applied) {
        pendingPreferenceUpdate = undefined;
        applyPreferenceUpdate({ ...next, auth: useBiuAuthStore.getState().context }, replace);
      }
    } finally {
      if (pendingPreferenceUpdate === update) pendingPreferenceUpdate = undefined;
    }
    return;
  }
  applyPreferenceUpdate({ ...next, auth: useBiuAuthStore.getState().context }, replace);
}) as typeof useBiuPreferenceStore.setState;

export const useBiuStore = useBiuPreferenceStore;
export const useBiuLocale = () => useBiuPreferenceStore((state) => state.locale);
export const useBiuTheme = () => useBiuPreferenceStore((state) => state.theme);
export const useBiuTimezone = () => useBiuPreferenceStore((state) => state.timezone);
export const useBiuDirection = () => useBiuPreferenceStore((state) => state.direction);
export const useBiuAuth = () => useBiuAuthStore((state) => state.context);
