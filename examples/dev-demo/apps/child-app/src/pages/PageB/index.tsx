import { useBiuI18n } from "@biugle/biu-runtime";

export default function PageB() {
  const { $t } = useBiuI18n();
  return (
    <section>
      <h1>{$t("PageB 独立子应用")}</h1>
      <p>{$t("门户通过当前环境配置按需加载当前页面。")}</p>
    </section>
  );
}
