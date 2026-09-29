import { Glyph } from "./layout-components.js";
import { Tooltip } from "@biugle/react-components";

export function SidebarHeaderControl({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: "forward" | "back";
  onClick: () => void;
}) {
  return (
    <Tooltip content={label} onlyOverflow={false} className="biu-foundation-tooltip">
      <button type="button" className="biu-sidebar-header-control" aria-label={label} onClick={onClick}>
        <Glyph name={icon} />
      </button>
    </Tooltip>
  );
}
