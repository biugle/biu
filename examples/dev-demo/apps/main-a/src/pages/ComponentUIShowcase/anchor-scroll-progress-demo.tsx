import * as React from "react";
import { Anchor, ScrollProgress } from "@biugle/react-components/ui";
import { useBiuI18n } from "@biugle/biu-runtime";
import { DirectionSwitch } from "./direction-switch.js";

export function AnchorScrollProgressDemo({
  direction,
  onDirectionChange,
}: {
  direction: "ltr" | "rtl";
  onDirectionChange: (direction: "ltr" | "rtl") => void;
}) {
  const scrollDemoRef = React.useRef<HTMLDivElement>(null);
  const { $t } = useBiuI18n();

  return (
    <>
      <DirectionSwitch value={direction} onChange={onDirectionChange} />
      <div className="biu-showcase-anchor-layout" dir={direction}>
        <div ref={scrollDemoRef} className="biu-showcase-anchor-layout__viewport">
          <div className="biu-showcase-anchor-layout__content">
            <h3>{$t("组件概览")}</h3>
            <p>{$t("Anchor 会扫描当前内容容器中的标题，并为没有 id 的标题生成稳定锚点。")}</p>
            <h4>{$t("自动识别层级")}</h4>
            <p>{$t("最多支持 h1 到 h5；层级通过缩进表达，当前滚动位置会高亮对应标题。")}</p>
            <h5>{$t("可访问的链接")}</h5>
            <p>{$t("每个目录项都是带 href 的真实链接，支持键盘聚焦、点击定位和自定义偏移。")}</p>
            <h3>{$t("滚动状态")}</h3>
            <p>{$t("ScrollProgress 可监听窗口，也可监听表格、Drawer 或本示例这样的独立滚动容器。")}</p>
            <h4>{$t("进度与回顶")}</h4>
            <p>{$t("底部进度条按 scrollTop 与可滚动总高度计算；滚动超过阈值后显示小型回顶按钮。")}</p>
            <h5>{$t("保持组件轻量")}</h5>
            <p>{$t("组件只注册必要的 scroll、resize 和 ResizeObserver 监听，卸载时会完整清理。")}</p>
          </div>
        </div>
        <aside className="biu-showcase-anchor-layout__aside">
          {/* Static progress stays in the same direction-aware side rail as this Anchor. */}
          <Anchor
            dir={direction}
            container={scrollDemoRef}
            scrollContainer={scrollDemoRef}
            levels={[3, 4, 5]}
            offsetTop={12}
            title={$t("本区目录")}
            collapsible
            arrowPosition="right"
            mode="static"
            hideOnMobile={false}
          />
          <div className="biu-showcase-anchor-layout__progress">
            <ScrollProgress
              dir={direction}
              target={scrollDemoRef}
              label={$t("本区内容阅读进度说明")}
              backTopMode="always"
              mode="static"
            />
            <ScrollProgress dir={direction} target={scrollDemoRef} mobileMode backTopMode="always" mode="static" />
          </div>
        </aside>
      </div>
    </>
  );
}
