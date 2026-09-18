import type { ComponentType, ReactNode } from "react";
import type { BiuEventBus } from "@biugle/biu-events";
import type { BiuRuntimeMenuConfig, MenuNode, MenuTarget } from "@biugle/biu-router";
import type { BiuAuthContext, BiuAuthUser, BiuDirection, BiuLayoutUser, BiuTheme } from "@biugle/biu-store";
import type { BiuTooltipOptions } from "@biugle/biu-ui";
export type { BiuEventBus, BiuEventEnvelope } from "@biugle/biu-events";
export type { BiuMenuRecord, BiuRuntimeMenuConfig, MenuNode, MenuTarget } from "@biugle/biu-router";
export type { BiuAuthContext, BiuAuthUser, BiuDirection, BiuLayoutUser, BiuTheme } from "@biugle/biu-store";
export type LayoutPreset = "sidebar" | "topbar" | "blank" | "dashboard" | "mobile" | "custom";
export interface BiuLayoutOption {
  code: string;
  label: string;
  url?: string;
}

export interface BiuAuthConfig {
  mode?: "SSO" | "NONE";
  authenticated?: boolean;
  /** Disable foundation auth affordances for a fully custom application. */
  enabled?: boolean;
  /** Allow the runtime to use its configured login fallback when required. */
  required?: boolean;
  loginRoute?: string;
  registerRoute?: string;
  profileRoute?: string;
  passwordRoute?: string;
  user?: BiuAuthUser;
  loginUrl?: string;
  logoutUrl?: string;
}

export type BiuShellLifecycleEvent = "MOUNT" | "UNMOUNT";
type BiuNavigationLifecyclePhase = "BEFORE" | "AFTER" | "ERROR";

export interface BiuNavigationLifecycle {
  phase: BiuNavigationLifecyclePhase;
  from?: { code?: string; key?: string; path?: string };
  to: { code: string; key: string; path: string };
  query?: string;
  error?: unknown;
}

export interface BiuLifecycleHooks {
  onShellLifecycle?: (event: BiuShellLifecycleEvent) => void;
  onNavigation?: (event: BiuNavigationLifecycle) => boolean | void;
}

export type BiuAuthPageMode = "LOGIN" | "REGISTER";

export interface BiuAuthPageProps {
  mode: BiuAuthPageMode;
  onModeChange: (mode: BiuAuthPageMode) => void;
}

export type BiuAccountPanel = ReactNode | ((close: () => void) => ReactNode);

export interface BiuNotification {
  id: string;
  title: string;
  description?: string;
  time?: string;
  read?: boolean;
}

export interface BiuTimezoneOption {
  code: string;
  label: string;
}

export interface BiuLayoutOptions {
  /** Session/local storage namespace; normally generated from portal and environment. */
  storageScope?: string;
  brandLabel?: string;
  brandMark?: string;
  brandSubtitle?: string;
  systemOptions?: BiuLayoutOption[];
  activeSystem?: string;
  user?: BiuLayoutUser;
  notificationItems?: BiuNotification[];
  search?: boolean;
  showSearch?: boolean;
  showTopSearch?: boolean;
  showNotifications?: boolean;
  showStatus?: boolean;
  showTheme?: boolean;
  showTimezone?: boolean;
  showDirection?: boolean;
  /** Portal-specific preference: keep the desktop toolbar icon-only. */
  toolbarIconOnly?: boolean;
  theme?: BiuTheme;
  direction?: BiuDirection;
  timezone?: string;
  timezoneOptions?: BiuTimezoneOption[];
  activeTheme?: BiuTheme;
  activeDirection?: BiuDirection;
  activeTimezone?: string;
  version?: string;
  appVersion?: string;
  menuMode?: "STANDARD" | "MULTI_LEVEL";
  tooltip?: BiuTooltipOptions;
}

export interface BiuPortalSlots {
  /** Reserved host area between navigation and global tools. */
  workbar?: ReactNode;
  /** Portal-owned tools can replace or extend the foundation tools. */
  toolbar?: ReactNode;
  /** Standardized tools rendered in the desktop rail and compact mobile menu. */
  toolbarActions?: BiuPortalToolbarAction[];
  replaceToolbar?: boolean;
  /** Optional custom no-chrome authentication page. Login/register share one view. */
  authPage?: ComponentType<BiuAuthPageProps>;
  /** Optional account panels opened by the foundation user menu as modals. */
  profilePanel?: BiuAccountPanel;
  passwordPanel?: BiuAccountPanel;
}

export interface BiuPortalToolbarAction {
  code: string;
  /** Static text or a value derived from the current runtime context. */
  label: string | ((context: BiuToolbarActionContext) => ReactNode);
  /** Optional foundation i18n key for a stable portal-provided label. */
  labelKey?: string;
  icon?: ReactNode;
  tooltip?: string;
  /** Optional foundation i18n key for the action tooltip. */
  tooltipKey?: string;
  /** Optional live value appended after the translated label. */
  value?: (context: BiuToolbarActionContext) => ReactNode;
  /** A menu body receives the close callback; omit it for a direct action. */
  content?: ReactNode | ((close: () => void) => ReactNode);
  onClick?: () => void;
  mobile?: "SHOW" | "HIDE";
}

export interface BiuToolbarActionContext {
  locale?: BiuLocale;
  portalCode?: string;
  theme?: BiuTheme;
  direction?: BiuDirection;
  timezone?: string;
}

export interface BiuLayoutOverrides {
  hideSidebar?: boolean;
  collapseSidebar?: boolean;
  lockSidebar?: boolean;
  hideTabs?: boolean;
  hideBreadcrumb?: boolean;
}

export interface RouteEntry {
  code: string;
  type: "MENU";
  target: MenuTarget;
  titleKey?: string;
  path?: string;
  permissionCode?: string;
  source: "APP" | "PORTAL";
  appId?: string;
  appPath?: string;
}

export type BiuOverlayMode = "IFRAME" | "WORKSPACE" | "FULLSCREEN";
export type BiuOverlayScope = "IFRAME" | "HOST_CHROME" | "WORKSPACE";

export interface BiuRemoteAppConfig {
  APP_URL: string;
  ALLOWED_ORIGINS?: string[];
  OVERLAY_MODE?: BiuOverlayMode;
}

export type BiuAppLoadMode = "IFRAME" | (string & {});
export type BiuRemoteAppLifecycleEvent = "LOAD_START" | "READY" | "ERROR" | "UNLOAD";

export interface BiuRemoteAppResolvedConfig {
  allowedOrigins?: string[];
  overlayMode: BiuOverlayMode;
}

export interface BiuRemoteAppLifecycle {
  EVENT: BiuRemoteAppLifecycleEvent;
  MODE: BiuAppLoadMode;
  APP_ID?: string;
  CODE: string;
  URL?: string;
  ERROR?: string;
}

export interface BiuRemoteAppLoaderProps {
  node: MenuNode;
  config: BiuRuntimeConfig;
  locale: BiuLocale;
  theme: BiuTheme;
  direction: BiuDirection;
  timezone: string;
  environment?: string;
  remote: BiuRemoteAppResolvedConfig;
  url?: string;
  targetOrigin: string;
  onOverlayChange: (state?: BiuHostOverlayState) => void;
  onVersionChange?: (version: string) => void;
  onLifecycle: (event: BiuRemoteAppLifecycleEvent, error?: string) => void;
}

export interface BiuRemoteAppLoader {
  mode: BiuAppLoadMode;
  Component: ComponentType<BiuRemoteAppLoaderProps>;
}

export interface BiuOverlayState {
  ID: string;
  OPEN: boolean;
  MODE?: BiuOverlayMode;
  SCOPE?: BiuOverlayScope;
}

export interface BiuHostOverlayState {
  APP_ID: string;
  ACTIVE: boolean;
  MODE: BiuOverlayMode;
}

export interface LayoutContentProps {
  children: ReactNode;
  locale?: BiuLocale;
  localeOptions?: BiuLocaleOption[];
  menus: MenuNode[];
  selectedCode?: string;
  /** Stable tree-path identity; unlike Code it distinguishes repeated menu nodes. */
  selectedMenuKey?: string;
  appName?: string;
  portalCode?: string;
  auth?: BiuAuthContext;
  currentTitle?: string;
  /** Full directory-to-page trail; the preset renders it without guessing from URLs. */
  breadcrumbItems?: MenuNode[];
  tabs?: boolean;
  breadcrumb?: boolean;
  /** Stable key of the application's protected root/home menu. */
  defaultHomeKey?: string;
  history: MenuNode[];
  onSelect: (menu: MenuNode) => void;
  onCloseTab?: (menu: MenuNode) => void;
  onRefreshTab?: (menu: MenuNode) => void;
  onOpenDirectory?: (menu: MenuNode) => void;
  overlay?: BiuHostOverlayState;
  onLocaleChange?: (locale: BiuLocale) => void;
  onThemeChange?: (theme: BiuTheme) => void;
  onDirectionChange?: (direction: BiuDirection) => void;
  onTimezoneChange?: (timezone: string) => void;
  onReorderTabs?: (fromKey: string, toKey: string, position?: "BEFORE" | "AFTER") => void;
  onCloseTabs?: (action: "LEFT" | "RIGHT" | "OTHERS" | "ALL", menu: MenuNode) => void;
  layoutOptions?: BiuLayoutOptions;
  onSystemChange?: (option: BiuLayoutOption) => void;
  onUserAction?: (action: "PROFILE" | "PASSWORD" | "LOGIN" | "REGISTER" | "LOGOUT") => void;
  layoutOverrides?: BiuLayoutOverrides;
  portalSlots?: BiuPortalSlots;
}

export interface BiuPageContext {
  appId: string;
  environment?: string;
  locale?: BiuLocale;
  portalCode?: string;
  theme?: BiuTheme;
  direction?: BiuDirection;
  timezone?: string;
  auth?: BiuAuthContext;
  code: string;
}

export type BiuPageCleanup = () => void | Promise<void>;

export interface BiuFrameworkAdapter {
  framework: string;
  loadPage?(module: unknown, context: BiuPageContext): unknown | Promise<unknown>;
  renderPage(
    container: Element,
    page: unknown,
    context: BiuPageContext,
  ): void | BiuPageCleanup | Promise<void | BiuPageCleanup>;
  unmountPage?(container: Element, context: BiuPageContext): void | Promise<void>;
}

export type BiuPageLoader = () => Promise<unknown>;

export interface BiuRuntimeConfig {
  appId: string;
  /** Build/package version shown in the official user menu. */
  version?: string;
  projectType?: "PORTAL" | "APP";
  environment?: string;
  locale?: BiuLocale;
  locales?: BiuLocaleOption[];
  portalCode?: string;
  menuRootCode?: string;
  menu?: BiuRuntimeMenuConfig;
  allowMenuFallback?: boolean;
  layout?: BiuLayoutOptions & {
    preset?: LayoutPreset | string;
    tabs?: boolean;
    breadcrumb?: boolean;
  };
  layoutComponent?: ComponentType<LayoutContentProps>;
  portalSlots?: BiuPortalSlots;
  localeUrl?: string;
  /** Called after a normalized locale is selected; menu/i18n reloads are runtime-managed. */
  onLocaleChange?: (locale: BiuLocale) => void;
  lifecycle?: BiuLifecycleHooks;
  eventBus?: BiuEventBus;
  remoteAppOrigins?: string[];
  hostOrigins?: string[];
  auth?: BiuAuthConfig;
  onAuthAction?: (action: "LOGIN" | "LOGOUT" | "REFRESH", origin: string) => void;
  onUserAction?: (action: "PROFILE" | "PASSWORD" | "LOGIN" | "REGISTER" | "LOGOUT", origin: string) => void;
  remoteApps?: Record<string, BiuRemoteAppConfig>;
  remoteAppLoader?: BiuRemoteAppLoader;
  updateCheck?: {
    enabled?: boolean;
    manifestUrl?: string;
  };
  onRemoteAppLifecycle?: (event: BiuRemoteAppLifecycle) => void;
  onMonitorEvent?: (event: BiuMonitorEvent) => void;
  framework?: string;
  pageAdapter?: BiuFrameworkAdapter;
  fallbackMenus?: MenuNode[];
  routes: RouteEntry[];
  pageRegistry: Record<string, BiuPageLoader>;
  /** Generated from src/pages/index.<framework>; the application's root page. */
  homePage?: ComponentType<any>;
  homePageLoader?: BiuPageLoader;
}

export interface BiuMonitorEvent {
  TYPE: "ERROR" | "NAVIGATION" | "REMOTE_APP";
  APP_ID: string;
  CODE?: string;
  MESSAGE?: string;
  ERROR?: unknown;
  META?: Record<string, unknown>;
}

export interface BiuContextValue {
  appId: string;
  environment?: string;
  locale?: BiuLocale;
  portalCode?: string;
  theme?: BiuTheme;
  direction?: BiuDirection;
  timezone?: string;
  currentCode?: string;
  currentTarget?: MenuTarget;
  currentPath?: string;
  hostOrigin?: string;
  permissionCodes?: ReadonlySet<string>;
  auth?: BiuAuthContext;
  requestAuth: (action: "LOGIN" | "LOGOUT" | "REFRESH") => void;
  login: () => void;
  logout: () => void;
  refreshAuth: () => void;
  setAuth: (auth?: BiuAuthContext) => void;
  navigateByCode: (code: string, options?: { replace?: boolean; query?: string | Record<string, string> }) => boolean;
  navigateByKey: (key: string, options?: { replace?: boolean; query?: string | Record<string, string> }) => boolean;
  resolveMenuPath: (code: string, key?: string) => string | undefined;
  navigate: (path: string, options?: { replace?: boolean; query?: string | Record<string, string> }) => boolean;
  layoutOverrides: BiuLayoutOverrides;
  setLayoutOverrides: (overrides: BiuLayoutOverrides) => void;
  resetLayoutOverrides: () => void;
  setLocale: (locale: BiuLocale) => void;
  /** Reload the active portal menu tree with the current locale. */
  reloadMenus: (locale?: BiuLocale) => void;
  /** Reload the configured locale resource for the current locale. */
  reloadLocale: (locale?: BiuLocale) => void;
  setTheme: (theme: BiuTheme) => void;
  setDirection: (direction: BiuDirection) => void;
  setTimezone: (timezone: string) => void;
  events: BiuEventBus;
}
import type { BiuLocale, BiuLocaleOption } from "@biugle/biu-i18n";
