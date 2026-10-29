import { useBiuI18n, type BiuMenuRecord, type MenuNode } from "@biugle/biu-runtime";
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
      {/* Keep the hide action in expanded mode; the collapsed icon rail keeps settings as its sole footer control. */}
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
      <MenuSettingsButton
        disabled={Boolean(layoutOverrides?.lockSidebar)}
        onExpandMenu={onExpandMenu}
        onCollapseMenu={onCollapseMenu}
        onHideMenu={onHideMenu}
      />
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
