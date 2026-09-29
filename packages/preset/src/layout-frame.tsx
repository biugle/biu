import React, { useEffect, useRef, useState, type ReactNode } from "react";
import {
  defaultBiuLocales,
  menuPath,
  normalizeBiuDirection,
  normalizeBiuTheme,
  useBiuI18n,
  useBiuMenuStore,
  type BiuAccountPanelSubmit,
  type BiuLocale,
  type BiuMenuRecord,
  type MenuNode,
} from "@biugle/biu-runtime";
import {
  BreadcrumbTrail,
  displayVersion,
  Glyph,
  HeaderActionRail,
  HeaderMenuItem,
  HeaderPopover,
  MenuCollection,
  MenuRecordPopover,
  MenuSettingsButton,
  MultiLevelMenu,
  openMenuInNewTab,
  ScrollableNavigation,
  SearchPopover,
  label,
  menuLabelPath,
  menuNodeKey,
  type PresetContentProps,
} from "./layout-components.js";
import { CompactActionsPopover } from "./compact-actions.js";
import { SidebarHeaderControl } from "./sidebar-control.js";
import { tabPathParts } from "./tabs.js";
import { directoryKeysForMenu, useMenuScrollAnchors } from "./menu-scroll.js";
import { Dialog, Ellipsis, Tooltip, TooltipProvider } from "@biugle/react-components";
import "@biugle/react-components/styles.css";
import { PortalToolbarRail } from "./portal-toolbar.js";
import { TopbarMenuPopover } from "./topbar-menu.js";
import { createWatermark, type WatermarkOptions } from "@biugle/watermark";
import "./styles.css";

function WatermarkedLayout({
  className,
  options,
  fallbackText,
  children,
}: {
  className: string;
  options?: WatermarkOptions & { enabled?: boolean };
  fallbackText: string;
  children: ReactNode;
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const serializedOptions = JSON.stringify(options ?? null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !options) return;
    const { enabled, ...watermarkOptions } = options;
    if (enabled === false) return;
    const handle = createWatermark(target, {
      ...watermarkOptions,
      text: watermarkOptions.text ?? fallbackText,
    });
    return handle.destroy;
  }, [fallbackText, serializedOptions]);

  return (
    <div ref={targetRef} className={className}>
      {children}
    </div>
  );
}

export function LayoutFrame({
  className,
  children,
  locale,
  localeOptions,
  menus,
  selectedCode,
  selectedMenuKey,
  appName,
  portalCode,
  auth,
  currentTitle,
  breadcrumbItems,
  defaultHomeKey,
  tabs,
  breadcrumb,
  history,
  onSelect,
  onCloseTab,
  onRefreshTab,
  onOpenDirectory,
  overlay,
  onLocaleChange,
  onThemeChange,
  onDirectionChange,
  onReorderTabs,
  onCloseTabs,
  layoutOptions,
  layoutOverrides,
  onSystemChange,
  onUserAction,
  portalSlots,
  onLayoutOverrideChange,
}: PresetContentProps & { className: string }) {
  const { $t } = useBiuI18n();
  const appLabel = layoutOptions?.brandLabel || appName || $t("Biu 应用");
  const portalLabel = portalCode || $t("门户");
  const selected =
    history.find((item) => selectedMenuKey && menuNodeKey(item) === selectedMenuKey) ??
    history.find((item) => item.code === selectedCode);
  const topbar = className.includes("biu-topbar");
  const mobile = className.includes("biu-mobile");
  const compact = topbar || mobile;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const controlledSidebarHidden = layoutOverrides?.hideSidebar !== undefined && Boolean(onLayoutOverrideChange);
  const controlledSidebarCollapsed = layoutOverrides?.collapseSidebar !== undefined && Boolean(onLayoutOverrideChange);
  const effectiveSidebarHidden = controlledSidebarHidden ? layoutOverrides?.hideSidebar : sidebarHidden;
  const effectiveSidebarCollapsed = effectiveSidebarHidden
    ? false
    : controlledSidebarCollapsed
      ? layoutOverrides?.collapseSidebar
      : sidebarCollapsed;
  const [tabMenuKey, setTabMenuKey] = useState<string>();
  const [draggedKey, setDraggedKey] = useState<string>();
  const [dragOverKey, setDragOverKey] = useState<string>();
  const [dragOverPosition, setDragOverPosition] = useState<"BEFORE" | "AFTER">("AFTER");
  const pointerDragRef = useRef<
    | {
        key: string;
        pointerId: number;
        startX: number;
        startY: number;
        active: boolean;
        position: "BEFORE" | "AFTER";
      }
    | undefined
  >(undefined);
  const dragOverRef = useRef<{ key: string; position: "BEFORE" | "AFTER" } | undefined>(undefined);
  const suppressTabClickRef = useRef(false);
  const [tabMenuPosition, setTabMenuPosition] = useState<{
    left: number;
    top: number;
  }>();
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollTabs, setCanScrollTabs] = useState(false);
  const [accountPanel, setAccountPanel] = useState<"PROFILE" | "PASSWORD">();
  const accountSubmitRef = useRef<BiuAccountPanelSubmit | undefined>(undefined);
  const validLocaleOptions = (localeOptions ?? []).filter(
    (item) => typeof item.code === "string" && item.code.trim() && typeof item.label === "string" && item.label.trim(),
  );
  const languageOptions = validLocaleOptions.length ? validLocaleOptions : [...defaultBiuLocales];
  const user = layoutOptions?.user || {
    name: $t("团队用户"),
    role: $t("成员"),
  };
  const openAccountPanel = (action: "PROFILE" | "PASSWORD") => {
    const panel = action === "PROFILE" ? portalSlots?.profilePanel : portalSlots?.passwordPanel;
    if (panel) {
      accountSubmitRef.current = undefined;
      setAccountPanel(action);
    } else onUserAction?.(action);
  };
  const notificationItems = layoutOptions?.notificationItems ?? [];
  const systemOptions = (layoutOptions?.systemOptions ?? []).filter(
    (item) => typeof item.code === "string" && item.code.trim() && typeof item.label === "string" && item.label.trim(),
  );
  const activeTheme = normalizeBiuTheme(layoutOptions?.activeTheme ?? layoutOptions?.theme);
  const activeDirection = normalizeBiuDirection(layoutOptions?.activeDirection ?? layoutOptions?.direction);
  const menuMode = useBiuMenuStore((state) => state.menuMode);
  const showMenuTitle = useBiuMenuStore((state) => state.showMenuTitle);
  const setDirectoryScope = useBiuMenuStore((state) => state.setDirectoryScope);
  const tooltipOptions = { ...layoutOptions?.tooltip, onlyOverflow: layoutOptions?.tooltip?.onlyOverflow ?? true };
  const setSelectedGroupCode = useBiuMenuStore((state) => state.setSelectedGroupCode);
  const selectedGroupCode = useBiuMenuStore((state) => state.selectedGroupCode);
  const expandDirectories = useBiuMenuStore((state) => state.expandDirectories);
  const setStorageScope = useBiuMenuStore((state) => state.setStorageScope);
  const favorites = useBiuMenuStore((state) => state.favorites);
  const recent = useBiuMenuStore((state) => state.recent);
  const addRecent = useBiuMenuStore((state) => state.addRecent);
  const clearRecent = useBiuMenuStore((state) => state.clearRecent);
  const storeShowTopSearch = useBiuMenuStore((state) => state.showTopSearch);
  const showTopSearch = layoutOptions?.showTopSearch ?? storeShowTopSearch;
  const searchEnabled = layoutOptions?.showSearch !== false && layoutOptions?.search !== false;
  const toMenuRecord = (node: MenuNode): BiuMenuRecord => ({
    key: menuNodeKey(node),
    code: node.code,
    title: label(node, locale),
    titlePath: menuLabelPath(node, menus, locale),
    path: menuPath(node),
    target: node.target,
    appId: node.appId,
    appPath: node.appPath,
  });
  const recordToMenuNode = (record: BiuMenuRecord): MenuNode => ({
    code: record.code,
    type: "MENU",
    titleKey: record.title,
    path: record.path.startsWith("/") ? record.path : undefined,
    target: record.target || "PORTAL",
    appId: record.appId,
    appPath: record.appPath,
    meta: { __BIU_MENU_KEY: record.key },
  });
  const groupForMenu = (nodes: MenuNode[], targetKey: string, root?: MenuNode): MenuNode | undefined => {
    for (const node of nodes) {
      const currentRoot = root ?? (node.type === "DIRECTORY" ? node : undefined);
      if (menuNodeKey(node) === targetKey) return currentRoot;
      const match = node.children && groupForMenu(node.children, targetKey, currentRoot);
      if (match) return match;
    }
    return undefined;
  };
  const handleSelect = (node: MenuNode) => {
    if (menuMode === "MULTI_LEVEL" && !mobile) {
      const group = groupForMenu(menus, menuNodeKey(node));
      if (group) setSelectedGroupCode(menuNodeKey(group));
    }
    addRecent(toMenuRecord(node));
    onSelect(node);
  };
  useEffect(() => {
    setStorageScope(layoutOptions?.storageScope || portalCode || appName || "default");
  }, [appName, layoutOptions?.storageScope, portalCode, setStorageScope]);
  useEffect(() => {
    if (layoutOverrides?.hideSidebar !== undefined) setSidebarHidden(layoutOverrides.hideSidebar);
    if (layoutOverrides?.collapseSidebar !== undefined) setSidebarCollapsed(layoutOverrides.collapseSidebar);
  }, [layoutOverrides?.collapseSidebar, layoutOverrides?.hideSidebar]);
  useEffect(() => {
    // Multi-level layout narrows the registered menu scope to the selected first-level directory.
    if (menuMode !== "MULTI_LEVEL" || mobile) setDirectoryScope(menus);
  }, [menuMode, menus, mobile, setDirectoryScope]);
  useEffect(() => {
    if (menuMode !== "MULTI_LEVEL" || mobile || !selectedMenuKey) return;
    const group = groupForMenu(menus, selectedMenuKey);
    if (group) setSelectedGroupCode(menuNodeKey(group));
  }, [menuMode, mobile, menus, selectedMenuKey, setSelectedGroupCode]);
  useEffect(() => {
    if (!selectedMenuKey) return;
    expandDirectories(directoryKeysForMenu(menus, selectedMenuKey));
  }, [expandDirectories, menus, selectedMenuKey]);
  useEffect(() => {
    const finishPointerDrag = (event: PointerEvent) => {
      const drag = pointerDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (drag.active) {
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>(".biu-tab");
        const targetKey = dragOverRef.current?.key ?? target?.dataset.tabKey;
        const position = dragOverRef.current?.position ?? drag.position ?? dragOverPosition;
        if (targetKey && targetKey !== drag.key) onReorderTabs?.(drag.key, targetKey, position);
      }
      pointerDragRef.current = undefined;
      dragOverRef.current = undefined;
      setDraggedKey(undefined);
      setDragOverKey(undefined);
    };
    const cancelPointerDrag = () => {
      pointerDragRef.current = undefined;
      dragOverRef.current = undefined;
      setDraggedKey(undefined);
      setDragOverKey(undefined);
    };
    window.addEventListener("pointerup", finishPointerDrag, true);
    window.addEventListener("pointercancel", cancelPointerDrag, true);
    window.addEventListener("blur", cancelPointerDrag);
    return () => {
      window.removeEventListener("pointerup", finishPointerDrag, true);
      window.removeEventListener("pointercancel", cancelPointerDrag, true);
      window.removeEventListener("blur", cancelPointerDrag);
    };
  }, [dragOverPosition, onReorderTabs]);
  useEffect(() => {
    if (!tabs) return;
    const updateScrollState = () => {
      const element = tabsScrollRef.current;
      if (element) setCanScrollTabs(element.scrollWidth > element.clientWidth + 1);
    };
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [history.length, tabs]);
  useMenuScrollAnchors(selectedMenuKey, menuMode === "MULTI_LEVEL" && !mobile ? selectedGroupCode : undefined);
  useEffect(() => {
    if (!tabMenuKey) return;
    const closeMenu = () => {
      setTabMenuKey(undefined);
      setTabMenuPosition(undefined);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    const onWindowBlur = () => {
      if (document.activeElement instanceof HTMLIFrameElement) closeMenu();
    };
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [tabMenuKey]);
  const openTabMenu = (event: React.MouseEvent, key: string) => {
    event.preventDefault();
    setTabMenuKey(key);
    setTabMenuPosition({ left: event.clientX, top: event.clientY });
  };
  const closeTabMenu = () => {
    setTabMenuKey(undefined);
    setTabMenuPosition(undefined);
  };
  const runTabAction = (action: "REFRESH" | "LEFT" | "RIGHT" | "OTHERS" | "ALL", item: MenuNode) => {
    if (action === "REFRESH") {
      onSelect(item);
      onRefreshTab?.(item);
    }
    if (["LEFT", "RIGHT", "OTHERS", "ALL"].includes(action))
      onCloseTabs?.(action as "LEFT" | "RIGHT" | "OTHERS" | "ALL", item);
    closeTabMenu();
  };
  const setSidebarHiddenValue = (next: boolean) => {
    if (controlledSidebarHidden) {
      onLayoutOverrideChange?.({ hideSidebar: next });
      return;
    }
    setSidebarHidden(next);
  };
  const setSidebarCollapsedValue = (next: boolean) => {
    if (controlledSidebarCollapsed) {
      onLayoutOverrideChange?.({ collapseSidebar: next });
      return;
    }
    setSidebarCollapsed(next);
  };
  const toggleSidebarVisibility = () => {
    if (layoutOverrides?.lockSidebar) return;
    setSidebarHiddenValue(!effectiveSidebarHidden);
    setSidebarCollapsedValue(false);
  };
  const toggleSidebarCollapsed = () => {
    if (layoutOverrides?.lockSidebar || effectiveSidebarHidden) return;
    setSidebarCollapsedValue(!effectiveSidebarCollapsed);
  };
  const sidebarControl =
    !compact && effectiveSidebarHidden ? (
      <SidebarHeaderControl label={$t("恢复侧栏")} icon="forward" onClick={toggleSidebarVisibility} />
    ) : null;
  const headerLeadingActions = (
    <div className="biu-header-leading-actions">
      {(topbar || showTopSearch) && searchEnabled && (
        <SearchPopover menus={menus} locale={locale} onSelect={handleSelect} onOpenNewTab={openMenuInNewTab} />
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
                    openAccountPanel("PROFILE");
                    close();
                  }}
                >
                  {$t("个人信息")}
                </HeaderMenuItem>
                <HeaderMenuItem
                  icon={<Glyph name="settings" />}
                  onClick={() => {
                    openAccountPanel("PASSWORD");
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
  const activeSystem = systemOptions.find((item) => item.code === layoutOptions?.activeSystem);
  const accountPanelContent = accountPanel === "PROFILE" ? portalSlots?.profilePanel : portalSlots?.passwordPanel;
  const accountPanelTitle = accountPanel === "PROFILE" ? $t("个人信息") : $t("修改密码");
  const accountModal =
    accountPanel && accountPanelContent ? (
      <Dialog
        open
        title={accountPanelTitle}
        onOk={() => accountSubmitRef.current?.()}
        onOpenChange={(open) => {
          if (!open) {
            accountSubmitRef.current = undefined;
            setAccountPanel(undefined);
          }
        }}
      >
        {typeof accountPanelContent === "function"
          ? accountPanelContent(
              () => {
                accountSubmitRef.current = undefined;
                setAccountPanel(undefined);
              },
              (submit) => {
                accountSubmitRef.current = submit;
              },
            )
          : accountPanelContent}
      </Dialog>
    ) : null;
  const brandMark =
    effectiveSidebarCollapsed && activeSystem
      ? activeSystem.label.slice(-1).toUpperCase()
      : layoutOptions?.brandMark || appLabel.slice(0, 1).toUpperCase() || "B";
  const brand = (
    <div className="biu-brand">
      <span className="biu-brand-mark">{brandMark}</span>
      <span className="biu-brand-copy">
        <Ellipsis content={appLabel} lines={1} className="biu-brand-title" />
        <Ellipsis content={layoutOptions?.brandSubtitle || portalLabel} lines={1} className="biu-brand-subtitle" />
      </span>
      {systemOptions.length > 0 && (
        <HeaderPopover
          ariaLabel={$t("切换系统")}
          label={
            <>
              <Ellipsis
                content={systemOptions.find((item) => item.code === layoutOptions?.activeSystem)?.label || portalLabel}
                lines={1}
                className="biu-system-label"
              />
            </>
          }
          className="biu-system-switch"
        >
          {(close) =>
            systemOptions.map((option) => (
              <HeaderMenuItem
                key={option.code}
                active={option.code === layoutOptions?.activeSystem}
                onClick={() => {
                  onSystemChange?.(option);
                  close();
                }}
              >
                {option.label}
              </HeaderMenuItem>
            ))
          }
        </HeaderPopover>
      )}
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
      {!compact && <div className="biu-header-leading">{sidebarControl}</div>}
      {compact && brand}
      {topbar && <div className="biu-topbar-leading-actions">{headerLeadingActions}</div>}
      {topbar && (
        <TopbarMenuPopover
          menus={menus}
          selectedMenuKey={selectedMenuKey}
          onSelect={handleSelect}
          onOpenDirectory={onOpenDirectory}
          locale={locale}
        />
      )}
      {topbar && (
        <ScrollableNavigation
          menus={menus}
          selectedCode={selectedCode}
          selectedMenuKey={selectedMenuKey}
          onSelect={handleSelect}
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
  const scrollTabs = (direction: "BACK" | "FORWARD") =>
    tabsScrollRef.current?.scrollBy({
      left: direction === "BACK" ? -180 : 180,
      behavior: "smooth",
    });
  const hasClosableTab = history.some((item) => menuNodeKey(item) !== defaultHomeKey);
  const tabBar =
    tabs && !layoutOverrides?.hideTabs && history.length > 0 ? (
      <div className="biu-tabs-bar" role="tablist" aria-label={$t("打开页面")}>
        <div ref={tabsScrollRef} className="biu-tabs-scroll" data-biu-menu-scroll="tabs">
          {history.map((item) => {
            const isActive = selectedMenuKey ? menuNodeKey(item) === selectedMenuKey : item.code === selectedCode;
            const itemKey = menuNodeKey(item);
            const itemPathParts = tabPathParts(portalLabel, item, menus, locale);
            const itemPath = itemPathParts.at(-1) ?? label(item, locale);
            const itemFullPath = itemPathParts.join(" / ");
            const isDefaultHome = itemKey === defaultHomeKey;
            const isDragged = itemKey === draggedKey;
            const isDropTarget = itemKey === dragOverKey && itemKey !== draggedKey;
            return (
              <div
                key={menuNodeKey(item)}
                className={`biu-tab${isActive ? " biu-tab-active" : ""}${isDragged ? " biu-tab-dragging" : ""}${isDropTarget ? ` biu-tab-drag-over biu-tab-drop-${dragOverPosition.toLowerCase()}` : ""}`}
                role="presentation"
                aria-selected={isActive}
                data-tab-key={itemKey}
                data-biu-menu-key={itemKey}
                draggable
                onContextMenu={(event) => openTabMenu(event, itemKey)}
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", itemKey);
                  event.dataTransfer.effectAllowed = "move";
                  setDraggedKey(itemKey);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  const target = event.currentTarget.getBoundingClientRect();
                  const position = event.clientX < target.left + target.width / 2 ? "BEFORE" : "AFTER";
                  dragOverRef.current = { key: itemKey, position };
                  setDragOverKey(itemKey);
                  setDragOverPosition(position);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromKey = event.dataTransfer.getData("text/plain") || draggedKey;
                  const targetKey = itemKey;
                  const target = event.currentTarget.getBoundingClientRect();
                  const position = event.clientX < target.left + target.width / 2 ? "BEFORE" : "AFTER";
                  if (fromKey && fromKey !== targetKey) onReorderTabs?.(fromKey, targetKey, position);
                  pointerDragRef.current = undefined;
                  dragOverRef.current = undefined;
                  setDraggedKey(undefined);
                  setDragOverKey(undefined);
                }}
                onDragEnd={() => {
                  pointerDragRef.current = undefined;
                  dragOverRef.current = undefined;
                  suppressTabClickRef.current = false;
                  setDraggedKey(undefined);
                  setDragOverKey(undefined);
                }}
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  suppressTabClickRef.current = false;
                  pointerDragRef.current = {
                    key: itemKey,
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startY: event.clientY,
                    active: false,
                    position: "AFTER",
                  };
                }}
                onPointerMove={(event) => {
                  const drag = pointerDragRef.current;
                  if (!drag || drag.pointerId !== event.pointerId) return;
                  if (!drag.active && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 4) return;
                  drag.active = true;
                  event.currentTarget.setPointerCapture?.(event.pointerId);
                  suppressTabClickRef.current = true;
                  setDraggedKey(drag.key);
                  const target = document
                    .elementFromPoint(event.clientX, event.clientY)
                    ?.closest<HTMLElement>(".biu-tab");
                  const targetKey = target?.dataset.tabKey;
                  if (!target || !targetKey || targetKey === drag.key) return;
                  const rect = target.getBoundingClientRect();
                  const position = event.clientX < rect.left + rect.width / 2 ? "BEFORE" : "AFTER";
                  drag.position = position;
                  dragOverRef.current = { key: targetKey, position };
                  setDragOverKey(targetKey);
                  setDragOverPosition(position);
                }}
                onPointerUp={(event) => {
                  const drag = pointerDragRef.current;
                  if (!drag || drag.pointerId !== event.pointerId) return;
                  if (drag.active) {
                    const target = document
                      .elementFromPoint(event.clientX, event.clientY)
                      ?.closest<HTMLElement>(".biu-tab");
                    const targetKey = target?.dataset.tabKey;
                    if (targetKey && targetKey !== drag.key)
                      onReorderTabs?.(drag.key, targetKey, drag.position || dragOverPosition);
                    event.preventDefault();
                  }
                  pointerDragRef.current = undefined;
                  dragOverRef.current = undefined;
                  setDraggedKey(undefined);
                  setDragOverKey(undefined);
                  event.currentTarget.releasePointerCapture?.(event.pointerId);
                }}
                onPointerCancel={() => {
                  pointerDragRef.current = undefined;
                  dragOverRef.current = undefined;
                  setDraggedKey(undefined);
                  setDragOverKey(undefined);
                }}
              >
                <span className="biu-tab-drag-handle" aria-hidden="true">
                  <Glyph name="grip" />
                </span>
                <button
                  type="button"
                  className="biu-tab-main"
                  role="tab"
                  aria-selected={isActive}
                  onClick={(event) => {
                    if (suppressTabClickRef.current) {
                      suppressTabClickRef.current = false;
                      event.preventDefault();
                      return;
                    }
                    handleSelect(item);
                  }}
                >
                  <span className="biu-tab-label biu-tab-label-desktop">
                    <Ellipsis
                      content={itemPath}
                      tooltipContent={itemFullPath}
                      lines={1}
                      alwaysTooltip
                      className="biu-tab-path-current"
                    />
                  </span>
                  <span className="biu-tab-label biu-tab-label-mobile">
                    <Ellipsis
                      content={itemPath}
                      tooltipContent={itemFullPath}
                      lines={1}
                      alwaysTooltip
                      className="biu-tab-path-current"
                    />
                  </span>
                </button>
                <Tooltip
                  content={isDefaultHome ? $t("默认首页不可关闭") : $t("关闭当前页")}
                  onlyOverflow={false}
                  className="biu-tab-close-tooltip"
                >
                  <button
                    type="button"
                    className="biu-tab-close"
                    aria-label={`${$t("关闭当前页")} ${label(item, locale)}`}
                    disabled={isDefaultHome}
                    onClick={(event) => {
                      event.stopPropagation();
                      onCloseTab?.(item);
                    }}
                  >
                    <Glyph name="close" />
                  </button>
                </Tooltip>
              </div>
            );
          })}
        </div>
        {canScrollTabs && (
          <div className="biu-tabs-toolbar-group biu-tabs-scroll-tools">
            <button
              type="button"
              className="biu-tabs-tool"
              aria-label={$t("向左滚动标签")}
              onClick={() => scrollTabs("BACK")}
            >
              <Glyph name="back" />
            </button>
            <button
              type="button"
              className="biu-tabs-tool"
              aria-label={$t("向右滚动标签")}
              onClick={() => scrollTabs("FORWARD")}
            >
              <Glyph name="forward" />
            </button>
          </div>
        )}
        <div className="biu-tabs-toolbar-group">
          <button
            type="button"
            className="biu-tabs-tool"
            aria-label={$t("刷新当前页")}
            disabled={!selected || !onRefreshTab}
            onClick={() => selected && onRefreshTab?.(selected)}
          >
            <Tooltip content={$t("刷新当前页")} onlyOverflow={false}>
              <Glyph name="refresh" />
            </Tooltip>
          </button>
          <button
            type="button"
            className="biu-tabs-tool"
            aria-label={$t("刷新整个页面")}
            onClick={() => window.location.reload()}
          >
            <Tooltip content={$t("刷新整个页面")} onlyOverflow={false}>
              <Glyph name="reload" />
            </Tooltip>
          </button>
          <button
            type="button"
            className="biu-tabs-tool"
            aria-label={$t("关闭全部页签")}
            disabled={!selected || !onCloseTabs || !hasClosableTab}
            onClick={() => selected && onCloseTabs?.("ALL", selected)}
          >
            <Tooltip content={$t("关闭全部页签")} onlyOverflow={false}>
              <Glyph name="close" />
            </Tooltip>
          </button>
        </div>
        {tabMenuKey &&
          tabMenuPosition &&
          (() => {
            const item = history.find((entry) => menuNodeKey(entry) === tabMenuKey);
            if (!item) return null;
            const index = history.findIndex((entry) => menuNodeKey(entry) === menuNodeKey(item));
            const isClosable = (entry: MenuNode) => menuNodeKey(entry) !== defaultHomeKey;
            const leftClosable = history.slice(0, index).some(isClosable);
            const rightClosable = history.slice(index + 1).some(isClosable);
            const otherClosable = history.some(
              (entry) => menuNodeKey(entry) !== menuNodeKey(item) && isClosable(entry),
            );
            const currentClosable = isClosable(item);
            return (
              <div
                className="biu-tab-context-menu"
                role="menu"
                aria-label={`${label(item, locale)} ${$t("页签操作")}`}
                style={{ left: tabMenuPosition.left, top: tabMenuPosition.top }}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <button role="menuitem" type="button" onClick={() => runTabAction("REFRESH", item)}>
                  {$t("刷新当前页")}
                </button>
                <div role="separator" />
                <button
                  role="menuitem"
                  type="button"
                  disabled={!leftClosable}
                  onClick={() => runTabAction("LEFT", item)}
                >
                  {$t("关闭左侧标签")}
                </button>
                <button
                  role="menuitem"
                  type="button"
                  disabled={!rightClosable}
                  onClick={() => runTabAction("RIGHT", item)}
                >
                  {$t("关闭右侧标签")}
                </button>
                <button
                  role="menuitem"
                  type="button"
                  disabled={!otherClosable}
                  onClick={() => runTabAction("OTHERS", item)}
                >
                  {$t("关闭其他标签")}
                </button>
                <div role="separator" />
                <button
                  role="menuitem"
                  type="button"
                  disabled={!onCloseTab || !currentClosable}
                  onClick={() => {
                    onCloseTab?.(item);
                    closeTabMenu();
                  }}
                >
                  {$t("关闭当前页")}
                </button>
              </div>
            );
          })()}
      </div>
    ) : null;
  const breadcrumbTrail = (breadcrumbItems?.length ? breadcrumbItems : selected ? [selected] : []).filter(
    (item, index) => !(index === 0 && (item.code === portalCode || label(item, locale) === portalLabel)),
  );
  const content = (
    <main className={`biu-content${selected?.target === "APP" ? " biu-content-app" : ""}`}>
      {breadcrumb && !layoutOverrides?.hideBreadcrumb && (
        <div className="biu-breadcrumb" aria-label={$t("面包屑导航")}>
          <BreadcrumbTrail
            portalLabel={portalLabel}
            items={breadcrumbTrail}
            currentTitle={currentTitle}
            locale={locale}
          />
        </div>
      )}
      {tabBar}
      <div className={`biu-page-content${selected?.target === "APP" ? " biu-page-content-app" : ""}`}>{children}</div>
    </main>
  );
  const sidebarFooter = (
    <div className="biu-sidebar-footer">
      {!effectiveSidebarCollapsed && (
        <MenuSettingsButton
          onExpandMenu={() => {
            setSidebarHiddenValue(false);
            setSidebarCollapsedValue(false);
          }}
          onCollapseMenu={() => {
            setSidebarHiddenValue(false);
            setSidebarCollapsedValue(true);
          }}
          onHideMenu={() => {
            setSidebarHiddenValue(true);
            setSidebarCollapsedValue(false);
          }}
        />
      )}
      {!effectiveSidebarCollapsed && (
        <MenuRecordPopover
          kind="FAVORITES"
          records={favorites}
          menus={menus}
          locale={locale}
          onSelect={(record) => handleSelect(recordToMenuNode(record))}
          onOpenNewTab={(record) => openMenuInNewTab(recordToMenuNode(record))}
        />
      )}
      {!effectiveSidebarCollapsed && (
        <MenuRecordPopover
          kind="RECENT"
          records={recent}
          menus={menus}
          locale={locale}
          onSelect={(record) => handleSelect(recordToMenuNode(record))}
          onOpenNewTab={(record) => openMenuInNewTab(recordToMenuNode(record))}
          onClear={clearRecent}
          onOpenAll={() => recent.forEach((record) => openMenuInNewTab(recordToMenuNode(record)))}
        />
      )}
      {!effectiveSidebarCollapsed && !showTopSearch && searchEnabled && (
        <SearchPopover menus={menus} locale={locale} onSelect={handleSelect} onOpenNewTab={openMenuInNewTab} />
      )}
      <button
        type="button"
        className="biu-sidebar-footer-action"
        aria-expanded={!effectiveSidebarCollapsed}
        aria-label={effectiveSidebarCollapsed ? $t("展开侧栏") : $t("收起侧栏")}
        onClick={toggleSidebarCollapsed}
        disabled={layoutOverrides?.lockSidebar}
      >
        <Tooltip content={effectiveSidebarCollapsed ? $t("展开侧栏") : $t("收起侧栏")} onlyOverflow={false}>
          <Glyph name={effectiveSidebarCollapsed ? "forward" : "back"} />
        </Tooltip>
      </button>
    </div>
  );
  const overlayClass = overlay?.ACTIVE ? ` biu-overlay-${overlay.MODE.toLowerCase()}` : "";
  const hostMask = overlay?.ACTIVE ? (
    <div className="biu-host-chrome-mask" role="presentation" aria-label={$t("子应用操作进行中")} />
  ) : null;
  if (className.includes("biu-blank"))
    return (
      <TooltipProvider {...tooltipOptions}>
        <WatermarkedLayout
          className={`biu-layout ${className}${overlayClass}`}
          options={layoutOptions?.watermark}
          fallbackText={appLabel}
        >
          {content}
          {hostMask}
          {accountModal}
        </WatermarkedLayout>
      </TooltipProvider>
    );
  if (topbar)
    return (
      <TooltipProvider {...tooltipOptions}>
        <WatermarkedLayout
          className={`biu-layout ${className}${overlayClass}`}
          options={layoutOptions?.watermark}
          fallbackText={appLabel}
        >
          {header}
          <div className="biu-topbar-menu">
            <MenuCollection
              menus={menus}
              selectedCode={selectedCode}
              selectedMenuKey={selectedMenuKey}
              onSelect={handleSelect}
              onOpenDirectory={onOpenDirectory}
              locale={locale}
              horizontal
            />
          </div>
          {content}
          {hostMask}
          {accountModal}
        </WatermarkedLayout>
      </TooltipProvider>
    );
  if (mobile)
    return (
      <TooltipProvider {...tooltipOptions}>
        <WatermarkedLayout
          className={`biu-layout ${className}${overlayClass}`}
          options={layoutOptions?.watermark}
          fallbackText={appLabel}
        >
          {header}
          {content}
          <div className="biu-mobile-menu">
            <MenuCollection
              menus={menus}
              selectedCode={selectedCode}
              selectedMenuKey={selectedMenuKey}
              onSelect={handleSelect}
              onOpenDirectory={onOpenDirectory}
              locale={locale}
              horizontal
            />
          </div>
          {hostMask}
          {accountModal}
        </WatermarkedLayout>
      </TooltipProvider>
    );
  return (
    <TooltipProvider {...tooltipOptions}>
      <WatermarkedLayout
        className={`biu-layout ${className}${effectiveSidebarCollapsed ? " biu-sidebar-collapsed" : ""}${effectiveSidebarHidden ? " biu-sidebar-hidden" : ""}${menuMode === "MULTI_LEVEL" && !showMenuTitle ? " biu-menu-title-hidden" : ""}${overlayClass}`}
        options={layoutOptions?.watermark}
        fallbackText={appLabel}
      >
        <div className="biu-body">
          <aside className="biu-sidebar" aria-hidden={effectiveSidebarHidden || undefined}>
            <div className="biu-sidebar-brand">{brand}</div>
            <div
              data-biu-menu-scroll={menuMode === "MULTI_LEVEL" && !mobile ? undefined : "menu"}
              className={`biu-sidebar-scroll${menuMode === "MULTI_LEVEL" && !mobile ? " biu-sidebar-scroll-multi" : ""}`}
            >
              {menuMode === "MULTI_LEVEL" && !mobile ? (
                <MultiLevelMenu
                  menus={menus}
                  selectedCode={selectedCode}
                  selectedMenuKey={selectedMenuKey}
                  onSelect={handleSelect}
                  onOpenDirectory={onOpenDirectory}
                  locale={locale}
                  collapsed={effectiveSidebarCollapsed}
                />
              ) : (
                <MenuCollection
                  menus={menus}
                  selectedCode={selectedCode}
                  selectedMenuKey={selectedMenuKey}
                  onSelect={handleSelect}
                  onOpenDirectory={onOpenDirectory}
                  locale={locale}
                />
              )}
            </div>
            {sidebarFooter}
          </aside>
          <div className="biu-main">
            {header}
            {content}
          </div>
        </div>
        {hostMask}
        {accountModal}
      </WatermarkedLayout>
    </TooltipProvider>
  );
}
