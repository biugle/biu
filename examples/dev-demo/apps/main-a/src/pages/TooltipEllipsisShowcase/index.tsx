import { Ellipsis, Tag, Tooltip } from "@biugle/react-components/ui";
import { CapabilityCard, CapabilityGrid, CapabilityPage } from "../CapabilityPage/index.js";

export default function TooltipEllipsisShowcase() {
  return (
    <CapabilityPage
      title="Tooltip / Ellipsis 展示"
      description="基座只保留布局骨架，溢出检测和提示交互统一来自 Components。"
    >
      <CapabilityGrid>
        <CapabilityCard title="Tooltip">
          <Tooltip content="这是组件 Tooltip 提供的完整说明" onlyOverflow={false}>
            <Tag color="info">悬停或聚焦查看 Tooltip</Tag>
          </Tooltip>
          <p>Tooltip 支持 placement、onlyOverflow、ResizeObserver 和键盘聚焦。</p>
        </CapabilityCard>
        <CapabilityCard title="Ellipsis">
          <Ellipsis content="短文本不会显示 Tooltip。" maxWidth={240} lines={1}>
            短文本不会显示 Tooltip。
          </Ellipsis>
          <Ellipsis
            content="这是一段很长的文本，只有发生真实溢出时才会显示完整内容。"
            lines={1}
            maxWidth={240}
            style={{ marginTop: 8 }}
          >
            这是一段很长的文本，只有发生真实溢出时才会显示完整内容。调整窗口宽度可重新检测。
          </Ellipsis>
          <Ellipsis maxWidth={240} alwaysTooltip>
            alwaysTooltip：即使文本没有溢出也始终显示完整 Tooltip。
          </Ellipsis>
          <p>Ellipsis 复用 Tooltip 的真实溢出判断，不再重复维护另一套 tooltip 样式。</p>
        </CapabilityCard>
      </CapabilityGrid>
    </CapabilityPage>
  );
}
