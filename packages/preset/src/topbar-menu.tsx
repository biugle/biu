import React, { useState } from "react";
import { useBiuI18n, type BiuLocale, type MenuNode } from "@biugle/biu-runtime";
import { Ellipsis } from "@biugle/react-components";
import { Glyph, HeaderPopover, label, MAX_MENU_DEPTH, menuNodeKey } from "./layout-components.js";

type TopbarMenuProps = {
  menus: MenuNode[];
  selectedMenuKey?: string;
  onSelect: (menu: MenuNode) => void;
  onOpenDirectory?: (menu: MenuNode) => void;
  locale?: BiuLocale;
};

function menuContainsSelection(key: string, selectedMenuKey?: string) {
  return selectedMenuKey === key || selectedMenuKey?.startsWith(`${key}/`) === true;
}

export function TopbarMenuPopover({ menus, selectedMenuKey, onSelect, onOpenDirectory, locale }: TopbarMenuProps) {
  const { $t } = useBiuI18n();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const items = menus.length === 1 && menus[0]?.meta?.__BIU_SYNTHETIC_ROOT === true ? (menus[0].children ?? []) : menus;

  const toggle = (key: string) => {
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderNodes = (nodes: MenuNode[], parentKey = "", level = 0, close?: () => void): React.ReactNode =>
    nodes.map((node) => {
      const key = menuNodeKey(node, parentKey);
      const active = menuContainsSelection(key, selectedMenuKey);
      if (node.type === "DIRECTORY") {
        const canNest = level < MAX_MENU_DEPTH - 1;
        const children = canNest ? (node.children ?? []) : [];
        const hasChildren = children.length > 0;
        const expanded = hasChildren && (expandedKeys.has(key) || active);
        return (
          <div
            key={key}
            className="biu-topbar-mobile-menu-group"
            style={{ "--biu-menu-level": level } as React.CSSProperties}
          >
            <button
              type="button"
              className={`biu-topbar-mobile-menu-item biu-topbar-mobile-menu-directory${active ? " biu-topbar-mobile-menu-active" : ""}`}
              aria-expanded={hasChildren ? expanded : undefined}
              onClick={() => {
                onOpenDirectory?.(node);
                if (hasChildren) toggle(key);
              }}
            >
              <Glyph name="folder" />
              <Ellipsis content={label(node, locale)} lines={1} className="biu-topbar-menu-label" />
              {hasChildren ? <Glyph name={expanded ? "directoryExpanded" : "directoryCollapsed"} /> : null}
            </button>
            {expanded && (
              <div className="biu-topbar-mobile-menu-children">{renderNodes(children, key, level + 1, close)}</div>
            )}
          </div>
        );
      }
      return (
        <button
          key={key}
          type="button"
          className={`biu-topbar-mobile-menu-item biu-topbar-mobile-menu-page${active ? " biu-topbar-mobile-menu-active" : ""}`}
          style={{ "--biu-menu-level": level } as React.CSSProperties}
          onClick={() => {
            onSelect(node);
            close?.();
          }}
        >
          <Glyph name="page" />
          <Ellipsis content={label(node, locale)} lines={1} className="biu-topbar-menu-label" />
        </button>
      );
    });

  return (
    <HeaderPopover ariaLabel={$t("菜单")} className="biu-topbar-menu-trigger" label={<Glyph name="menu" />}>
      {(close) => <div className="biu-topbar-mobile-menu">{renderNodes(items, "", 0, close)}</div>}
    </HeaderPopover>
  );
}
