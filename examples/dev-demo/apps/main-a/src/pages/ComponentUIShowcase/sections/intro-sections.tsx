import { useState } from "react";
import { Button, ButtonGroup, Detail, Tag } from "@biugle/react-components/ui";
import { biuMessage } from "@biugle/react-components";
import { useBiuContext, useBiuI18n } from "@biugle/biu-runtime";
import { Check, Plus, Settings } from "@biugle/icons";
import { CapabilityActions } from "../../CapabilityPage/index.js";
import { Section } from "../section.js";

export function IntroSections() {
  const { $t } = useBiuI18n();
  const { locale } = useBiuContext();
  const [buttonClicks, setButtonClicks] = useState(0);
  const showButtonMessage = (type: "primary" | "warning" | "error" | "success" | "secondary" | "dark" | "default") => {
    setButtonClicks((value) => value + 1);
    const messageType = type === "dark" ? "primary" : type === "secondary" ? "info" : type;
    biuMessage[messageType]($t("{type} 按钮已点击", { type }), { locale });
  };
  return (
    <>
      <Section
        id="button"
        title="按钮 Button / ButtonGroup"
        description="语义类型、contained/text/outlined、图标位置、loading、readonly、block 和交互反馈。"
      >
        <ButtonGroup className="biu-showcase-button-group">
          <Button type="primary" onClick={() => showButtonMessage("primary")}>
            Primary
          </Button>
          <Button type="warning" onClick={() => showButtonMessage("warning")}>
            Warning
          </Button>
          <Button type="error" onClick={() => showButtonMessage("error")}>
            Error
          </Button>
          <Button
            type="success"
            icon={<Check size={15} />}
            iconPosition="after"
            onClick={() => showButtonMessage("success")}
          >
            Success
          </Button>
          <Button type="secondary" onClick={() => showButtonMessage("secondary")}>
            Secondary
          </Button>
          <Button type="dark" shape="round" onClick={() => showButtonMessage("dark")}>
            Dark
          </Button>
          <Button type="default" loading>
            Loading
          </Button>
          <Button
            type="default"
            variant="outlined"
            icon={<Plus size={14} />}
            iconPosition="before"
            iconSize={14}
            onClick={() => showButtonMessage("default")}
          >
            Default
          </Button>
          <Button type="secondary" size="small" onlyIcon icon={<Settings size={15} />} aria-label="独立图标按钮">
            独立图标按钮
          </Button>
        </ButtonGroup>
        <CapabilityActions>
          <span>点击次数：{buttonClicks}</span>
          <Button type="primary" variant="outlined" block>
            Block 按钮
          </Button>
        </CapabilityActions>
      </Section>
      <Section
        id="detail"
        title="详情 Detail"
        description="通过 data、sections 和字段配置渲染分组详情；支持跨列、自定义值、状态标签、tooltip 和长文本省略。"
      >
        <Detail
          data={{
            code: "DEMO-001",
            name: "示例服务节点",
            type: "演示机构",
            status: "启用",
            address: "示例地址：组件能力展示环境",
            owner: "演示用户",
          }}
          sections={[
            {
              key: "basic",
              title: "示例分组一",
              items: [
                { key: "code", title: "示例编号" },
                { key: "name", title: "示例名称", tooltip: "用于展示详情记录的示例名称。" },
                { key: "type", title: "示例类型", tooltip: "用于展示详情字段说明。" },
                {
                  key: "status",
                  title: "示例状态",
                  render: (value) => <Tag color="success">{String(value ?? "-")}</Tag>,
                },
              ],
            },
            {
              key: "location",
              title: "示例分组二",
              items: [
                {
                  key: "address",
                  title: "示例说明",
                  tooltip: "用于演示长文本 tooltip 和省略显示。",
                  ellipsis: { maxWidth: 140 },
                },
                { key: "owner", title: "示例负责人", span: 2 },
              ],
            },
          ]}
        />
      </Section>
    </>
  );
}
