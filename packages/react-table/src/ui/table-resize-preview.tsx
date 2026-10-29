import * as React from "react";
import type { ResizePreview } from "./resize-types.js";

interface TableResizePreviewProps {
  preview: ResizePreview;
  previewRef: React.RefObject<HTMLSpanElement | null>;
}

/** Render the existing resize guide independently from the table row model. */
export function TableResizePreview({ preview, previewRef }: TableResizePreviewProps) {
  if (!preview) return null;

  const isColumnPreview = preview.axis === "column";
  const className = isColumnPreview
    ? "biu-table__resize-preview biu-table__resize-preview--column"
    : "biu-table__resize-preview biu-table__resize-preview--row";
  const style: React.CSSProperties = isColumnPreview ? { left: preview.position } : { top: preview.position };

  return <span aria-hidden="true" className={className} style={style} ref={previewRef} />;
}
