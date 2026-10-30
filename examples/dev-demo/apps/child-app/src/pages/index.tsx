import { useBiuI18n } from "@biugle/biu-runtime";

export default function ChildHome() {
  const { $t } = useBiuI18n();
  return (
    <section>
      <h1>Child APP</h1>
      <p>{$t("这是独立 React 子应用的固定首页。")}</p>
    </section>
  );
}
