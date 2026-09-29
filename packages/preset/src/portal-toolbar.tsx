import { useBiuContext, useBiuI18n, type BiuPortalSlots, type BiuPortalToolbarAction } from "@biugle/biu-runtime";
import { Tooltip } from "@biugle/react-components";
import { HeaderActionRail, HeaderMenuItem, HeaderPopover } from "./layout-components.js";

/** Render the same portal-defined action contract on desktop and in the compact mobile menu. */
export function PortalToolbarActions({
  actions = [],
  compact = false,
  close,
}: {
  actions?: BiuPortalToolbarAction[];
  compact?: boolean;
  close?: () => void;
}) {
  const { $t } = useBiuI18n();
  const { locale, portalCode, theme, direction, timezone } = useBiuContext();
  const context = { locale, portalCode, theme, direction, timezone };
  const items = actions.filter(
    (action) =>
      action.code.trim() &&
      (typeof action.label === "function" || action.label.trim()) &&
      (compact ? action.mobile !== "HIDE" : true),
  );
  return (
    <>
      {items.map((action) => {
        const actionLabel = action.labelKey
          ? $t(action.labelKey)
          : typeof action.label === "function"
            ? action.label(context)
            : action.label || action.code;
        const actionValue = action.value?.(context);
        const actionText = typeof actionLabel === "string" ? actionLabel : action.code;
        const actionTooltip = action.tooltipKey ? $t(action.tooltipKey) : action.tooltip;
        const hasActionValue = actionValue !== undefined && actionValue !== null && actionValue !== "";
        const renderedLabel = hasActionValue ? (
          <span className="biu-toolbar-action-value">{actionValue}</span>
        ) : (
          actionLabel
        );
        const content =
          typeof action.content === "function" ? action.content(close ?? (() => undefined)) : action.content;
        if (compact) {
          return action.content ? (
            <div className="biu-compact-toolbar-action" key={action.code}>
              <div className="biu-menu-settings-heading">{actionText}</div>
              {content}
            </div>
          ) : (
            <HeaderMenuItem
              key={action.code}
              icon={action.icon}
              onClick={() => {
                action.onClick?.();
                close?.();
              }}
            >
              {renderedLabel}
            </HeaderMenuItem>
          );
        }
        if (action.content) {
          return (
            <HeaderPopover
              key={action.code}
              ariaLabel={actionTooltip || actionText}
              className="biu-header-action biu-portal-toolbar-action"
              label={
                <>
                  {action.icon}
                  <span className="biu-action-text">{renderedLabel}</span>
                </>
              }
            >
              {() => (
                <div className="biu-portal-toolbar-popover">
                  <div className="biu-menu-settings-heading">{actionText}</div>
                  {content}
                </div>
              )}
            </HeaderPopover>
          );
        }
        return (
          <button
            key={action.code}
            type="button"
            className="biu-header-action biu-portal-toolbar-action"
            aria-label={actionTooltip || actionText}
            onClick={action.onClick}
          >
            <Tooltip content={actionTooltip || actionText || $t("门户工具")} onlyOverflow={false}>
              <span className="biu-portal-toolbar-action-content">
                {action.icon}
                <span className="biu-action-text">{renderedLabel}</span>
              </span>
            </Tooltip>
          </button>
        );
      })}
    </>
  );
}

/** Isolated rail for portal-owned controls so foundation controls keep their own width and scroll state. */
export function PortalToolbarRail({ slots, iconOnly = false }: { slots?: BiuPortalSlots; iconOnly?: boolean }) {
  if (!slots?.toolbarActions?.length && !slots?.toolbar) return null;
  return (
    <HeaderActionRail className={`biu-header-actions-rail-custom${iconOnly ? " biu-toolbar-icons-only" : ""}`}>
      <span className="biu-portal-toolbar-actions">
        <PortalToolbarActions actions={slots.toolbarActions} />
      </span>
      <span className="biu-portal-toolbar-slot">{slots.toolbar}</span>
    </HeaderActionRail>
  );
}
