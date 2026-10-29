import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [
  layoutFrame,
  layoutHeader,
  sidebarFooter,
  menuSettings,
  menuComponents,
  headerStyles,
  sidebarStyles,
  contentStyles,
  responsiveStyles,
] = await Promise.all([
  readSource("../src/layout-frame.tsx"),
  readSource("../src/layout-header.tsx"),
  readSource("../src/layout-sidebar-footer.tsx"),
  readSource("../src/menu-settings.tsx"),
  readSource("../src/layout-components-core.tsx"),
  readSource("../src/styles/header.css"),
  readSource("../src/styles/sidebar.css"),
  readSource("../src/styles/content.css"),
  readSource("../src/styles/responsive.css"),
]);

test("sidebar starts expanded and the top-edge control follows the three presentation states", () => {
  assert.match(layoutFrame, /const \[sidebarCollapsed, setSidebarCollapsed\] = useState\(false\);/);
  assert.match(layoutFrame, /const \[sidebarHidden, setSidebarHidden\] = useState\(false\);/);
  assert.match(
    layoutFrame,
    /const restoreToExpanded = effectiveSidebarHidden \|\| effectiveSidebarCollapsed;\s*setSidebarPresentation\(false, !restoreToExpanded\);/,
  );
  assert.match(sidebarStyles, /\.biu-layout\.biu-sidebar-collapsed\s*\{\s*--biu-sidebar-width:\s*60px;/);
  assert.match(sidebarStyles, /\.biu-layout\.biu-sidebar-hidden\s*\{\s*--biu-sidebar-width:\s*0px;/);
});

test("sidebar recovery control stays outside the hidden and inert navigation", () => {
  const asideEnd = layoutFrame.indexOf("{sidebarFooter}\n          </aside>");
  const recoveryControl = layoutFrame.indexOf("{sidebarControl}", asideEnd);
  const mainContent = layoutFrame.indexOf('<div className="biu-main">', recoveryControl);

  assert.notEqual(asideEnd, -1);
  assert.ok(recoveryControl > asideEnd && recoveryControl < mainContent);
  assert.match(layoutFrame, /aria-hidden=\{effectiveSidebarHidden \|\| undefined\}/);
  assert.match(layoutFrame, /inert=\{effectiveSidebarHidden \|\| undefined\}/);
  assert.doesNotMatch(layoutHeader, /SidebarHeaderControl|sidebarControl/);
});

test("expanded footer exposes the hide action while collapsed footer keeps menu settings", () => {
  const hideAction = sidebarFooter.indexOf('className="biu-sidebar-footer-hide"');
  const menuSettingsAction = sidebarFooter.indexOf("<MenuSettingsButton");
  const favorites = sidebarFooter.indexOf('kind="FAVORITES"');

  assert.ok(hideAction > -1 && hideAction < menuSettingsAction && hideAction < favorites);
  assert.match(
    sidebarFooter,
    /\{!effectiveSidebarCollapsed && \(\s*<Tooltip content=\{\$t\("隐藏菜单栏"\)\} onlyOverflow=\{false\}>/,
  );
  assert.match(sidebarFooter, /<\/Tooltip>\s*\)\}\s*<MenuSettingsButton/);
  assert.match(sidebarFooter, /disabled=\{Boolean\(layoutOverrides\?\.lockSidebar\)\}/);
  assert.match(sidebarFooter, /onClick=\{onHideMenu\}/);
  assert.match(layoutFrame, /if \(layoutOverrides\?\.lockSidebar\) return;/);
  assert.match(layoutFrame, /<SidebarHeaderControl[\s\S]*?disabled=\{Boolean\(layoutOverrides\?\.lockSidebar\)\}/);
  assert.match(menuSettings, /<HeaderMenuItem disabled=\{disabled\}/);
  assert.doesNotMatch(sidebarFooter, /biu-sidebar-footer-action/);
  assert.match(
    sidebarStyles,
    /\.biu-layout\.biu-sidebar-hidden \.biu-sidebar-header-control-wrap\s*\{[^}]*left:\s*0;[^}]*right:\s*auto;[^}]*transform:\s*none;/s,
  );
});

test("sidebar edge control centers on the layout seam and mirrors its alignment for RTL", () => {
  assert.match(
    sidebarStyles,
    /\.biu-sidebar-header-control-wrap\s*\{[^}]*top:\s*16px;[^}]*left:\s*var\(--biu-sidebar-width, 220px\);[^}]*right:\s*auto;[^}]*width:\s*28px;[^}]*height:\s*28px;[^}]*transform:\s*translateX\(-50%\);[^}]*transition:/s,
  );
  assert.match(sidebarStyles, /\.biu-sidebar-header-control\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;/s);
  assert.match(sidebarStyles, /\.biu-sidebar-header-control \.biu-icon\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;/s);
  assert.match(contentStyles, /\.biu-sidebar-layout \.biu-breadcrumb\s*\{[^}]*padding:\s*0 12px;/s);
  assert.match(responsiveStyles, /\.biu-sidebar-layout \.biu-breadcrumb\s*\{[^}]*padding-inline:\s*12px;/s);
  assert.match(responsiveStyles, /@media \(max-width:\s*520px\)[\s\S]*?\.biu-breadcrumb\s*\{\s*display:\s*none;/);
  assert.doesNotMatch(responsiveStyles, /\.biu-sidebar-layout \.biu-sidebar-header-control-wrap\s*\{[^}]*top:/s);
});

test("a hidden sidebar reserves logical-start header space for its recovery control", () => {
  assert.match(
    headerStyles,
    /\.biu-sidebar-layout\.biu-sidebar-hidden \.biu-header\s*\{[^}]*padding-inline-start:\s*36px;/s,
  );
  assert.match(headerStyles, /transition:\s*padding-inline-start\s+0\.22s\s+ease;/);
});

test("responsive sidebar widths and RTL control alignment remain explicit", () => {
  assert.match(responsiveStyles, /@media \(max-width:\s*520px\)[\s\S]*?--biu-sidebar-expanded-width:\s*208px;/);
  assert.match(responsiveStyles, /@media \(max-width:\s*390px\)[\s\S]*?--biu-sidebar-expanded-width:\s*196px;/);
  assert.match(
    sidebarStyles,
    /\.biu-layout\[dir="rtl"\]:not\(\.biu-sidebar-hidden\) \.biu-sidebar-header-control-wrap\s*\{[^}]*left:\s*auto;[^}]*right:\s*var\(--biu-sidebar-width, 220px\);[^}]*transform:\s*translateX\(50%\);/,
  );
  assert.match(
    sidebarStyles,
    /\.biu-layout\[dir="rtl"\]\.biu-sidebar-hidden \.biu-sidebar-header-control-wrap\s*\{[^}]*left:\s*auto;[^}]*right:\s*0;[^}]*transform:\s*none;/,
  );
  assert.match(
    sidebarStyles,
    /\.biu-layout\[dir="rtl"\] \.biu-sidebar-header-control \.biu-icon,[\s\S]*?transform:\s*scaleX\(-1\);/,
  );
});

test("base sidebar menu actions receive Runtime direction and mirror in RTL", () => {
  assert.match(menuComponents, /const \{ direction: contextDirection \} = useBiuContext\(\);/);
  assert.match(menuComponents, /direction: directionOverride/);
  assert.match(menuComponents, /const direction = directionOverride \?\? contextDirection \?\? "ltr"/);
  assert.match(menuComponents, /<nav\s+dir=\{direction\}/);
  assert.match(menuComponents, /className=\{`biu-menu-item-wrap[\s\S]*?dir=\{direction\}/);
  assert.match(
    sidebarStyles,
    /\.biu-sidebar-navigation \.biu-menu-item-wrap\[dir="rtl"\] \.biu-menu-item\s*\{[^}]*padding-left:\s*62px;[^}]*padding-right:\s*6px;[^}]*text-align:\s*start;/s,
  );
  assert.match(
    sidebarStyles,
    /\.biu-sidebar-navigation \.biu-menu-item-wrap\[dir="rtl"\] \.biu-menu-favorite\s*\{[^}]*left:\s*32px;[^}]*right:\s*auto;/s,
  );
  assert.match(
    sidebarStyles,
    /\.biu-sidebar-navigation \.biu-menu-item-wrap\[dir="rtl"\] \.biu-menu-new-tab\s*\{[^}]*left:\s*7px;[^}]*right:\s*auto;/s,
  );
  assert.match(
    sidebarStyles,
    /\.biu-sidebar-navigation \.biu-menu-item-wrap\[dir="rtl"\] \.biu-menu-new-tab \.biu-icon\s*\{[^}]*transform:\s*scaleX\(-1\);/s,
  );
  assert.match(
    layoutFrame,
    /const layoutDirection = layoutOptions\?\.activeDirection \?\? layoutOptions\?\.direction \?\? "ltr"/,
  );
  assert.match(
    layoutFrame,
    /<div\s+className=\{`biu-page-content\$\{selected\?\.target === "APP" \? " biu-page-content-app" : ""\}`\}\s+dir="ltr">/,
  );
  assert.equal((layoutFrame.match(/direction=\{layoutDirection\}/g) ?? []).length, 4);
  assert.equal((layoutFrame.match(/dir=\{layoutDirection\}/g) ?? []).length, 4);
});
