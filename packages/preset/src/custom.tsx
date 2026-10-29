import type { LayoutContentProps } from "@biugle/biu-runtime";

/** Custom mode deliberately owns the page chrome; the foundation only supplies runtime APIs and fallbacks. */
export function CustomLayout({ children }: LayoutContentProps) {
  return <div className="biu-layout biu-custom-layout">{children}</div>;
}
