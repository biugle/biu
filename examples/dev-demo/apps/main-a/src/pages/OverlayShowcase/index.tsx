import { useState } from "react";
import { Button, Dialog, Drawer, Popconfirm, Popover, Result } from "@biugle/react-components";
import { CapabilityActions, CapabilityCard, CapabilityGrid, CapabilityPage } from "../CapabilityPage/index.js";

export default function OverlayShowcase() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPlacement, setDrawerPlacement] = useState<"left" | "right" | "top" | "bottom">("right");
  const [result, setResult] = useState("等待交互");
  return (
    <CapabilityPage
      title="Drawer / Dialog 展示"
      description="基座页面中的弹层统一使用 Components，不再维护 Demo 自己的 Modal/Drawer 实现。"
    >
      <CapabilityGrid>
        <CapabilityCard title="Dialog">
          <CapabilityActions>
            <Button onClick={() => setDialogOpen(true)}>打开 Dialog</Button>
            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
              打开 Drawer（{drawerPlacement}）
            </Button>
          </CapabilityActions>
          <CapabilityActions>
            {(["left", "right", "top", "bottom"] as const).map((placement) => (
              <Button
                key={placement}
                size="small"
                variant={drawerPlacement === placement ? "primary" : "ghost"}
                onClick={() => setDrawerPlacement(placement)}
              >
                {placement}
              </Button>
            ))}
          </CapabilityActions>
          <Dialog
            open={dialogOpen}
            title="Pro Dialog"
            description="支持受控状态与关闭原因"
            onOpenChange={setDialogOpen}
          >
            <p>确认按钮的 loading、ESC 和 overlay close 都属于组件能力。</p>
          </Dialog>
          <Drawer open={drawerOpen} title="Pro Drawer" placement={drawerPlacement} onOpenChange={setDrawerOpen}>
            <p>抽屉内容由调用方传入，样式与布局由组件包统一维护。</p>
          </Drawer>
        </CapabilityCard>
        <CapabilityCard title="Popover / Popconfirm">
          <CapabilityActions>
            <Popover content={<p>Popover content</p>}>
              <Button variant="secondary">打开 Popover</Button>
            </Popover>
            <Popconfirm
              title="确认执行这个操作？"
              onConfirm={() => setResult("已确认")}
              onCancel={() => setResult("已取消")}
            >
              <Button variant="secondary">打开 Popconfirm</Button>
            </Popconfirm>
          </CapabilityActions>
          <Result status="info" title={result} />
        </CapabilityCard>
      </CapabilityGrid>
    </CapabilityPage>
  );
}
