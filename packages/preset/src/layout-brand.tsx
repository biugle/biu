import { useBiuI18n } from "@biugle/biu-runtime";
import { Ellipsis } from "@biugle/react-components";
import { HeaderMenuItem, HeaderPopover, type PresetContentProps } from "./layout-components.js";

type LayoutBrandProps = Pick<PresetContentProps, "layoutOptions" | "onSystemChange"> & {
  appLabel: string;
  portalLabel: string;
  effectiveSidebarCollapsed: boolean;
};

export function LayoutBrand({
  layoutOptions,
  appLabel,
  portalLabel,
  effectiveSidebarCollapsed,
  onSystemChange,
}: LayoutBrandProps) {
  const { $t } = useBiuI18n();
  const systemOptions = (layoutOptions?.systemOptions ?? []).filter(
    (item) => typeof item.code === "string" && item.code.trim() && typeof item.label === "string" && item.label.trim(),
  );
  const activeSystem = systemOptions.find((item) => item.code === layoutOptions?.activeSystem);
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
  return brand;
}
