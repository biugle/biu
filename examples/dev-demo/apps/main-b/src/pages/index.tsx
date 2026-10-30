import { useBiuI18n } from "@biugle/biu-runtime";

export default function MainBHome() {
  const { $t } = useBiuI18n();
  return (
    <section>
      <h1>main-b Portal</h1>
      <p>{$t("这是独立部署的第二个门户。")}</p>
      <p>{$t("它与 main-a 使用同一个 Child APP，但运行在独立服务。")}</p>
    </section>
  );
}
