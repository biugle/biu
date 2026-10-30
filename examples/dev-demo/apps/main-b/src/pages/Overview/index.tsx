import { useBiuI18n } from "@biugle/biu-runtime";

export default function Overview() {
  const { $t } = useBiuI18n();
  return (
    <section>
      <h1>{$t("B 门户概览")}</h1>
      <p>{$t("这是 main-b 门户自己的设计页面。")}</p>
    </section>
  );
}
