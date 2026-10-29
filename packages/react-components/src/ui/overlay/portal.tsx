import * as React from "react";
import { createPortal } from "react-dom";

export function BiuPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return <>{children}</>;
  return createPortal(children, document.body);
}
