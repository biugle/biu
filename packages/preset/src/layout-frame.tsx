import React, { useEffect, useRef, useState } from "react";
import { menuPath, type BiuMenuRecord, type MenuNode } from "@biugle/biu-router";
import { useBiuI18n } from "@biugle/biu-runtime";
import { useBiuMenuStore } from "@biugle/biu-store";
import {
  BreadcrumbTrail,
  Glyph,
  MenuCollection,
  MultiLevelMenu,
  openMenuInNewTab,
  label,
  menuLabelPath,
  menuNodeKey,
  type PresetContentProps,
} from "./layout-components.js";
import { SidebarHeaderControl } from "./sidebar-control.js";
import { tabPathParts } from "./tabs.js";
import { directoryKeysForMenu, useMenuScrollAnchors } from "./menu-scroll.js";
import { Ellipsis, Tooltip, TooltipProvider } from "@biugle/react-components";
import "@biugle/react-components/styles.css";
import { LayoutBrand } from "./layout-brand.js";
import { LayoutAccountPanel } from "./layout-account-panel.js";
import { LayoutHeader } from "./layout-header.js";
import { LayoutSidebarFooter } from "./layout-sidebar-footer.js";
import { WatermarkedLayout } from "./layout-watermarked.js";

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
  const layoutDirection = layoutOptions?.activeDirection ?? layoutOptions?.direction ?? "ltr";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const controlledSidebarHidden = layoutOverrides?.hideSidebar !== undefined && Boolean(onLayoutOverrideChange);
  const controlledSidebarCollapsed = layoutOverrides?.collapseSidebar !== undefined && Boolean(onLayoutOverrideChange);
  const effectiveSidebarHidden = controlledSidebarHidden ? layoutOverrides?.hideSidebar : sidebarHidden;
  const effectiveSidebarCollapsed = Boolean(
    effectiveSidebarHidden ? false : controlledSidebarCollapsed ? layoutOverrides?.collapseSidebar : sidebarCollapsed,
  );
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
  const openAccountPanel = (action: "PROFILE" | "PASSWORD") => {
    const panel = action === "PROFILE" ? portalSlots?.profilePanel : portalSlots?.passwordPanel;
    if (panel) setAccountPanel(action);
    else onUserAction?.(action);
  };
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
  const showTopSearch = Boolean(layoutOptions?.showTopSearch ?? storeShowTopSearch);
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
  const setSidebarPresentation = (hideSidebar: boolean, collapseSidebar: boolean) => {
    if (layoutOverrides?.lockSidebar) return;

    // Keep controlled and local values aligned so hiding never leaves a stale minimized state behind.
    const controlledOverrides: { hideSidebar?: boolean; collapseSidebar?: boolean } = {};
    if (controlledSidebarHidden) controlledOverrides.hideSidebar = hideSidebar;
    else setSidebarHidden(hideSidebar);
    if (controlledSidebarCollapsed) controlledOverrides.collapseSidebar = collapseSidebar;
    else setSidebarCollapsed(collapseSidebar);
    if (Object.keys(controlledOverrides).length > 0) onLayoutOverrideChange?.(controlledOverrides);
  };
  const toggleSidebarControl = () => {
    // A hidden or minimized sidebar always restores to its full-width state.
    const restoreToExpanded = effectiveSidebarHidden || effectiveSidebarCollapsed;
    setSidebarPresentation(false, !restoreToExpanded);
  };
  const sidebarControl = !compact ? (
    <SidebarHeaderControl
      label={effectiveSidebarHidden || effectiveSidebarCollapsed ? $t("展开菜单栏") : $t("折叠菜单栏")}
      icon={effectiveSidebarHidden || effectiveSidebarCollapsed ? "forward" : "back"}
      expanded={!effectiveSidebarHidden && !effectiveSidebarCollapsed}
      disabled={Boolean(layoutOverrides?.lockSidebar)}
      onClick={toggleSidebarControl}
    />
  ) : null;

  const accountModal = (
    <LayoutAccountPanel panel={accountPanel} portalSlots={portalSlots} onClose={() => setAccountPanel(undefined)} />
  );

  const brand = (
    <LayoutBrand
      layoutOptions={layoutOptions}
      appLabel={appLabel}
      portalLabel={portalLabel}
      effectiveSidebarCollapsed={effectiveSidebarCollapsed}
      onSystemChange={onSystemChange}
    />
  );
  const header = (
    <LayoutHeader
      className={className}
      locale={locale}
      localeOptions={localeOptions}
      menus={menus}
      selectedCode={selectedCode}
      selectedMenuKey={selectedMenuKey}
      portalCode={portalCode}
      auth={auth}
      onSelect={handleSelect}
      onOpenDirectory={onOpenDirectory}
      onLocaleChange={onLocaleChange}
      onThemeChange={onThemeChange}
      onDirectionChange={onDirectionChange}
      onUserAction={onUserAction}
      layoutOptions={layoutOptions}
      portalSlots={portalSlots}
      showTopSearch={showTopSearch}
      searchEnabled={searchEnabled}
      onOpenAccountPanel={openAccountPanel}
      brand={brand}
    />
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
      <div className={`biu-page-content${selected?.target === "APP" ? " biu-page-content-app" : ""}`} dir="ltr">
        {children}
      </div>
    </main>
  );

  const sidebarFooter = (
    <LayoutSidebarFooter
      menus={menus}
      locale={locale}
      layoutOverrides={layoutOverrides}
      effectiveSidebarCollapsed={effectiveSidebarCollapsed}
      collapsedControl={sidebarControl}
      favorites={favorites}
      recent={recent}
      clearRecent={clearRecent}
      recordToMenuNode={recordToMenuNode}
      handleSelect={handleSelect}
      openMenuInNewTab={openMenuInNewTab}
      showTopSearch={showTopSearch}
      searchEnabled={searchEnabled}
      onExpandMenu={() => setSidebarPresentation(false, false)}
      onCollapseMenu={() => setSidebarPresentation(false, true)}
      onHideMenu={() => setSidebarPresentation(true, false)}
    />
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
          dir={layoutDirection}
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
          dir={layoutDirection}
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
              direction={layoutDirection}
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
          dir={layoutDirection}
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
              direction={layoutDirection}
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
        dir={layoutDirection}
        options={layoutOptions?.watermark}
        fallbackText={appLabel}
      >
        <div className="biu-body">
          <aside
            id="biu-sidebar-navigation"
            className="biu-sidebar"
            aria-hidden={effectiveSidebarHidden || undefined}
            inert={effectiveSidebarHidden || undefined}
          >
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
                  direction={layoutDirection}
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
                  direction={layoutDirection}
                />
              )}
            </div>
            {sidebarFooter}
          </aside>
          {/* Hidden navigation restores from the outside; the 60px rail uses its single footer control. */}
          {!effectiveSidebarCollapsed && sidebarControl}
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
