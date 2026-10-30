import { useEffect, useRef, useState } from "react";
import { Anchor, ScrollProgress } from "@biugle/react-components/ui";
import { ConfigProvider } from "@biugle/react-components";
import { useBiuContext } from "@biugle/biu-runtime";
import { CapabilityGrid, CapabilityPage } from "../CapabilityPage/index.js";
import { IntroSections } from "./sections/intro-sections.js";
import { SelectionSections } from "./sections/selection-sections.js";
import { InputSections } from "./sections/input-sections.js";
import { DateOverlaySections } from "./sections/date-overlay-sections.js";
import { NavigationSections } from "./sections/navigation-sections.js";
import { FeedbackSections } from "./sections/feedback-sections.js";
import { LayoutFileSections } from "./sections/layout-file-sections.js";

function ComponentCatalogRenderer({
  pro,
  direction: controlledDirection,
  onDirectionChange,
}: {
  pro: boolean;
  direction?: "ltr" | "rtl";
  onDirectionChange?: (direction: "ltr" | "rtl") => void;
}) {
  const [uncontrolledDirection, setUncontrolledDirection] = useState<"ltr" | "rtl">("ltr");
  const showcaseDirection = controlledDirection ?? uncontrolledDirection;
  const setShowcaseDirection = onDirectionChange ?? setUncontrolledDirection;
  return (
    <CapabilityGrid>
      <IntroSections />
      <SelectionSections pro={pro} />
      <InputSections pro={pro} />
      <DateOverlaySections pro={pro} />
      <NavigationSections pro={pro} showcaseDirection={showcaseDirection} setShowcaseDirection={setShowcaseDirection} />
      <FeedbackSections pro={pro} showcaseDirection={showcaseDirection} setShowcaseDirection={setShowcaseDirection} />
      <LayoutFileSections pro={pro} showcaseDirection={showcaseDirection} setShowcaseDirection={setShowcaseDirection} />
    </CapabilityGrid>
  );
}

export function ComponentProCatalog() {
  return (
    <div className="biu-pro-component-catalog" data-biu-catalog-layer="pro">
      <ComponentCatalogRenderer pro />
    </div>
  );
}

export function ComponentUICatalog({
  direction,
  onDirectionChange,
}: {
  direction?: "ltr" | "rtl";
  onDirectionChange?: (direction: "ltr" | "rtl") => void;
} = {}) {
  // The catalog is the single documentation surface.  Use the richer preset
  // values here so the former Pro-only states are no longer hidden behind a
  // second page or a second menu entry.
  return <ComponentCatalogRenderer pro direction={direction} onDirectionChange={onDirectionChange} />;
}

export default function ComponentUIShowcase() {
  const catalogRef = useRef<HTMLDivElement>(null);
  const { locale, direction } = useBiuContext();
  // Keep the fixed catalog and reading-progress controls paired with the direction demo.
  const [showcaseDirection, setShowcaseDirection] = useState<"ltr" | "rtl">(direction === "rtl" ? "rtl" : "ltr");
  useEffect(() => {
    setShowcaseDirection(direction === "rtl" ? "rtl" : "ltr");
  }, [direction]);
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash) return;
    const resetScroll = () =>
      document.querySelector<HTMLElement>(".biu-page-content")?.scrollTo({ top: 0, behavior: "auto" });
    const frame = window.requestAnimationFrame(resetScroll);
    const timer = window.setTimeout(resetScroll, 80);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, []);
  return (
    <ConfigProvider locale={locale}>
      <CapabilityPage
        title="组件能力展示"
        description="所有组件按统一顺序逐块展示；效果案例和属性/方法表同时作为可运行文档，基础能力与企业场景能力不再拆成两套页面。"
      >
        {/* Keep unsupported demos in their original LTR baseline; supported components receive dir explicitly. */}
        <div className="biu-component-showcase-layout" dir="ltr">
          <div ref={catalogRef} className="biu-component-showcase-layout__content">
            <ComponentUICatalog direction={showcaseDirection} onDirectionChange={setShowcaseDirection} />
          </div>
          <Anchor
            dir={showcaseDirection}
            position="end"
            container={catalogRef}
            scrollContainer=".biu-page-content"
            id="component-ui-showcase-anchor"
            levels={[2, 3, 4, 5]}
            title="组件目录"
            collapsible
            defaultCollapsed={false}
            mode="fixed"
            draggable
            closable
          />
          <ScrollProgress
            dir={showcaseDirection}
            target=".biu-page-content"
            label="页面阅读进度"
            mode="fixed"
            position={showcaseDirection === "rtl" ? "bottom-left" : "bottom-right"}
          />
        </div>
      </CapabilityPage>
    </ConfigProvider>
  );
}
