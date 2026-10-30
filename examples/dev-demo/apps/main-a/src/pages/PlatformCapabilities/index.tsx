import { useState } from "react";
import { Button, Dialog, Drawer, Result, Stack, Tag } from "@biugle/react-components";
import { useBiuContext, useBiuI18n, useBiuLayoutControl } from "@biugle/biu-runtime";
import { CapabilityActions, CapabilityCard, CapabilityGrid, CapabilityPage } from "../CapabilityPage/index.js";

export default function PlatformCapabilities() {
  const context = useBiuContext();
  const { $t } = useBiuI18n();
  const { layoutOverrides, setLayoutOverrides, resetLayoutOverrides } = useBiuLayoutControl();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Translate feedback while rendering so a locale change also updates prior actions.
  const [messageKey, setMessageKey] = useState("等待操作");
  const dashboardMenuKey = "SystemConfig/SystemAdvanced/Dashboard";
  const values = [
    ["Portal", context.portalCode || "main-a"],
    ["APP ID", context.appId || "main-a"],
    ["Environment", context.environment || "local"],
    [$t("语言"), context.locale || "zh-CN"],
    [$t("主题"), context.theme || "light"],
    [$t("方向"), context.direction || "ltr"],
    [$t("时区"), context.timezone || "Asia/Shanghai"],
    [$t("认证"), context.auth?.authenticated ? $t("已认证") : $t("访客")],
  ];

  return (
    <CapabilityPage
      title={$t("基座能力展示")}
      description={$t("验证 LayoutFrame、Runtime 上下文、偏好控制和基座交互组件。")}
    >
      <CapabilityGrid>
        <CapabilityCard title={$t("运行上下文")}>
          <dl>
            {values.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </CapabilityCard>
        <CapabilityCard title={$t("布局覆盖")}>
          <p>{$t("页面级覆盖会在导航离开前由 Runtime 自动清理。")}</p>
          <CapabilityActions>
            <Button size="small" onClick={() => setLayoutOverrides({ hideSidebar: false, collapseSidebar: false })}>
              {$t("展开菜单栏")}
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setLayoutOverrides({ hideSidebar: false, collapseSidebar: true })}
            >
              {$t("折叠菜单栏")}
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setLayoutOverrides({ hideSidebar: true, collapseSidebar: false })}
            >
              {$t("隐藏菜单栏")}
            </Button>
            <Button size="small" variant="secondary" onClick={resetLayoutOverrides}>
              {$t("重置覆盖")}
            </Button>
          </CapabilityActions>
          <pre className="biu-capability-code">{JSON.stringify(layoutOverrides, null, 2)}</pre>
        </CapabilityCard>
        <CapabilityCard title={$t("统一弹层")}>
          <p>{$t("Dialog 与 Drawer 使用 Components Pro 入口，业务内容仍由页面负责。")}</p>
          <CapabilityActions>
            <Button size="small" onClick={() => setDialogOpen(true)}>
              {$t("打开 Dialog")}
            </Button>
            <Button size="small" variant="secondary" onClick={() => setDrawerOpen(true)}>
              {$t("打开 Drawer")}
            </Button>
          </CapabilityActions>
          <Stack align={"center"} gap={8} wrap="wrap" style={{ marginTop: 12 }}>
            <Tag color="success">ESC</Tag>
            <Tag color="info">{$t("遮罩")}</Tag>
            <Tag color="default">{$t("焦点恢复")}</Tag>
          </Stack>
        </CapabilityCard>
        <CapabilityCard title={$t("导航与反馈")}>
          <CapabilityActions>
            <Button
              size="small"
              onClick={() => {
                const success = context.navigateByKey(dashboardMenuKey);
                setMessageKey(success ? "已按完整菜单 key 导航到 Dashboard：{key}" : "导航失败，请检查菜单权限");
              }}
            >
              {$t("按完整菜单导航到 Dashboard")}
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => {
                context.events.publish("demo:platform", { at: new Date().toISOString() }, context.appId);
                setMessageKey("已发布 demo:platform 事件");
              }}
            >
              {$t("发布事件")}
            </Button>
          </CapabilityActions>
          <Result
            status="success"
            title={$t(messageKey, { key: dashboardMenuKey })}
            description={$t("事件总线、导航和布局由 Runtime 提供。")}
          />
        </CapabilityCard>
      </CapabilityGrid>
      <Dialog
        open={dialogOpen}
        title={$t("基座 Dialog")}
        description="Components Pro Dialog"
        onOpenChange={setDialogOpen}
        onOk={() => setMessageKey("Dialog 已确认")}
      >
        <p>{$t("遮罩、Escape、焦点恢复和关闭原因由 Components 统一维护。")}</p>
      </Dialog>
      <Drawer
        open={drawerOpen}
        title={$t("基座 Drawer")}
        description="Components Pro Drawer"
        placement="right"
        onOpenChange={setDrawerOpen}
      >
        <p>{$t("基座只提供布局与生命周期，Drawer 内容由当前页面提供。")}</p>
      </Drawer>
    </CapabilityPage>
  );
}
