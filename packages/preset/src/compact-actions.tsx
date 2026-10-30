import { useBiuI18n, type BiuPortalToolbarAction, type BiuTimezoneOption } from "@biugle/biu-runtime";
import { type BiuDirection, type BiuTheme } from "@biugle/biu-store";
import { type BiuLocale, type BiuLocaleOption } from "@biugle/biu-i18n";
import { Glyph, HeaderMenuItem, HeaderPopover } from "./layout-components.js";
import { PortalToolbarActions } from "./portal-toolbar.js";

export function CompactActionsPopover({
  locale,
  languageOptions,
  activeTimezone,
  timezoneOptions,
  activeDirection,
  activeTheme,
  onLocaleChange,
  onTimezoneChange,
  onDirectionChange,
  onThemeChange,
  customActions,
}: {
  locale?: BiuLocale;
  languageOptions: BiuLocaleOption[];
  activeTimezone?: string;
  timezoneOptions?: BiuTimezoneOption[];
  activeDirection: BiuDirection;
  activeTheme: BiuTheme;
  onLocaleChange?: (locale: BiuLocale) => void;
  onTimezoneChange?: (timezone: string) => void;
  onDirectionChange?: (direction: BiuDirection) => void;
  onThemeChange?: (theme: BiuTheme) => void;
  customActions?: BiuPortalToolbarAction[];
}) {
  const { $t } = useBiuI18n();
  const choose = (action: () => void, close: () => void) => {
    action();
    close();
  };
  return (
    <HeaderPopover ariaLabel={$t("更多操作")} className="biu-compact-actions-trigger" label={<Glyph name="settings" />}>
      {(close) => (
        <div className="biu-compact-actions-panel">
          <div className="biu-menu-settings-heading">{$t("语言")}</div>
          {languageOptions.map((option) => (
            <HeaderMenuItem
              key={option.code}
              active={option.code === locale}
              onClick={() => choose(() => onLocaleChange?.(option.code), close)}
            >
              {option.label}
            </HeaderMenuItem>
          ))}
          {activeTimezone && timezoneOptions?.length ? (
            <>
              <div className="biu-menu-divider" />
              <div className="biu-menu-settings-heading">{$t("时区")}</div>
              {timezoneOptions.map((option) => (
                <HeaderMenuItem
                  key={option.code}
                  active={option.code === activeTimezone}
                  onClick={() => choose(() => onTimezoneChange?.(option.code), close)}
                >
                  {option.label}
                </HeaderMenuItem>
              ))}
            </>
          ) : null}
          <div className="biu-menu-divider" />
          <div className="biu-menu-settings-heading">{$t("界面方向")}</div>
          <HeaderMenuItem
            active={activeDirection === "ltr"}
            onClick={() => choose(() => onDirectionChange?.("ltr"), close)}
          >
            {$t("从左到右")}
          </HeaderMenuItem>
          <HeaderMenuItem
            active={activeDirection === "rtl"}
            onClick={() => choose(() => onDirectionChange?.("rtl"), close)}
          >
            {$t("从右到左")}
          </HeaderMenuItem>
          <div className="biu-menu-divider" />
          <div className="biu-menu-settings-heading">{$t("主题")}</div>
          <HeaderMenuItem
            active={activeTheme === "light"}
            onClick={() => choose(() => onThemeChange?.("light"), close)}
          >
            {$t("浅色")}
          </HeaderMenuItem>
          <HeaderMenuItem active={activeTheme === "dark"} onClick={() => choose(() => onThemeChange?.("dark"), close)}>
            {$t("深色")}
          </HeaderMenuItem>
          <HeaderMenuItem
            active={activeTheme === "system"}
            onClick={() => choose(() => onThemeChange?.("system"), close)}
          >
            {$t("跟随系统")}
          </HeaderMenuItem>
          {customActions?.length ? (
            <>
              <div className="biu-menu-divider" />
              <div className="biu-menu-settings-heading">{$t("门户工具")}</div>
              <PortalToolbarActions actions={customActions} compact close={close} />
            </>
          ) : null}
        </div>
      )}
    </HeaderPopover>
  );
}
