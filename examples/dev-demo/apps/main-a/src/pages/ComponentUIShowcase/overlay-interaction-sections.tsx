import type { ReactNode } from "react";
import { useBiuContext } from "@biugle/biu-runtime";
import { biuMessage } from "@biugle/react-components";
import { Button, CopyText, Ellipsis, Stack, Tooltip } from "@biugle/react-components/ui";

type SectionProps = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
};

/** Keeps overlay interaction examples separate from the large ordered catalogue. */
export function OverlayInteractionSections({
  pro,
  renderSection,
}: {
  pro: boolean;
  renderSection: (props: SectionProps) => ReactNode;
}) {
  const { locale } = useBiuContext();
  void locale;

  return (
    <>
      {renderSection({
        id: "tooltip",
        title: "提示 Tooltip",
        description:
          "桌面通过悬浮或键盘聚焦查看；触屏长按约 700ms 显示，移动超过 10px 会取消，短按仍执行原操作。可用 touchActivation 关闭触屏长按。",
        children: (
          <>
            <Tooltip content="固定说明类提示" color={pro ? "#0f766e" : undefined}>
              <Button type="default" variant="text">
                悬停或长按查看 Tooltip
              </Button>
            </Tooltip>
            <Tooltip content="只有溢出时显示" onlyOverflow>
              <span style={{ display: "inline-block", maxWidth: 180 }}>这是一个很长的溢出提示示例</span>
            </Tooltip>
            <Tooltip content="触屏长按提示已关闭" touchActivation={false}>
              <Button type="default" variant="text" onClick={() => biuMessage.info("短按操作仍然执行", { locale })}>
                关闭触屏长按
              </Button>
            </Tooltip>
          </>
        ),
      })}
      {renderSection({
        id: "ellipsis",
        title: "省略 Ellipsis",
        description: "自动测量溢出，也支持 maxWidth 和多行；触屏长按可查看完整溢出文本，滚动手势不会触发提示。",
        children: (
          <>
            <Ellipsis maxWidth={pro ? 320 : 220} lines={pro ? 2 : 1}>
              基座和业务页面中的超长文本都会自动检测并在需要时显示完整 Tooltip 内容。
            </Ellipsis>
            <Ellipsis maxWidth={pro ? 320 : 220} alwaysTooltip>
              即使没有溢出也可以通过 alwaysTooltip 永远显示完整 Tooltip。
            </Ellipsis>
          </>
        ),
      })}
      {renderSection({
        id: "copy-text",
        title: "复制文本 CopyText",
        description: "在 Ellipsis 后提供统一复制按钮；copyOnHover 在桌面仅悬浮/聚焦时显示，触屏设备常显复制入口。",
        children: (
          <Stack align="center" gap={10} wrap="wrap">
            <CopyText
              text="这是一段可以复制的长文本，展示区域会根据宽度自动省略，点击右侧图标即可复制完整值。"
              maxWidth={pro ? 360 : 240}
              alwaysTooltip
              onCopy={() => {
                biuMessage.success("文本已复制");
              }}
            />
            <CopyText
              text="悬停或聚焦后显示复制按钮"
              maxWidth={pro ? 260 : 200}
              copyOnHover
              content="桌面悬停/聚焦或触屏设备显示复制按钮"
            />
          </Stack>
        ),
      })}
    </>
  );
}
