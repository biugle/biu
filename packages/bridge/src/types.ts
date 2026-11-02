import type { BiuLocale } from "@biugle/biu-i18n";

export type BiuBridgeTheme = "light" | "dark" | "system";
export type BiuBridgeDirection = "ltr" | "rtl";

export interface BiuBridgeUser {
  name: string;
  role?: string;
  avatar?: string;
  id?: string;
  roles?: string[];
  permissions?: string[];
  extra?: Record<string, unknown>;
}

export interface BiuBridgeAuthContext {
  mode: "SSO" | "NONE";
  authenticated: boolean;
  user?: BiuBridgeUser;
}

export type BiuBridgeOverlayMode = "IFRAME" | "WORKSPACE" | "FULLSCREEN";
export type BiuBridgeOverlayScope = "IFRAME" | "HOST_CHROME" | "WORKSPACE";

export interface BiuBridgeOverlayState {
  ID: string;
  OPEN: boolean;
  MODE?: BiuBridgeOverlayMode;
  SCOPE?: BiuBridgeOverlayScope;
}

export interface BiuHostContextPayload {
  PORTAL_CODE?: string;
  ENVIRONMENT?: string;
  LOCALE?: BiuLocale;
  THEME?: BiuBridgeTheme;
  DIRECTION?: BiuBridgeDirection;
  TIMEZONE?: string;
  CURRENT_CODE?: string;
  /** Whether this APP route is currently selected by its host Portal. */
  HOST_ACTIVE?: boolean;
  AUTH?: BiuBridgeAuthContext;
}

export interface BiuBridgeMessage {
  CHANNEL: "BIU";
  TYPE: string;
  APP_ID?: string;
  PAYLOAD?: unknown;
  [key: string]: unknown;
}
