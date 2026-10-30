import { Button, Grid, PageFilter, PageFilterItem, TextField, Title } from "@biugle/react-components";
import { useBiuI18n } from "@biugle/biu-runtime";
import { CapabilityCard } from "../../CapabilityPage/index.js";
export function FilterLayoutExamples() {
  const { $t } = useBiuI18n();
  const actions = (
    <>
      <Button type="secondary" size="small">
        {$t("重置")}
      </Button>
      <Button type="dark" size="small">
        {$t("查询")}
      </Button>
    </>
  );
  const item = (label: string, placeholder = label, tooltip?: string) => (
    <PageFilterItem key={label} label={$t(label)} tooltip={tooltip ? $t(tooltip) : undefined}>
      <TextField size="small" placeholder={$t(placeholder)} />
    </PageFilterItem>
  );
  return (
    <CapabilityCard
      title={$t("筛选区布局案例")}
      description={$t(
        "同一套 PageFilter 会根据字段数量呈现单行、两行和超出两行自动收敛到更多筛选。操作区始终作为同级 item 对齐。",
      )}
    >
      <Grid columns={1} gap={16}>
        <section>
          <Title level={5}>{$t("单行")}</Title>
          <PageFilter maxRows={1} actions={actions}>
            {item("关键字", "关键字", "支持按能力名称或负责人搜索。")}
            {item("状态")}
          </PageFilter>
        </section>
        <section>
          <Title level={5}>{$t("两行")}</Title>
          <PageFilter maxRows={2} actions={actions}>
            {item("关键字")}
            {item("状态")}
            {item("负责人")}
            {item("版本")}
            {item("归属团队")}
          </PageFilter>
        </section>
        <section>
          <Title level={5}>{$t("超出两行")}</Title>
          <PageFilter maxRows={2} actions={actions} drawerTitle={$t("全部筛选条件")}>
            {item("关键字")}
            {item("状态")}
            {item("负责人")}
            {item("版本")}
            {item("归属团队")}
            {item("更新时间")}
            {item("创建人")}
            {item("数据来源")}
            {item("区域名称")}
            {item("区域标签")}
            {item("上架方式")}
            {item("业务渠道")}
          </PageFilter>
        </section>
      </Grid>
    </CapabilityCard>
  );
}
