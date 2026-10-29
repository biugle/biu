import { useEffect, useRef, type ReactNode } from "react";
import { createWatermark, type WatermarkOptions } from "@biugle/watermark";

export function WatermarkedLayout({
  className,
  dir = "ltr",
  options,
  fallbackText,
  children,
}: {
  className: string;
  dir?: "ltr" | "rtl";
  options?: WatermarkOptions & { enabled?: boolean };
  fallbackText: string;
  children: ReactNode;
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const serializedOptions = JSON.stringify(options ?? null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !options) return;
    const { enabled, ...watermarkOptions } = options;
    if (enabled === false) return;
    const handle = createWatermark(target, {
      ...watermarkOptions,
      text: watermarkOptions.text ?? fallbackText,
    });
    return handle.destroy;
  }, [fallbackText, serializedOptions]);

  return (
    <div ref={targetRef} className={className} dir={dir}>
      {children}
    </div>
  );
}
