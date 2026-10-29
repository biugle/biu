import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBiuI18n, useBiuMenuStore, type BiuLocale, type BiuMenuRecord, type MenuNode } from "@biugle/biu-runtime";
import { Ellipsis, Tooltip } from "@biugle/react-components";
import {
  Glyph,
  HeaderMenuItem,
  HeaderPopover,
  MenuCollection,
  label,
  menuLabelPathByKey,
  menuNodeKey,
  resolveDirectoryGlyph,
  type PresetContentProps,
} from "./layout-components-core.js";

function MenuSettingsPanel({
  close,
  disabled = false,
  onExpandMenu,
  onCollapseMenu,
  onHideMenu,
}: {
  close?: () => void;
  disabled?: boolean;
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
        <HeaderMenuItem disabled={disabled} onClick={() => select(() => onExpandMenu?.())}>
          {$t("展开菜单栏")}
        </HeaderMenuItem>
        <HeaderMenuItem disabled={disabled} onClick={() => select(() => onCollapseMenu?.())}>
          {$t("折叠菜单栏")}
        </HeaderMenuItem>
        <HeaderMenuItem disabled={disabled} onClick={() => select(() => onHideMenu?.(), true)}>
          {$t("隐藏菜单栏")}
        </HeaderMenuItem>
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
  disabled = false,
  onExpandMenu,
  onCollapseMenu,
  onHideMenu,
}: {
  disabled?: boolean;
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
          disabled={disabled}
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
  direction,
  collapsed = false,
}: Pick<
  PresetContentProps,
  "menus" | "selectedCode" | "selectedMenuKey" | "onSelect" | "onOpenDirectory" | "locale"
> & { direction?: "ltr" | "rtl"; collapsed?: boolean }) {
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
        direction={direction}
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
                direction={direction}
                showDirectoryIcon={false}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
