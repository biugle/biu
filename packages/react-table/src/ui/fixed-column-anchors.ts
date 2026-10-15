/** Keep fixed groups on their physical sides without reversing ordinary RTL
 * order. RTL reserves the opposite fixed widths in natural table layout;
 * shift the ordinary block by that difference, then anchor each fixed cell.
 */
export function syncFixedColumnAnchors(scroll: HTMLElement | null, table: HTMLTableElement | null) {
  if (!scroll || !table) return;
  const rtl = getComputedStyle(scroll).direction === "rtl";
  scroll.dataset.biuDirection = rtl ? "rtl" : "ltr";
  const viewport = scroll.getBoundingClientRect();
  const viewportWidth = scroll.clientWidth || viewport.width;
  const bounds = table.getBoundingClientRect();
  const tableWidth = bounds.width || Number.parseFloat(table.style.width) || 0;
  if (viewportWidth <= 0 || tableWidth <= 0) return;
  const viewportLeft = viewport.left + scroll.clientLeft;
  const viewportRight = viewportLeft + viewportWidth;
  let leftWidth = 0;
  let rightWidth = 0;
  for (const col of table.querySelectorAll<HTMLTableColElement>("col")) {
    if (col.closest("table") !== table) continue;
    const width = col.getBoundingClientRect().width || Number.parseFloat(col.style.width) || 0;
    if (
      col.dataset.biuFixed === "left" ||
      col.classList.contains("biu-table__selection-col") ||
      col.classList.contains("biu-table__expand-col")
    )
      leftWidth += width;
    else if (col.dataset.biuFixed === "right") rightWidth += width;
  }
  const ordinaryShift = rtl ? leftWidth - rightWidth : 0;
  scroll.style.setProperty("--biu-table-ordinary-shift", `${ordinaryShift}px`);
  const updates: Array<[HTMLElement, number]> = [];
  for (const cell of table.querySelectorAll<HTMLElement>(
    "th[data-biu-fixed], td[data-biu-fixed], .biu-table__selection-cell, .biu-table__expand-cell",
  )) {
    if (cell.closest("table") !== table) continue;
    const rect = cell.getBoundingClientRect();
    if (rect.width <= 0) continue;
    const side = cell.dataset.biuFixed === "right" ? "right" : "left";
    const offset = Number.parseFloat(getComputedStyle(cell)[side]);
    if (!Number.isFinite(offset)) continue;
    const previous = Number.parseFloat(cell.style.getPropertyValue("--biu-table-fixed-shift")) || 0;
    const naturalEdge = (side === "left" ? rect.left : rect.right) - previous;
    const target = side === "left" ? viewportLeft + offset : viewportRight - offset;
    updates.push([cell, target - naturalEdge]);
  }
  for (const [cell, shift] of updates)
    cell.style.setProperty("--biu-table-fixed-shift", `${Math.abs(shift) < 0.001 ? 0 : shift}px`);
}
