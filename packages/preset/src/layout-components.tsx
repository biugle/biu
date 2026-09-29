import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  i18n,
  menuPath,
  useBiuI18n,
  useBiuMenuStore,
  type BiuLocale,
  type BiuMenuRecord,
  type LayoutContentProps,
  type MenuNode,
} from "@biugle/biu-runtime";
import { Ellipsis, Popover, Tooltip } from "@biugle/react-components";
import {
  ArrowLeftRight,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  ChevronUp,
  Clock3,
  Contrast,
  ExternalLink,
  FileText,
  FolderKanban,
  GripVertical,
  History,
  Languages,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Moon,
  Monitor,
  PanelsTopLeft,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  Star,
  Sun,
  UserRound,
  X,
  type LucideIcon,
} from "@biugle/icons";
export type PresetContentProps = LayoutContentProps;
/** The shell intentionally renders at most five visible menu levels. */
export const MAX_MENU_DEPTH = 5;
export function label(node: MenuNode, locale?: BiuLocale) {
  return i18n.$t(node.titleKey ?? node.code, undefined, locale);
}
export function menuNodeKey(node: MenuNode, parentKey = "") {
  const value = node.meta?.__BIU_MENU_KEY;
  if (parentKey) return `${parentKey}/${node.code}`;
  return typeof value === "string" && value ? value : node.code;
}
/** Build the human-readable menu hierarchy without changing the stable route key. */
export function menuLabelPath(node: MenuNode, menus: MenuNode[], locale?: BiuLocale) {
  const trail: string[] = [];
  const visit = (nodes: MenuNode[], parents: string[]) => {
    for (const item of nodes) {
      const syntheticRoot = item.meta?.__BIU_SYNTHETIC_ROOT === true;
      const next = syntheticRoot ? parents : [...parents, label(item, locale)];
      if (item === node || menuNodeKey(item) === menuNodeKey(node)) {
        trail.push(...next);
        return true;
      }
      if (item.children && visit(item.children, next)) return true;
    }
    return false;
  };
  visit(menus, []);
  return trail.join(" / ") || label(node, locale);
}
function menuLabelPathByKey(key: string, menus: MenuNode[], locale?: BiuLocale) {
  const find = (nodes: MenuNode[]): MenuNode | undefined => {
    for (const node of nodes) {
      if (menuNodeKey(node) === key) return node;
      const child = node.children && find(node.children);
      if (child) return child;
    }
    return undefined;
  };
  const node = find(menus);
  return node ? menuLabelPath(node, menus, locale) : undefined;
}
export function BreadcrumbTrail({
  items,
  currentTitle,
  locale,
}: {
  portalLabel: string;
  items: MenuNode[];
  currentTitle?: string;
  locale?: BiuLocale;
}) {
  const pathLabels = items.map((item, index) =>
    index === items.length - 1 && currentTitle ? currentTitle : label(item, locale),
  );
  const fullPath = pathLabels.join(" / ");
  return fullPath ? (
    <span className="biu-breadcrumb-path">
      <Ellipsis content={fullPath} lines={1} className="biu-breadcrumb-tooltip" />
    </span>
  ) : null;
}
export function displayVersion(value: string | undefined, prefix: "V" | "S") {
  const source = value?.trim();
  if (!source) return undefined;
  return source.toUpperCase().startsWith(prefix) ? source : `${prefix}${source}`;
}
const glyphs: Record<string, LucideIcon> = {
  brand: Boxes,
  search: Search,
  bell: Bell,
  user: UserRound,
  settings: Settings2,
  logout: LogOut,
  chevron: ChevronDown,
  directoryCollapsed: ChevronRight,
  directoryExpanded: ChevronDown,
  systemSelect: ChevronsDown,
  newTab: ExternalLink,
  sun: Sun,
  moon: Moon,
  monitor: Monitor,
  theme: Contrast,
  language: Languages,
  clock: Clock3,
  direction: ArrowLeftRight,
  check: Check,
  portal: LayoutDashboard,
  dashboard: LayoutDashboard,
  records: ListChecks,
  workspace: FolderKanban,
  center: PanelsTopLeft,
  about: Boxes,
  folder: FolderKanban,
  page: FileText,
  back: ChevronLeft,
  forward: ChevronRight,
  refresh: RefreshCw,
  reload: RotateCcw,
  close: X,
  grip: GripVertical,
  up: ChevronUp,
  down: ChevronDown,
  favorite: Star,
  history: History,
  menu: Menu,
};
export function Glyph({ name }: { name: keyof typeof glyphs }) {
  const Icon = glyphs[name];
  return <Icon className="biu-icon" strokeWidth={1.8} aria-hidden="true" />;
}
function resolveDirectoryGlyph(node: Pick<MenuNode, "icon">) {
  const explicit = node.icon?.toLowerCase();
  if (explicit && explicit in glyphs) return explicit as keyof typeof glyphs;
  return "folder" as const;
}
export function openMenuInNewTab(node: MenuNode) {
  const path = node.path?.startsWith("/") ? node.path : `/${node.code}`;
  window.open(`${window.location.origin}${path}`, "_blank", "noopener,noreferrer");
}
function MenuItem({
  node,
  selectedCode,
  selectedMenuKey,
  onSelect,
  onOpenDirectory,
  locale,
  level = 0,
  showDirectoryIcon = true,
  nodeKey,
  horizontal = false,
}: {
  node: MenuNode;
  selectedCode?: string;
  selectedMenuKey?: string;
  onSelect: (menu: MenuNode) => void;
  onOpenDirectory?: (menu: MenuNode) => void;
  locale?: BiuLocale;
  level?: number;
  showDirectoryIcon?: boolean;
  nodeKey?: string;
  horizontal?: boolean;
}) {
  const currentKey = nodeKey ?? menuNodeKey(node);
  const isSelected = selectedMenuKey ? selectedMenuKey === currentKey : selectedCode === node.code;
  const expanded = useBiuMenuStore((state) => state.isExpanded(currentKey));
  const toggleDirectory = useBiuMenuStore((state) => state.toggleDirectory);
  const favorite = useBiuMenuStore((state) => state.isFavorite(currentKey));
  const toggleFavorite = useBiuMenuStore((state) => state.toggleFavorite);
  const { $t } = useBiuI18n();
  const canNest = level < MAX_MENU_DEPTH - 1;
  const hasChildren = node.type === "DIRECTORY" && canNest && Boolean(node.children?.length);
  if (horizontal && node.type === "DIRECTORY") {
    return (
      <HeaderPopover
        ariaLabel={label(node, locale)}
        className="biu-top-menu-directory"
        dataMenuKey={currentKey}
        label={<Ellipsis content={label(node, locale)} lines={1} className="biu-menu-label" />}
      >
        {(close) => (
          <HorizontalMenuChildren
            nodes={node.children ?? []}
            parentKey={currentKey}
            locale={locale}
            onOpenDirectory={onOpenDirectory}
            onSelect={(child) => {
              onSelect(child);
              close();
            }}
          />
        )}
      </HeaderPopover>
    );
  }
  if (node.type === "DIRECTORY")
    return (
      <section className="biu-menu-directory" data-level={level}>
        <button
          className="biu-menu-directory-title"
          type="button"
          data-biu-menu-key={currentKey}
          aria-expanded={hasChildren ? expanded : undefined}
          onClick={() => {
            onOpenDirectory?.(node);
            if (hasChildren) toggleDirectory(currentKey);
          }}
        >
          {showDirectoryIcon && (
            <span className="biu-menu-icon biu-menu-icon-directory">
              <Glyph name={resolveDirectoryGlyph(node)} />
            </span>
          )}
          <Ellipsis content={label(node, locale)} lines={1} className="biu-menu-label" />
          {hasChildren ? (
            <span className="biu-menu-chevron" aria-hidden="true">
              <Glyph name={expanded ? "directoryExpanded" : "directoryCollapsed"} />
            </span>
          ) : null}
        </button>
        <div
          className={`biu-menu-children${hasChildren && expanded ? "" : " biu-menu-children-collapsed"}`}
          aria-hidden={!hasChildren || !expanded}
        >
          <div className="biu-menu-children-inner">
            {canNest
              ? (node.children ?? []).map((child) => (
                  <MenuItem
                    key={menuNodeKey(child, currentKey)}
                    node={child}
                    selectedCode={selectedCode}
                    selectedMenuKey={selectedMenuKey}
                    onSelect={onSelect}
                    onOpenDirectory={onOpenDirectory}
                    locale={locale}
                    level={level + 1}
                    showDirectoryIcon={showDirectoryIcon}
                    nodeKey={menuNodeKey(child, currentKey)}
                  />
                ))
              : null}
          </div>
        </div>
      </section>
    );
  return (
    <div
      className={`biu-menu-item-wrap${isSelected ? " biu-menu-item-wrap-active" : ""}`}
      data-biu-menu-key={currentKey}
    >
      <button
        className={`biu-menu-item${isSelected ? " biu-menu-item-active" : ""}`}
        type="button"
        onClick={() => onSelect(node)}
      >
        {!horizontal && (
          <span className="biu-menu-icon biu-menu-item-collapsed-icon">
            <Glyph name="page" />
          </span>
        )}
        <Ellipsis content={label(node, locale)} lines={1} className="biu-menu-label" />
      </button>
      {!horizontal && (
        <>
          <button
            className={`biu-menu-favorite${favorite ? " biu-menu-favorite-active" : ""}`}
            type="button"
            aria-label={favorite ? $t("取消收藏") : $t("收藏")}
            onClick={(event) => {
              event.stopPropagation();
              toggleFavorite({
                key: currentKey,
                code: node.code,
                title: label(node, locale),
                path: menuPath(node),
                target: node.target,
                appId: node.appId,
                appPath: node.appPath,
              });
            }}
          >
            <Tooltip content={favorite ? $t("取消收藏") : $t("收藏")} onlyOverflow={false}>
              <Glyph name="favorite" />
            </Tooltip>
          </button>
          <button
            className="biu-menu-new-tab"
            type="button"
            aria-label={`${label(node, locale)} ${i18n.$t("新标签页打开", undefined, locale)}`}
            onClick={(event) => {
              event.stopPropagation();
              openMenuInNewTab(node);
            }}
          >
            <Tooltip content={i18n.$t("新标签页打开", undefined, locale)} onlyOverflow={false}>
              <Glyph name="newTab" />
            </Tooltip>
          </button>
        </>
      )}
    </div>
  );
}
function HorizontalMenuChildren({
  nodes,
  parentKey,
  level = 1,
  locale,
  onSelect,
  onOpenDirectory,
}: {
  nodes: MenuNode[];
  parentKey: string;
  level?: number;
  locale?: BiuLocale;
  onSelect: (node: MenuNode) => void;
  onOpenDirectory?: (node: MenuNode) => void;
}) {
  return (
    <>
      {nodes.map((node) => {
        const key = menuNodeKey(node, parentKey);
        const canNest = level < MAX_MENU_DEPTH - 1;
        if (node.type !== "DIRECTORY" || !node.children?.length || !canNest)
          return (
            <HeaderMenuItem
              key={key}
              onClick={() => (node.type === "DIRECTORY" ? onOpenDirectory?.(node) : onSelect(node))}
            >
              <Ellipsis content={label(node, locale)} lines={1} className="biu-menu-label" />
            </HeaderMenuItem>
          );
        return (
          <HeaderPopover
            key={key}
            ariaLabel={label(node, locale)}
            className="biu-topbar-nested-menu"
            dataMenuKey={key}
            label={
              <>
                <Glyph name="folder" />
                <Ellipsis content={label(node, locale)} lines={1} className="biu-menu-label" />
                <Glyph name="directoryCollapsed" />
              </>
            }
          >
            {(close) => (
              <HorizontalMenuChildren
                nodes={node.children ?? []}
                parentKey={key}
                level={level + 1}
                locale={locale}
                onOpenDirectory={onOpenDirectory}
                onSelect={(child) => {
                  onSelect(child);
                  close();
                }}
              />
            )}
          </HeaderPopover>
        );
      })}
    </>
  );
}
function flattenLeaves(nodes: MenuNode[]): MenuNode[] {
  return nodes.flatMap((node) => (node.type === "DIRECTORY" ? flattenLeaves(node.children ?? []) : [node]));
}
export function MenuCollection({
  menus,
  selectedCode,
  selectedMenuKey,
  onSelect,
  onOpenDirectory,
  locale,
  horizontal = false,
  showDirectoryIcon = true,
}: Pick<
  PresetContentProps,
  "menus" | "selectedCode" | "selectedMenuKey" | "onSelect" | "onOpenDirectory" | "locale"
> & { horizontal?: boolean; showDirectoryIcon?: boolean }) {
  const { $t } = useBiuI18n();
  // The CLI may add a synthetic root for routing when no backend menu tree
  // exists. It is not a user-facing top-level item, so horizontal navigation
  // exposes its real children while sidebar navigation keeps the full tree.
  const items =
    horizontal && menus.length === 1 && menus[0]?.meta?.__BIU_SYNTHETIC_ROOT === true
      ? (menus[0].children ?? [])
      : menus;
  return (
    <nav className={horizontal ? "biu-top-navigation" : "biu-sidebar-navigation"} aria-label={$t("导航")}>
      {items.map((node) => (
        <MenuItem
          key={menuNodeKey(node)}
          node={node}
          selectedCode={selectedCode}
          selectedMenuKey={selectedMenuKey}
          onSelect={onSelect}
          onOpenDirectory={onOpenDirectory}
          locale={locale}
          showDirectoryIcon={showDirectoryIcon}
          nodeKey={menuNodeKey(node)}
          horizontal={horizontal}
        />
      ))}
    </nav>
  );
}
export function ScrollableNavigation(
  props: Pick<
    PresetContentProps,
    "menus" | "selectedCode" | "selectedMenuKey" | "onSelect" | "onOpenDirectory" | "locale"
  >,
) {
  const { $t } = useBiuI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const update = () =>
    setCanScroll(Boolean(scrollRef.current && scrollRef.current.scrollWidth > scrollRef.current.clientWidth + 1));
  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [props.menus.length]);
  useEffect(() => {
    const selectedKey = props.selectedMenuKey;
    if (!selectedKey) return;
    const target = [...(scrollRef.current?.querySelectorAll<HTMLElement>("[data-biu-menu-key]") ?? [])].find(
      (element) => element.dataset.biuMenuKey === selectedKey,
    );
    target?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [props.selectedCode, props.selectedMenuKey, props.menus]);
  return (
    <div className="biu-navigation-rail">
      {canScroll && (
        <button
          type="button"
          className="biu-navigation-scroll-control biu-navigation-scroll-back"
          aria-label={$t("向左滚动导航")}
          onClick={() => scrollRef.current?.scrollBy({ left: -180, behavior: "smooth" })}
        >
          <Glyph name="back" />
        </button>
      )}
      <div ref={scrollRef} className="biu-navigation-viewport" data-biu-menu-scroll="navigation" onScroll={update}>
        <MenuCollection {...props} horizontal />
      </div>
      {canScroll && (
        <button
          type="button"
          className="biu-navigation-scroll-control biu-navigation-scroll-forward"
          aria-label={$t("向右滚动导航")}
          onClick={() => scrollRef.current?.scrollBy({ left: 180, behavior: "smooth" })}
        >
          <Glyph name="forward" />
        </button>
      )}
    </div>
  );
}
export function HeaderPopover({
  label: triggerLabel,
  ariaLabel,
  children,
  className = "",
  dataMenuKey,
}: {
  label: React.ReactNode;
  ariaLabel: string;
  children: (close: () => void) => React.ReactNode;
  className?: string;
  dataMenuKey?: string;
}) {
  const [open, setOpen] = useState(false);
  const popoverClassName = className ? `${className.split(" ")[0]}-popover` : "";
  // Sidebar footer actions sit against the viewport bottom. Tell Radix which
  // side to prefer instead of relying on a late collision flip after the
  // content has already painted. Header actions keep the normal downward
  // placement and still use the same collision boundary.
  const opensFromBottomRail = /menu-record|menu-settings-trigger|header-action-search/.test(className);
  const trigger = (
    <button
      className={`biu-header-action ${open ? "biu-header-action-active" : ""} ${className}`}
      type="button"
      aria-label={ariaLabel}
      aria-expanded={open}
      data-biu-menu-key={dataMenuKey}
      onClick={() => setOpen((value) => !value)}
    >
      {triggerLabel}
    </button>
  );
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      className="biu-header-popover-root"
      classNames={{
        trigger: "biu-header-popover-trigger",
        content: `biu-header-popover ${popoverClassName}`,
      }}
      side={opensFromBottomRail ? "top" : "bottom"}
      align={opensFromBottomRail ? "start" : "end"}
      sideOffset={8}
      collisionPadding={10}
      avoidCollisions
      content={<div role="menu">{children(() => setOpen(false))}</div>}
    >
      <Tooltip content={ariaLabel} onlyOverflow={false} className="biu-foundation-tooltip">
        {trigger}
      </Tooltip>
    </Popover>
  );
}
export function HeaderMenuItem({
  children,
  icon,
  active,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      className={`biu-header-menu-item${active ? " biu-header-menu-item-active" : ""}${danger ? " biu-header-menu-item-danger" : ""}`}
      type="button"
      role="menuitem"
      onClick={onClick}
    >
      {icon}
      <Ellipsis content={children} lines={1} className="biu-header-menu-label" />
      {active ? <Check size={14} className="biu-header-menu-check" aria-hidden="true" /> : null}
    </button>
  );
}
export function SearchPopover({
  menus,
  locale,
  onSelect,
  onOpenNewTab,
}: {
  menus: MenuNode[];
  locale?: BiuLocale;
  onSelect: (node: MenuNode) => void;
  onOpenNewTab: (node: MenuNode) => void;
}) {
  const { $t } = useBiuI18n();
  const [query, setQuery] = useState("");
  const results = query.trim()
    ? flattenLeaves(menus)
        .filter((node) => `${node.code} ${label(node, locale)}`.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 5)
    : [];
  return (
    <HeaderPopover
      ariaLabel={$t("搜索菜单")}
      className="biu-header-action-search"
      label={
        <>
          <Glyph name="search" />
          <span className="biu-action-text biu-toolbar-label">{$t("搜索")}</span>
        </>
      }
    >
      {(close) => (
        <div className="biu-search-panel">
          <div className="biu-search-input-wrap">
            <Glyph name="search" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={$t("搜索菜单")}
            />
          </div>
          <div className="biu-search-results">
            {query && !results.length && <span className="biu-search-empty">{$t("没有匹配的菜单")}</span>}
            {results.map((node) => (
              <div key={menuNodeKey(node)} className="biu-search-result-item">
                <button
                  type="button"
                  className="biu-search-result-content"
                  onClick={() => {
                    onSelect(node);
                    close();
                  }}
                >
                  <span>
                    <Ellipsis content={label(node, locale)} lines={1} className="biu-search-result-title" />
                    <Ellipsis
                      content={menuLabelPath(node, menus, locale)}
                      lines={1}
                      className="biu-search-result-path"
                    />
                  </span>
                </button>
                <button
                  type="button"
                  className="biu-search-result-new-tab"
                  aria-label={`${label(node, locale)} ${$t("新标签页打开")}`}
                  onClick={() => {
                    onOpenNewTab(node);
                    close();
                  }}
                >
                  <Tooltip content={$t("新标签页打开")} onlyOverflow={false} placement="TOP_RIGHT">
                    <Glyph name="newTab" />
                  </Tooltip>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </HeaderPopover>
  );
}
export function HeaderActionRail({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { $t } = useBiuI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const update = () =>
    setCanScroll(Boolean(scrollRef.current && scrollRef.current.scrollWidth > scrollRef.current.clientWidth + 1));
  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    const element = scrollRef.current;
    const observer = typeof ResizeObserver !== "undefined" && element ? new ResizeObserver(update) : undefined;
    if (observer && element) observer.observe(element);
    return () => {
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [children]);
  return (
    <div className={`biu-header-actions-rail${className ? ` ${className}` : ""}`}>
      {canScroll && (
        <button
          type="button"
          className="biu-scroll-control"
          aria-label={$t("向左滚动操作区")}
          onClick={() => scrollRef.current?.scrollBy({ left: -180, behavior: "smooth" })}
        >
          <Glyph name="back" />
        </button>
      )}
      <div ref={scrollRef} className="biu-header-actions" onScroll={update}>
        {children}
      </div>
      {canScroll && (
        <button
          type="button"
          className="biu-scroll-control"
          aria-label={$t("向右滚动操作区")}
          onClick={() => scrollRef.current?.scrollBy({ left: 180, behavior: "smooth" })}
        >
          <Glyph name="forward" />
        </button>
      )}
    </div>
  );
}
function MenuSettingsPanel({
  close,
  onExpandMenu,
  onCollapseMenu,
  onHideMenu,
}: {
  close?: () => void;
  onExpandMenu?: () => void;
  onCollapseMenu?: () => void;
  onHideMenu?: () => void;
}) {
  const { $t } = useBiuI18n();
  const menuMode = useBiuMenuStore((state) => state.menuMode);
  const accordion = useBiuMenuStore((state) => state.accordion);
  const showMenuTitle = useBiuMenuStore((state) => state.showMenuTitle);
  const setAllExpanded = useBiuMenuStore((state) => state.setAllExpanded);
  const setAllCollapsed = useBiuMenuStore((state) => state.setAllCollapsed);
  const setAccordion = useBiuMenuStore((state) => state.setAccordion);
  const setShowMenuTitle = useBiuMenuStore((state) => state.setShowMenuTitle);
  const setMenuMode = useBiuMenuStore((state) => state.setMenuMode);
  const showTopSearch = useBiuMenuStore((state) => state.showTopSearch);
  const setShowTopSearch = useBiuMenuStore((state) => state.setShowTopSearch);
  const select = (action: () => void, shouldClose = false) => {
    action();
    if (shouldClose) close?.();
  };
  return (
    <div className="biu-menu-settings-panel">
      <div className="biu-popover-title">
        <strong>{$t("菜单选项")}</strong>
      </div>
      <section className="biu-menu-settings-section">
        <div className="biu-menu-settings-heading">{$t("功能区")}</div>
        <HeaderMenuItem onClick={() => select(setAllExpanded)}>{$t("展开所有目录")}</HeaderMenuItem>
        <HeaderMenuItem onClick={() => select(setAllCollapsed)}>{$t("收起所有目录")}</HeaderMenuItem>
        <HeaderMenuItem onClick={() => select(() => onExpandMenu?.())}>{$t("展开菜单栏")}</HeaderMenuItem>
        <HeaderMenuItem onClick={() => select(() => onCollapseMenu?.())}>{$t("折叠菜单栏")}</HeaderMenuItem>
        <HeaderMenuItem onClick={() => select(() => onHideMenu?.(), true)}>{$t("隐藏菜单栏")}</HeaderMenuItem>
      </section>
      <section className="biu-menu-settings-section">
        <div className="biu-menu-settings-heading">{$t("配置区")}</div>
        <HeaderMenuItem active={accordion} onClick={() => select(() => setAccordion(true))}>
          {$t("仅展开单个目录")}
        </HeaderMenuItem>
        <HeaderMenuItem active={!accordion} onClick={() => select(() => setAccordion(false))}>
          {$t("可展开多个目录")}
        </HeaderMenuItem>
        <HeaderMenuItem active={showTopSearch} onClick={() => select(() => setShowTopSearch(!showTopSearch))}>
          {$t("顶部展示搜索按钮")}
        </HeaderMenuItem>
        {menuMode === "MULTI_LEVEL" && (
          <>
            <HeaderMenuItem active={showMenuTitle} onClick={() => select(() => setShowMenuTitle(true))}>
              {$t("显示目录标题")}
            </HeaderMenuItem>
            <HeaderMenuItem active={!showMenuTitle} onClick={() => select(() => setShowMenuTitle(false))}>
              {$t("隐藏目录标题")}
            </HeaderMenuItem>
          </>
        )}
      </section>
      <section className="biu-menu-settings-section">
        <div className="biu-menu-settings-heading">{$t("样式区")}</div>
        <HeaderMenuItem active={menuMode === "STANDARD"} onClick={() => select(() => setMenuMode("STANDARD"))}>
          {$t("单栏模式")}
        </HeaderMenuItem>
        <HeaderMenuItem active={menuMode === "MULTI_LEVEL"} onClick={() => select(() => setMenuMode("MULTI_LEVEL"))}>
          {$t("双栏模式")}
        </HeaderMenuItem>
      </section>
    </div>
  );
}
export function MenuSettingsButton({
  onExpandMenu,
  onCollapseMenu,
  onHideMenu,
}: {
  onExpandMenu?: () => void;
  onCollapseMenu?: () => void;
  onHideMenu?: () => void;
}) {
  const { $t } = useBiuI18n();
  return (
    <HeaderPopover ariaLabel={$t("菜单选项")} className="biu-menu-settings-trigger" label={<Glyph name="settings" />}>
      {(close) => (
        <MenuSettingsPanel
          close={close}
          onExpandMenu={onExpandMenu}
          onCollapseMenu={onCollapseMenu}
          onHideMenu={onHideMenu}
        />
      )}
    </HeaderPopover>
  );
}
export function MenuRecordPopover({
  kind,
  records,
  menus = [],
  locale,
  onSelect,
  onOpenNewTab,
  onClear,
  onOpenAll,
}: {
  kind: "FAVORITES" | "RECENT";
  records: BiuMenuRecord[];
  menus?: MenuNode[];
  locale?: BiuLocale;
  onSelect: (record: BiuMenuRecord) => void;
  onOpenNewTab: (record: BiuMenuRecord) => void;
  onClear?: () => void;
  onOpenAll?: () => void;
}) {
  const { $t } = useBiuI18n();
  const title = kind === "FAVORITES" ? $t("收藏") : $t("最近使用");
  return (
    <HeaderPopover
      ariaLabel={title}
      className={`biu-menu-record-trigger biu-menu-record-${kind.toLowerCase()}`}
      label={<Glyph name={kind === "FAVORITES" ? "favorite" : "history"} />}
    >
      {(close) => (
        <div className="biu-menu-record-panel">
          <div className="biu-popover-title">
            <strong>{title}</strong>
            {onClear && records.length > 0 && (
              <button type="button" className="biu-record-clear" onClick={onClear}>
                {$t("清空")}
              </button>
            )}
          </div>
          {kind === "RECENT" && (
            <button
              type="button"
              className="biu-record-open-all"
              disabled={!records.length}
              onClick={() => {
                onOpenAll?.();
                close();
              }}
            >
              {$t("还原所有标签")}
              <Tooltip content={$t("在新标签页打开全部最近使用")} onlyOverflow={false} placement="TOP_RIGHT">
                <Glyph name="newTab" />
              </Tooltip>
            </button>
          )}
          <div className="biu-record-list">
            {records.length ? (
              records.map((record) => (
                <div key={record.key} className="biu-record-item">
                  <button
                    type="button"
                    className="biu-record-item-content"
                    onClick={() => {
                      onSelect(record);
                      close();
                    }}
                  >
                    <Ellipsis content={record.title} lines={1} className="biu-record-title-tooltip" />
                    <Ellipsis
                      content={record.titlePath || menuLabelPathByKey(record.key, menus, locale) || record.path}
                      lines={1}
                      className="biu-record-path"
                    />
                  </button>
                  <button
                    type="button"
                    className="biu-record-new-tab"
                    aria-label={`${record.title} ${$t("新标签页打开")}`}
                    onClick={() => {
                      onOpenNewTab(record);
                      close();
                    }}
                  >
                    <Tooltip content={$t("新标签页打开")} onlyOverflow={false} placement="TOP_RIGHT">
                      <Glyph name="newTab" />
                    </Tooltip>
                  </button>
                </div>
              ))
            ) : (
              <div className="biu-record-empty">{$t(kind === "FAVORITES" ? "暂无收藏" : "暂无最近使用")}</div>
            )}
          </div>
        </div>
      )}
    </HeaderPopover>
  );
}
export function MultiLevelMenu({
  menus,
  selectedCode,
  selectedMenuKey,
  onSelect,
  onOpenDirectory,
  locale,
  collapsed = false,
}: Pick<
  PresetContentProps,
  "menus" | "selectedCode" | "selectedMenuKey" | "onSelect" | "onOpenDirectory" | "locale"
> & { collapsed?: boolean }) {
  const { $t } = useBiuI18n();
  const groups = menus.filter((node) => node.type === "DIRECTORY");
  const selectedGroupCode = useBiuMenuStore((state) => state.selectedGroupCode);
  const setSelectedGroupCode = useBiuMenuStore((state) => state.setSelectedGroupCode);
  const setDirectoryScope = useBiuMenuStore((state) => state.setDirectoryScope);
  const railRef = useRef<HTMLDivElement>(null);
  const [railOverflow, setRailOverflow] = useState(false);
  const updateRailOverflow = () =>
    setRailOverflow(Boolean(railRef.current && railRef.current.scrollHeight > railRef.current.clientHeight + 1));
  const activeGroup = groups.find((group) => menuNodeKey(group) === selectedGroupCode) ?? groups[0];
  useEffect(() => {
    if (!activeGroup) return;
    const activeKey = menuNodeKey(activeGroup);
    if (activeKey !== selectedGroupCode) setSelectedGroupCode(activeKey);
    setDirectoryScope(activeGroup.children ?? []);
  }, [activeGroup, selectedGroupCode, setDirectoryScope, setSelectedGroupCode]);
  useLayoutEffect(() => {
    updateRailOverflow();
    window.addEventListener("resize", updateRailOverflow);
    const observedRail = railRef.current?.parentElement;
    const observer =
      typeof ResizeObserver === "undefined" || !observedRail ? undefined : new ResizeObserver(updateRailOverflow);
    if (observer && observedRail) observer.observe(observedRail);
    return () => {
      window.removeEventListener("resize", updateRailOverflow);
      observer?.disconnect();
    };
  }, [groups.length, activeGroup?.code]);
  if (!groups.length)
    return (
      <MenuCollection
        menus={menus}
        selectedCode={selectedCode}
        onSelect={onSelect}
        onOpenDirectory={onOpenDirectory}
        locale={locale}
      />
    );
  return (
    <div className={`biu-multi-level-menu${collapsed ? " biu-multi-level-menu-collapsed" : ""}`}>
      <div className="biu-menu-group-rail-wrap">
        {railOverflow && (
          <button
            type="button"
            className="biu-menu-group-scroll"
            aria-label={$t("向上滚动目录")}
            onClick={() => railRef.current?.scrollBy({ top: -120, behavior: "smooth" })}
          >
            <Glyph name="up" />
          </button>
        )}
        <div ref={railRef} className="biu-menu-group-rail" data-biu-menu-scroll="groups" aria-label={$t("菜单目录")}>
          {groups.map((group) => (
            <button
              key={menuNodeKey(group)}
              type="button"
              data-biu-menu-key={menuNodeKey(group)}
              className={
                menuNodeKey(group) === (activeGroup ? menuNodeKey(activeGroup) : "") ? "biu-menu-group-active" : ""
              }
              onClick={() => setSelectedGroupCode(menuNodeKey(group))}
            >
              <span className="biu-menu-icon">
                <Glyph name={resolveDirectoryGlyph(group)} />
              </span>
              <Ellipsis content={label(group, locale)} lines={1} className="biu-menu-group-label" />
            </button>
          ))}
        </div>
        {railOverflow && (
          <button
            type="button"
            className="biu-menu-group-scroll"
            aria-label={$t("向下滚动目录")}
            onClick={() => railRef.current?.scrollBy({ top: 120, behavior: "smooth" })}
          >
            <Glyph name="down" />
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="biu-menu-group-content" data-biu-menu-scroll="content">
          {activeGroup && (
            <>
              <div className="biu-menu-group-heading">
                <Ellipsis content={label(activeGroup, locale)} lines={1} />
              </div>
              <MenuCollection
                menus={activeGroup.children ?? []}
                selectedCode={selectedCode}
                selectedMenuKey={selectedMenuKey}
                onSelect={onSelect}
                onOpenDirectory={onOpenDirectory}
                locale={locale}
                showDirectoryIcon={false}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
