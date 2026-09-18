import type { MenuNode } from "@biugle/biu-router";

export type BiuEnvironment = "local" | "dev" | "test" | "pre" | "prod" | (string & {});

export interface BiuConfig {
  appId: string;
  /** Explicit project role. A portal owns navigation; an APP owns business pages. */
  projectType: "PORTAL" | "APP";
  environment?: BiuEnvironment;
  environmentConfigDir?: string;
  locale?: "zh-CN" | "en-US" | (string & {});
  locales?: Array<{ code: string; label: string }>;
  framework?: "react" | "vue" | "svelte" | "angular" | "html" | string;
  adapter?: string;
  buildPlugins?: unknown[];
  portal?: {
    code: string;
    menuRootCode?: string;
    permissionPrefix?: string;
  };
  layout?: {
    preset?: "sidebar" | "topbar" | "blank" | "dashboard" | "mobile" | "custom" | string;
    tabs?: boolean;
    breadcrumb?: boolean;
    brandLabel?: string;
    brandMark?: string;
    brandSubtitle?: string;
    systemOptions?: Array<{ code: string; label: string; url?: string }>;
    activeSystem?: string;
    user?: { name: string; role?: string; avatar?: string };
    notificationItems?: Array<{ id: string; title: string; description?: string; time?: string; read?: boolean }>;
    search?: boolean;
    showSearch?: boolean;
    showNotifications?: boolean;
    showStatus?: boolean;
    showTheme?: boolean;
    showTimezone?: boolean;
    showDirection?: boolean;
    toolbarIconOnly?: boolean;
    theme?: "light" | "dark" | "system";
    direction?: "ltr" | "rtl";
    timezone?: string;
    timezoneOptions?: Array<{ code: string; label: string }>;
    version?: string;
    appVersion?: string;
    menuMode?: "STANDARD" | "MULTI_LEVEL";
  };
  menu?: {
    portalTreeUrl?: string;
    directoryTreeUrl?: string;
    permissionCodesUrl?: string;
    rootCode?: string;
    fallback?: boolean;
    headers?: Record<string, string>;
    requestTimeoutMs?: number;
  };
  /** Optional local tree for offline development; remote menu data remains authoritative. */
  localMenuTree?: MenuNode[];
  auth?: {
    mode?: "SSO" | "NONE";
    authenticated?: boolean;
    enabled?: boolean;
    required?: boolean;
    loginRoute?: string;
    registerRoute?: string;
    profileRoute?: string;
    passwordRoute?: string;
    user?: {
      id?: string;
      name: string;
      role?: string;
      avatar?: string;
      roles?: string[];
      permissions?: string[];
      extra?: Record<string, unknown>;
    };
    loginUrl?: string;
    logoutUrl?: string;
  };
  routes?: { files?: string[] };
  dev?: {
    /** Explicit local port. When omitted, CLI allocates from the project-type range. */
    port?: number;
    /** Optional custom auto-allocation range, inclusive. */
    portRange?: { start: number; end: number };
  };
  remoteAppOrigins?: string[];
  /** Relative source module exporting runtime BiuPortalSlots for React portals. */
  portalSlots?: { source: string };
  /** React Custom mode may own the complete layout component. */
  customLayout?: { source: string };
  /** Optional runtime lifecycle/event bus configuration module. */
  runtimeHooks?: { source: string };
  localeUrl?: string;
  onLocaleChange?: (locale: string) => void;
  updateCheck?: { enabled?: boolean; manifestUrl?: string };
  /** Allowed Portal origins for an APP embedded with no referrer. */
  hostOrigins?: string[];
  remoteApps?: Record<
    string,
    {
      APP_URL: string;
      ALLOWED_ORIGINS?: string[];
      OVERLAY_MODE?: "IFRAME" | "WORKSPACE" | "FULLSCREEN";
    }
  >;
}

type DeepPartial<T> = {
  [Key in keyof T]?: T[Key] extends readonly unknown[] ? T[Key] : T[Key] extends object ? DeepPartial<T[Key]> : T[Key];
};

export type BiuEnvironmentConfig = DeepPartial<Omit<BiuConfig, "appId" | "environment">> & {
  appId?: string;
  environment?: BiuEnvironment;
};

export interface LocalRoute {
  code: string;
  type: "MENU";
  target: "APP" | "PORTAL";
  /** Optional semantic icon name used by the selected preset. */
  icon?: string;
  titleKey?: string;
  path?: string;
  permissionCode?: string;
  appId?: string;
  /** Child application path. Defaults to /<Code> when omitted. */
  appPath?: string;
  source: "APP" | "PORTAL";
}

export type { MenuNode } from "@biugle/biu-router";

export interface DiscoveryResult {
  config: BiuConfig;
  packageVersion?: string;
  routes: LocalRoute[];
  menus: MenuNode[];
  fallbackMenus: MenuNode[];
  selectedCodes: string[];
  homePage?: string;
}
