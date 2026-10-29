import type { ReactNode } from "react";
import {
  defaultBiuLocales,
  normalizeBiuDirection,
  normalizeBiuTheme,
  useBiuI18n,
  type BiuLocale,
} from "@biugle/biu-runtime";
import { Ellipsis } from "@biugle/react-components";
import {
  displayVersion,
  Glyph,
  HeaderActionRail,
  HeaderMenuItem,
  HeaderPopover,
  openMenuInNewTab,
  ScrollableNavigation,
  SearchPopover,
  type PresetContentProps,
} from "./layout-components.js";
import { CompactActionsPopover } from "./compact-actions.js";
import { PortalToolbarRail } from "./portal-toolbar.js";
import { TopbarMenuPopover } from "./topbar-menu.js";

type LayoutHeaderProps = Pick<
  PresetContentProps,
  | "locale"
  | "localeOptions"
  | "menus"
  | "selectedCode"
  | "selectedMenuKey"
  | "portalCode"
  | "auth"
  | "onSelect"
  | "onOpenDirectory"
  | "onLocaleChange"
  | "onThemeChange"
  | "onDirectionChange"
  | "onUserAction"
  | "layoutOptions"
  | "portalSlots"
> & {
  className: string;
  showTopSearch: boolean;
  searchEnabled: boolean;
  onOpenAccountPanel: (action: "PROFILE" | "PASSWORD") => void;
  brand: ReactNode;
};

export function LayoutHeader({
  className,
  locale,
  localeOptions,
  menus,
  selectedCode,
  selectedMenuKey,
  portalCode,
  auth,
  onSelect,
  onOpenDirectory,
  onLocaleChange,
  onThemeChange,
  onDirectionChange,
  onUserAction,
  layoutOptions,
  portalSlots,
  showTopSearch,
  searchEnabled,
  onOpenAccountPanel,
  brand,
}: LayoutHeaderProps) {
  const { $t } = useBiuI18n();
  const topbar = className.includes("biu-topbar");
  const mobile = className.includes("biu-mobile");
  const compact = topbar || mobile;
  const portalLabel = portalCode || $t("门户");
  const validLocaleOptions = (localeOptions ?? []).filter(
    (item) => typeof item.code === "string" && item.code.trim() && typeof item.label === "string" && item.label.trim(),
  );
  const languageOptions = validLocaleOptions.length ? validLocaleOptions : [...defaultBiuLocales];
  const user = layoutOptions?.user || {
    name: $t("团队用户"),
    role: $t("成员"),
  };
  const notificationItems = layoutOptions?.notificationItems ?? [];
  const activeTheme = normalizeBiuTheme(layoutOptions?.activeTheme ?? layoutOptions?.theme);
  const activeDirection = normalizeBiuDirection(layoutOptions?.activeDirection ?? layoutOptions?.direction);
  const headerLeadingActions = (
    <div className="biu-header-leading-actions">
      {(topbar || showTopSearch) && searchEnabled && (
        <SearchPopover menus={menus} locale={locale} onSelect={onSelect} onOpenNewTab={openMenuInNewTab} />
      )}
      {layoutOptions?.showNotifications !== false && (
        <HeaderPopover
          ariaLabel={$t("通知")}
          className="biu-header-action-notification"
          label={
            <span className="biu-icon-wrap">
              <Glyph name="bell" />
              {notificationItems.filter((item) => !item.read).length > 0 && <i className="biu-notification-dot" />}
            </span>
          }
        >
          {(close) => (
            <div className="biu-notification-panel">
              <div className="biu-popover-title">
                <strong>{$t("通知")}</strong>
                <span>{notificationItems.filter((item) => !item.read).length}</span>
              </div>
              {notificationItems.length ? (
                notificationItems.map((item) => (
                  <button
                    className={`biu-notification-item${item.read ? " biu-notification-read" : ""}`}
                    key={item.id}
                    type="button"
                    onClick={close}
                  >
                    <Ellipsis content={item.title} lines={1} className="biu-notification-title" />
                    {item.description && (
                      <Ellipsis content={item.description} lines={1} className="biu-notification-description" />
                    )}
                    {item.time && <small>{item.time}</small>}
                  </button>
                ))
              ) : (
                <div className="biu-notification-empty">
                  <Glyph name="bell" />
                  <span>{$t("暂无通知")}</span>
                </div>
              )}
            </div>
          )}
        </HeaderPopover>
      )}
    </div>
  );
  const userPopover = (
    <div className="biu-header-user-area">
      <HeaderPopover
        ariaLabel={$t("用户菜单")}
        className="biu-user-switch biu-header-action-user"
        label={
          <>
            <span className="biu-user-avatar">{(user.name || "U").slice(0, 1).toUpperCase()}</span>
            <Ellipsis content={user.name} lines={1} className="biu-action-text biu-user-name" />
          </>
        }
      >
        {(close) => (
          <div className="biu-user-panel">
            <div className="biu-user-summary">
              <span className="biu-user-avatar biu-user-avatar-large">
                {(user.name || "U").slice(0, 1).toUpperCase()}
              </span>
              <span>
                <Ellipsis content={user.name} lines={1} className="biu-user-summary-name" />
                <Ellipsis content={user.role || portalLabel} lines={1} className="biu-user-summary-role" />
              </span>
            </div>
            <div className="biu-menu-divider" />
            {auth?.authenticated ? (
              <>
                <HeaderMenuItem
                  icon={<Glyph name="user" />}
                  onClick={() => {
                    onOpenAccountPanel("PROFILE");
                    close();
                  }}
                >
                  {$t("个人信息")}
                </HeaderMenuItem>
                <HeaderMenuItem
                  icon={<Glyph name="settings" />}
                  onClick={() => {
                    onOpenAccountPanel("PASSWORD");
                    close();
                  }}
                >
                  {$t("修改密码")}
                </HeaderMenuItem>
                <HeaderMenuItem
                  icon={<Glyph name="logout" />}
                  danger
                  onClick={() => {
                    onUserAction?.("LOGOUT");
                    close();
                  }}
                >
                  {$t("退出登录")}
                </HeaderMenuItem>
              </>
            ) : (
              <>
                <HeaderMenuItem
                  icon={<Glyph name="user" />}
                  onClick={() => {
                    onUserAction?.("LOGIN");
                    close();
                  }}
                >
                  {$t("登录")}
                </HeaderMenuItem>
                <HeaderMenuItem
                  icon={<Glyph name="user" />}
                  onClick={() => {
                    onUserAction?.("REGISTER");
                    close();
                  }}
                >
                  {$t("注册")}
                </HeaderMenuItem>
              </>
            )}
            <div className="biu-user-version" aria-label={$t("版本信息")}>
              <span className="biu-user-version-item">
                <small>V</small>
                {displayVersion(layoutOptions?.version, "V")?.slice(1) ?? "-"}
              </span>
              <span className="biu-user-version-item">
                <small>S</small>
                {displayVersion(layoutOptions?.appVersion, "S")?.slice(1) ?? "-"}
              </span>
            </div>
          </div>
        )}
      </HeaderPopover>
    </div>
  );
  const headerActionsDefault = (
    <HeaderActionRail
      className={`biu-header-actions-rail-right${layoutOptions?.toolbarIconOnly ? " biu-toolbar-icons-only" : ""}`}
    >
      <HeaderPopover
        ariaLabel={$t("语言")}
        className="biu-header-action-locale"
        label={
          <>
            <Glyph name="language" />
            <span className="biu-action-text">
              {languageOptions.find((item) => item.code === locale)?.label || locale}
            </span>
          </>
        }
      >
        {(close) =>
          languageOptions.map((option) => (
            <HeaderMenuItem
              key={option.code}
              active={option.code === locale}
              onClick={() => {
                onLocaleChange?.(option.code as BiuLocale);
                close();
              }}
            >
              {option.label}
            </HeaderMenuItem>
          ))
        }
      </HeaderPopover>
      {layoutOptions?.showDirection !== false && (
        <HeaderPopover
          ariaLabel={$t("界面方向")}
          className="biu-header-action-direction"
          label={
            <>
              <Glyph name="direction" />
              <span className="biu-action-text biu-direction-value">{activeDirection.toUpperCase()}</span>
            </>
          }
        >
          {(close) => (
            <>
              <HeaderMenuItem
                key="ltr"
                icon={<Glyph name="direction" />}
                active={activeDirection === "ltr"}
                onClick={() => {
                  onDirectionChange?.("ltr");
                  close();
                }}
              >
                {$t("从左到右")}
              </HeaderMenuItem>
              <HeaderMenuItem
                key="rtl"
                icon={<Glyph name="direction" />}
                active={activeDirection === "rtl"}
                onClick={() => {
                  onDirectionChange?.("rtl");
                  close();
                }}
              >
                {$t("从右到左")}
              </HeaderMenuItem>
            </>
          )}
        </HeaderPopover>
      )}
      {layoutOptions?.showTheme !== false && (
        <HeaderPopover ariaLabel={$t("主题")} className="biu-header-action-theme" label={<Glyph name="theme" />}>
          {(close) => (
            <>
              <HeaderMenuItem
                key="light"
                icon={<Glyph name="sun" />}
                active={activeTheme === "light"}
                onClick={() => {
                  onThemeChange?.("light");
                  close();
                }}
              >
                {$t("浅色")}
              </HeaderMenuItem>
              <HeaderMenuItem
                key="dark"
                icon={<Glyph name="moon" />}
                active={activeTheme === "dark"}
                onClick={() => {
                  onThemeChange?.("dark");
                  close();
                }}
              >
                {$t("深色")}
              </HeaderMenuItem>
              <HeaderMenuItem
                key="system"
                icon={<Glyph name="monitor" />}
                active={activeTheme === "system"}
                onClick={() => {
                  onThemeChange?.("system");
                  close();
                }}
              >
                {$t("跟随系统")}
              </HeaderMenuItem>
            </>
          )}
        </HeaderPopover>
      )}
      <CompactActionsPopover
        locale={locale}
        languageOptions={languageOptions}
        activeDirection={activeDirection}
        activeTheme={activeTheme}
        onLocaleChange={onLocaleChange}
        onDirectionChange={onDirectionChange}
        onThemeChange={onThemeChange}
        customActions={portalSlots?.toolbarActions}
      />
    </HeaderActionRail>
  );
  const customToolbar = portalSlots?.replaceToolbar ? (
    portalSlots.toolbar
  ) : (
    <PortalToolbarRail slots={portalSlots} iconOnly={layoutOptions?.toolbarIconOnly} />
  );
  const customToolbarSlot = customToolbar ? <span className="biu-header-custom-slot">{customToolbar}</span> : null;
  const header = (
    <header className="biu-header">
      {compact && brand}
      {topbar && <div className="biu-topbar-leading-actions">{headerLeadingActions}</div>}
      {topbar && (
        <TopbarMenuPopover
          menus={menus}
          selectedMenuKey={selectedMenuKey}
          onSelect={onSelect}
          onOpenDirectory={onOpenDirectory}
          locale={locale}
        />
      )}
      {topbar && (
        <ScrollableNavigation
          menus={menus}
          selectedCode={selectedCode}
          selectedMenuKey={selectedMenuKey}
          onSelect={onSelect}
          onOpenDirectory={onOpenDirectory}
          locale={locale}
        />
      )}
      {topbar && (
        <div className="biu-topbar-workbar">
          <div className="biu-portal-workbar">{portalSlots?.workbar}</div>
        </div>
      )}
      {topbar && (
        <div className="biu-topbar-tools">
          {customToolbarSlot}
          {!portalSlots?.replaceToolbar && headerActionsDefault}
        </div>
      )}
      {!topbar && (
        <div className="biu-header-leading-cluster">
          {headerLeadingActions}
          <div className="biu-portal-workbar">{portalSlots?.workbar}</div>
        </div>
      )}
      <div className="biu-header-spacer" />
      {!topbar && customToolbarSlot}
      {!topbar && !portalSlots?.replaceToolbar && headerActionsDefault}
      {userPopover}
    </header>
  );
  return header;
}
