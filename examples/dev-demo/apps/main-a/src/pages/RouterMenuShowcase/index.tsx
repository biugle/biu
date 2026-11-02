import { useState } from "react";
import { Button, Menu, Stack, Tag } from "@biugle/react-components/ui";
import { LinkByCode, useBiuContext, useBiuI18n } from "@biugle/biu-runtime";
import { CapabilityActions, CapabilityCard, CapabilityGrid, CapabilityPage } from "../CapabilityPage/index.js";

export default function RouterMenuShowcase() {
  const { $t } = useBiuI18n();
  const context = useBiuContext();
  const [selected, setSelected] = useState("Dashboard");
  const [message, setMessage] = useState("请选择一个能力");
  return (
    <CapabilityPage
      title="路由与菜单展示"
      description="使用完整 Code 和菜单查询 API 导航，不通过标题或 Code 关键词推断图标。"
    >
      <CapabilityGrid>
        <CapabilityCard title="导航 API">
          <CapabilityActions>
            <Button
              size="small"
              onClick={() =>
                setMessage(
                  context.navigateByCode("RuntimeCapabilities")
                    ? $t("navigateByCode 已执行（唯一 Code）")
                    : $t("未找到唯一 Code"),
                )
              }
            >
              navigateByCode
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() =>
                setMessage(
                  context.navigateByKey("PlatformCapabilities/PlatformCapabilities")
                    ? $t("navigateByKey 已执行")
                    : $t("未找到完整菜单 key"),
                )
              }
            >
              navigateByKey
            </Button>
          </CapabilityActions>
          <p>{message}</p>
          <pre className="biu-capability-code">
            resolveMenuPath("Dashboard") = {context.resolveMenuPath("Dashboard") || "undefined"}
          </pre>
          <LinkByCode code="RuntimeCapabilities">用 LinkByCode 打开 Runtime 能力</LinkByCode>
        </CapabilityCard>
        <CapabilityCard title="菜单组件">
          <Menu
            selectedKey={selected}
            onSelect={(key) => {
              setSelected(key);
              setMessage($t("选中菜单：{key}", { key }));
            }}
            items={[
              {
                key: "platform",
                label: "平台能力",
                children: [
                  { key: "Dashboard", label: "Dashboard" },
                  { key: "RuntimeCapabilities", label: "Runtime 能力" },
                ],
              },
              {
                key: "components",
                label: "组件能力",
                children: [{ key: "ComponentUIShowcase", label: "组件能力展示" }],
              },
            ]}
          />
          <Stack align={"center"} gap={8} wrap="wrap" style={{ marginTop: 12 }}>
            <Tag color="info">selected: {selected}</Tag>
          </Stack>
        </CapabilityCard>
      </CapabilityGrid>
    </CapabilityPage>
  );
}
