import { useState, type ReactNode } from "react";
import { useBiuContext } from "@biugle/biu-runtime";
import { Button, Dialog, Drawer } from "@biugle/react-components";
import { ArrowLeftRight, Check, Clock3, Command, Grid2X2, Languages, PanelLeft, Server } from "@biugle/icons";
import "@biugle/react-components/styles.css";
import "./styles.css";

const copy = {
  "zh-CN": {
    eyebrow: "BIU WORKSPACE",
    title: "运行时布局演示",
    description: "主应用、独立子应用和 iframe 联调共用同一套可配置布局能力。",
    currentPortal: "当前门户",
    layout: "布局模式",
    theme: "主题",
    language: "语言",
    timezone: "时区",
    direction: "方向",
    environment: "运行环境",
    capabilities: "可直接验证的能力",
    capabilityItems: [
      "Header：门户、语言、时区、主题和用户操作",
      "侧边栏：路由感知的激活状态和收起控制",
      "Sidebar / Topbar / Blank：由门户配置决定的应用外壳",
      "iframe 子应用：生命周期、上下文和遮罩同步",
    ],
    development: "开发方式",
    developmentDescription: "主应用和子应用均可独立启动，也可以由门户联调启动。",
    local: "本地环境",
    ready: "运行正常",
    openDrawer: "打开抽屉示例",
    openModal: "打开弹窗示例",
    close: "关闭",
    drawerTitle: "基座抽屉示例",
    modalTitle: "基座弹窗示例",
    drawerDescription: "这是门户页面自己的抽屉。子应用的 iframe 抽屉会通过协议同步遮罩到门户导航区域。",
    modalDescription: "这是常见的确认弹窗场景，页面代码只维护业务内容，基座负责一致的交互上下文。",
  },
  "en-US": {
    eyebrow: "BIU WORKSPACE",
    title: "Runtime Layout Playground",
    description: "The portal, standalone apps, and iframe integration share one configurable shell.",
    currentPortal: "Active portal",
    layout: "Layout mode",
    theme: "Theme",
    language: "Language",
    timezone: "Time zone",
    direction: "Direction",
    environment: "Environment",
    capabilities: "Ready-to-test capabilities",
    capabilityItems: [
      "Header: portal, language, timezone, theme and user controls",
      "Sidebar: active route state and collapse control",
      "Sidebar / Topbar / Blank: selected by portal configuration",
      "iframe apps: lifecycle, context and overlay synchronization",
    ],
    development: "Development modes",
    developmentDescription: "Run the portal and child applications separately or together.",
    local: "Local environment",
    ready: "Running",
    openDrawer: "Open drawer",
    openModal: "Open modal",
    close: "Close",
    drawerTitle: "Shell drawer demo",
    modalTitle: "Shell modal demo",
    drawerDescription:
      "This portal-owned drawer demonstrates the common interaction. An iframe child drawer synchronizes its mask to the portal chrome.",
    modalDescription:
      "This is a common confirmation modal. The page owns business content while the shell owns consistent context.",
  },
} as const;

export default function Dashboard() {
  const context = useBiuContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const text = copy[context.locale === "en-US" ? "en-US" : "zh-CN"];
  const stats: Array<[string, string, ReactNode]> = [
    [text.currentPortal, context.portalCode || "main-a", <PanelLeft size={15} aria-hidden="true" />],
    [text.layout, "Sidebar", <Grid2X2 size={15} aria-hidden="true" />],
    [text.theme, context.theme || "light", <Server size={15} aria-hidden="true" />],
    [text.language, context.locale || "zh-CN", <Languages size={15} aria-hidden="true" />],
    [text.timezone, context.timezone || "Asia/Shanghai", <Clock3 size={15} aria-hidden="true" />],
    [text.direction, context.direction || "ltr", <ArrowLeftRight size={15} aria-hidden="true" />],
    [text.environment, context.environment || "local", <Command size={15} aria-hidden="true" />],
  ];

  return (
    <div className="biu-dashboard-page">
      <section className="biu-dashboard-hero">
        <div>
          <p className="biu-dashboard-eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p className="biu-dashboard-description">{text.description}</p>
        </div>
        <div className="biu-dashboard-status">
          <span />
          {text.local}
          <strong>{text.ready}</strong>
        </div>
      </section>
      <section className="biu-dashboard-actions" aria-label={text.capabilities}>
        <Button type="primary" onClick={() => setModalOpen(true)}>
          {text.openModal}
        </Button>
        <Button type="default" variant="outlined" onClick={() => setDrawerOpen(true)}>
          {text.openDrawer}
        </Button>
      </section>
      <div className="biu-dashboard-stats">
        {stats.map(([label, value, icon]) => (
          <article className="biu-dashboard-stat" key={label}>
            <div className="biu-dashboard-stat-head">
              <span>{label}</span>
              <b>{icon}</b>
            </div>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="biu-dashboard-columns">
        <section className="biu-dashboard-card">
          <div className="biu-dashboard-card-head">
            <div>
              <h2>{text.capabilities}</h2>
              <p>{context.timezone || "Asia/Shanghai"}</p>
            </div>
            <span className="biu-dashboard-card-mark">
              <Check size={15} aria-hidden="true" />
            </span>
          </div>
          <ul>
            {text.capabilityItems.map((item) => (
              <li key={item}>
                <span>
                  <Check size={14} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section className="biu-dashboard-card">
          <div className="biu-dashboard-card-head">
            <div>
              <h2>{text.development}</h2>
              <p>{text.developmentDescription}</p>
            </div>
            <span className="biu-dashboard-card-mark">⌘</span>
          </div>
          <div className="biu-dashboard-commands">
            <code>pnpm start --filter main-a</code>
            <code>pnpm start --filter child-app</code>
            <code>pnpm start --filter main-a -- --apps ../child-app</code>
          </div>
        </section>
      </div>
      <Dialog open={modalOpen} title={text.modalTitle} description={text.capabilities} onOpenChange={setModalOpen}>
        <p>{text.modalDescription}</p>
      </Dialog>
      <Drawer
        open={drawerOpen}
        title={text.drawerTitle}
        description={text.capabilities}
        placement="right"
        onOpenChange={setDrawerOpen}
      >
        <p>{text.drawerDescription}</p>
      </Drawer>
    </div>
  );
}
