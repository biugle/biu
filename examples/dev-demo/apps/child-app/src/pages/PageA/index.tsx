import { useState } from "react";
import {
  useBiuAuth,
  useBiuContext,
  useBiuDirection,
  useBiuLocale,
  useBiuOverlay,
  useBiuTheme,
  useBiuTimezone,
} from "@biugle/biu-runtime";
import { Button, Drawer } from "@biugle/react-components";
import "@biugle/react-components/styles.css";
import { isSafeCode } from "@biugle/dev-demo-shared";
import "./styles.css";

export default function PageA() {
  const context = useBiuContext();
  const auth = useBiuAuth();
  const locale = useBiuLocale();
  const theme = useBiuTheme();
  const timezone = useBiuTimezone();
  const direction = useBiuDirection();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const requestOverlay = useBiuOverlay();
  const setOpen = (open: boolean) => {
    setDrawerOpen(open);
    requestOverlay({ ID: "demo-page-a-drawer", OPEN: open, MODE: "IFRAME", SCOPE: "HOST_CHROME" });
  };

  return (
    <section className="demo-page-a">
      <p className="demo-page-eyebrow">React Adapter · iframe APP</p>
      <h1>PageA 独立子应用</h1>
      <p>当前由独立 APP 服务提供，基座只负责加载、上下文和一致的外层布局。</p>
      <dl className="demo-context-grid">
        <div>
          <dt>当前门户</dt>
          <dd>{context.portalCode || "独立运行"}</dd>
        </div>
        <div>
          <dt>Code 校验</dt>
          <dd>{isSafeCode(context.currentCode || "PageA") ? "通过" : "失败"}</dd>
        </div>
        <div>
          <dt>运行环境</dt>
          <dd>{context.environment || "local"}</dd>
        </div>
        <div>
          <dt>当前语言</dt>
          <dd>{locale}</dd>
        </div>
        <div>
          <dt>时区</dt>
          <dd>{timezone}</dd>
        </div>
        <div>
          <dt>主题</dt>
          <dd>{theme}</dd>
        </div>
        <div>
          <dt>布局方向</dt>
          <dd>{direction}</dd>
        </div>
        <div>
          <dt>登录状态</dt>
          <dd>{auth?.authenticated ? `SSO · ${auth.user?.name || "已登录"}` : "未登录"}</dd>
        </div>
      </dl>
      <button type="button" onClick={() => setOpen(true)}>
        打开 Drawer
      </button>
      <Drawer
        open={drawerOpen}
        title="子应用 Drawer"
        placement="right"
        onOpenChange={setOpen}
        footer={<Button onClick={() => setOpen(false)}>关闭</Button>}
      >
        <p>遮罩覆盖子应用区域，Portal 的导航区域由基座同步遮罩。</p>
      </Drawer>
    </section>
  );
}
