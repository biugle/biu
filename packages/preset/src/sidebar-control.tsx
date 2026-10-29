import { Glyph } from "./layout-components.js";
import { Tooltip } from "@biugle/react-components";

export function SidebarHeaderControl({
  label,
  icon,
  expanded,
  disabled = false,
  onClick,
}: {
  label: string;
  icon: "forward" | "back";
  expanded: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip content={label} onlyOverflow={false} className="biu-sidebar-header-control-wrap">
      <button
        type="button"
        className="biu-sidebar-header-control"
        aria-label={label}
        aria-expanded={expanded}
        aria-controls="biu-sidebar-navigation"
        disabled={disabled}
        onClick={onClick}
      >
        <Glyph name={icon} />
      </button>
    </Tooltip>
  );
}
