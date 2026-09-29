import { useState } from "react";
import { Button, Dialog, Drawer, Result, Tag } from "@biugle/react-components";
import { useBiuContext, useBiuLayoutControl } from "@biugle/biu-runtime";
import { CapabilityActions, CapabilityCard, CapabilityGrid, CapabilityPage } from "../CapabilityPage/index.js";

export default function PlatformCapabilities() {
  const context = useBiuContext();
  const { layoutOverrides, setLayoutOverrides, resetLayoutOverrides } = useBiuLayoutControl();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [message, setMessage] = useState("等待操作");
  const dashboardMenuKey = "SystemConfig/SystemAdvanced/Dashboard";
  const values = [
    ["Portal", context.portalCode || "main-a"],
    ["APP ID", context.appId || "main-a"],
    ["Environment", context.environment || "local"],
    ["Locale", context.locale || "zh-CN"],
    ["Theme", context.theme || "light"],
    ["Direction", context.direction || "ltr"],
    ["Timezone", context.timezone || "Asia/Shanghai"],
    ["Auth", context.auth?.authenticated ? "authenticated" : "guest"],
  ];

  return (
    <CapabilityPage title="基座能力展示" description="验证 LayoutFrame、Runtime 上下文、偏好控制和基座交互组件。">
      <CapabilityGrid>
        <CapabilityCard title="运行上下文">
          <dl>
            {values.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </CapabilityCard>
        <CapabilityCard title="布局覆盖">
          <p>页面级覆盖会在导航离开前由 Runtime 自动清理。</p>
          <CapabilityActions>
            <Button
              size="small"
              onClick={() => setLayoutOverrides({ collapseSidebar: !layoutOverrides.collapseSidebar })}
            >
              {layoutOverrides.collapseSidebar ? "恢复侧栏" : "收起侧栏"}
            </Button>
            <Button size="small" variant="secondary" onClick={() => setLayoutOverrides({ hideSidebar: true })}>
              隐藏菜单栏
            </Button>
            <Button size="small" variant="secondary" onClick={resetLayoutOverrides}>
              重置覆盖
            </Button>
          </CapabilityActions>
          <pre className="biu-capability-code">{JSON.stringify(layoutOverrides, null, 2)}</pre>
        </CapabilityCard>
        <CapabilityCard title="统一弹层">
          <p>Dialog 与 Drawer 使用 Components Pro 入口，业务内容仍由页面负责。</p>
          <CapabilityActions>
            <Button size="small" onClick={() => setDialogOpen(true)}>
              打开 Dialog
            </Button>
            <Button size="small" variant="secondary" onClick={() => setDrawerOpen(true)}>
              打开 Drawer
            </Button>
          </CapabilityActions>
          <div className="biu-capability-actions" style={{ marginTop: 12 }}>
            <Tag color="success">ESC</Tag>
            <Tag color="info">Overlay</Tag>
            <Tag color="default">Focus restore</Tag>
          </div>
        </CapabilityCard>
        <CapabilityCard title="导航与反馈">
          <CapabilityActions>
            <Button
              size="small"
              onClick={() => {
                const success = context.navigateByKey(dashboardMenuKey);
                setMessage(
                  success ? `已按完整菜单 key 导航到 Dashboard：${dashboardMenuKey}` : "导航失败，请检查菜单权限",
                );
              }}
            >
              按完整菜单导航到 Dashboard
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => {
                context.events.publish("demo:platform", { at: new Date().toISOString() }, context.appId);
                setMessage("已发布 demo:platform 事件");
              }}
            >
              发布事件
            </Button>
          </CapabilityActions>
          <Result status="success" title={message} description="事件总线、导航和布局由 Runtime 提供。" />
        </CapabilityCard>
      </CapabilityGrid>
      <Dialog
        open={dialogOpen}
        title="基座 Dialog"
        description="Components Pro Dialog"
        onOpenChange={setDialogOpen}
        onOk={() => setMessage("Dialog 已确认")}
      >
        <p>遮罩、Escape、焦点恢复和关闭原因由 Components 统一维护。</p>
      </Dialog>
      <Drawer open={drawerOpen} title="基座 Drawer" description="Components Pro Drawer" onOpenChange={setDrawerOpen}>
        <p>基座只提供布局与生命周期，Drawer 内容由当前页面提供。</p>
      </Drawer>
    </CapabilityPage>
  );
}
