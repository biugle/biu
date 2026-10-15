import { useBiuI18n } from "@biugle/biu-runtime";

export default function MainAHome() {
  const { $t } = useBiuI18n();
  return (
    <section>
      <h1>main-a Portal</h1>
      <p>{$t("这是独立部署的第一个门户。")}</p>
      <p>{$t("子应用通过当前环境配置按需加载。")}</p>
    </section>
  );
}
