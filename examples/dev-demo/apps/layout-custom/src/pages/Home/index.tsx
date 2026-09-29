import { useBiuContext, useBiuI18n } from "@biugle/biu-runtime";
import { Button, Dialog, biuMessage, fire } from "@biugle/react-components";

export default function CustomHome() {
  const { $t } = useBiuI18n();
  const context = useBiuContext();
  const openModal = () => {
    fire(Dialog)({
      title: $t("自定义 React 应用弹窗"),
      children: <p>{$t("这个弹窗由 fire(modal) 挂载到 body，业务页面可以完全自定义内容。")}</p>,
    });
  };
  const openBodyNode = () => {
    fire.render(({ close }) => (
      <section
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          zIndex: 100,
          width: 280,
          padding: 18,
          color: "#172033",
          background: "#fff",
          border: "1px solid #d9dee8",
          borderRadius: 4,
          boxShadow: "0 12px 32px rgb(15 23 42 / 18%)",
        }}
      >
        <strong>{$t("自定义 body 内容")}</strong>
        <p>{$t("这个内容由 fire.render 独立挂载，不依赖基座布局。")}</p>
        <Button size="small" variant="secondary" onClick={close}>
          {$t("关闭")}
        </Button>
      </section>
    ));
  };
  const publishEvent = () => {
    context.events.publish("demo:custom-action", { code: "CUSTOM_HOME" }, context.appId);
    biuMessage.success($t("事件已发布"));
  };
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 32,
        color: "#172033",
        background: "linear-gradient(135deg, #f4f7ff, #ffffff)",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div
          style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 48 }}
        >
          <strong>BIU / CUSTOM REACT</strong>
          <span>
            {context.locale} · {context.theme}
          </span>
        </div>
        <h1>{$t("自定义 React 模式")}</h1>
        <p>{$t("页面结构完全由项目自定义，基座只提供运行时能力")}</p>
        <p>
          <small>
            {context.appId} · {context.currentPath || "/"}
          </small>
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
          <Button size="small" onClick={openModal}>
            {$t("打开基座 Modal")}
          </Button>
          <Button size="small" variant="secondary" onClick={openBodyNode}>
            {$t("打开自定义 body 内容")}
          </Button>
          <Button size="small" variant="secondary" onClick={publishEvent}>
            {$t("发布应用事件")}
          </Button>
        </div>
      </div>
    </main>
  );
}
