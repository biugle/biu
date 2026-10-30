import type { ReactNode } from "react";
import { useBiuI18n } from "@biugle/biu-runtime";
import { type BiuMenuRecord, type MenuNode } from "@biugle/biu-router";
import { Tooltip } from "@biugle/react-components";
import {
  Glyph,
  MenuRecordPopover,
  MenuSettingsButton,
  SearchPopover,
  type PresetContentProps,
} from "./layout-components.js";

type LayoutSidebarFooterProps = Pick<PresetContentProps, "menus" | "locale" | "layoutOverrides"> & {
  effectiveSidebarCollapsed: boolean;
  collapsedControl: ReactNode;
  favorites: BiuMenuRecord[];
  recent: BiuMenuRecord[];
  clearRecent: () => void;
  recordToMenuNode: (record: BiuMenuRecord) => MenuNode;
  handleSelect: (node: MenuNode) => void;
  openMenuInNewTab: (node: MenuNode) => void;
  showTopSearch: boolean;
  searchEnabled: boolean;
  onExpandMenu: () => void;
  onCollapseMenu: () => void;
  onHideMenu: () => void;
};

export function LayoutSidebarFooter({
  menus,
  locale,
  layoutOverrides,
  effectiveSidebarCollapsed,
  collapsedControl,
  favorites,
  recent,
  clearRecent,
  recordToMenuNode,
  handleSelect,
  openMenuInNewTab,
  showTopSearch,
  searchEnabled,
  onExpandMenu,
  onCollapseMenu,
  onHideMenu,
}: LayoutSidebarFooterProps) {
  const { $t } = useBiuI18n();
  return (
    <div className="biu-sidebar-footer">
      {/* The collapsed rail has one restore action shared by every official layout. */}
      {!effectiveSidebarCollapsed && (
        <Tooltip content={$t("隐藏菜单栏")} onlyOverflow={false}>
          <button
            type="button"
            className="biu-sidebar-footer-hide"
            aria-label={$t("隐藏菜单栏")}
            aria-controls="biu-sidebar-navigation"
            disabled={Boolean(layoutOverrides?.lockSidebar)}
            onClick={onHideMenu}
          >
            <Glyph name="hideSidebar" />
          </button>
        </Tooltip>
      )}
      {effectiveSidebarCollapsed ? (
        collapsedControl
      ) : (
        <MenuSettingsButton
          disabled={Boolean(layoutOverrides?.lockSidebar)}
          onExpandMenu={onExpandMenu}
          onCollapseMenu={onCollapseMenu}
          onHideMenu={onHideMenu}
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
    </div>
  );
}
