import { useBiuI18n } from "@biugle/biu-runtime";
import * as React from "react";
import { useState } from "react";
import { Button, Cascader, Ellipsis, Select } from "@biugle/react-components/ui";
import { biuMessage } from "@biugle/react-components";
import { X } from "@biugle/icons";
import { useCatalogOptions } from "../catalog-options.js";
import { Section } from "../section.js";
import type { CatalogSectionProps } from "../catalog-types.js";

const selectLazyCatalog = Array.from({ length: 600 }, (_, index) => {
  const serial = String(index + 1).padStart(3, "0");
  return { label: `服务节点 ${serial}`, value: `service-${serial}` };
});
const cascaderLazyCatalog = Array.from({ length: 600 }, (_, index) => {
  const serial = String(index + 1).padStart(3, "0");
  return { label: `远程节点 ${serial}`, value: `remote-node-${serial}`, isLeaf: true };
});
const cascaderLazyPageSize = 40;
export function SelectionSections({ pro }: CatalogSectionProps) {
  const { $t } = useBiuI18n();
  const options = useCatalogOptions(pro);
  const [basicSelect, setBasicSelect] = useState("platform");
  const [select, setSelect] = useState<string | string[]>(pro ? ["platform"] : "platform");
  const [multiSelect, setMultiSelect] = useState<string[]>([
    "short",
    "platform",
    "product",
    "design",
    "quality",
    "operations",
  ]);
  const [unknownSelect, setUnknownSelect] = useState("backend-team-unknown");
  const [lazySelect, setLazySelect] = useState("service-001");
  const [lazySelectSearch, setLazySelectSearch] = useState("");
  const [lazySelectOptions, setLazySelectOptions] = useState(() => selectLazyCatalog.slice(0, 20));
  const [lazySelectLoadedCount, setLazySelectLoadedCount] = useState(20);
  const [lazySelectLoading, setLazySelectLoading] = useState(false);
  const [cascade, setCascade] = useState<string[]>(["china", "east", "shanghai"]);
  const [unknownCascade, setUnknownCascade] = useState<string[]>([
    "backend-domain-unknown",
    "backend-region-unknown",
    "backend-node-unknown",
  ]);
  const [cascaderLazyLoadedCount, setCascaderLazyLoadedCount] = useState(0);
  const multiSelectOptions = React.useMemo(
    () => [
      { label: "短", value: "short" },
      ...options,
      { label: "超长选项：这是用于验证多选标签最大宽度和省略提示的演示内容", value: "very-long" },
    ],
    [options],
  );
  return (
    <>
      <Section
        id="cascader"
        title="级联选择 Cascader"
        description="提供无搜索、全列搜索和指定第四层搜索/增量懒加载三个案例；搜索只过滤当前列，第四层首屏 40 条，支持滚动到底或点击加载更多，数据总量 600 条。"
      >
        <div className="biu-capability-cascader-demos">
          <div className="biu-capability-cascader-demo">
            <span>基础级联（无搜索）</span>
            <Cascader
              options={[
                {
                  label: "中国",
                  value: "china",
                  children: [
                    {
                      label: "华东",
                      value: "east",
                      children: [
                        { label: "上海", value: "shanghai" },
                        { label: "杭州", value: "hangzhou" },
                      ],
                    },
                    { label: "华南（暂不可选）", value: "south", disabled: true },
                  ],
                },
                { label: "海外", value: "overseas", children: [{ label: "新加坡", value: "singapore" }] },
              ]}
              value={cascade}
              onChange={setCascade}
              optionRender={(option) => <span>{option.label}</span>}
            />
          </div>
          <div className="biu-capability-cascader-demo">
            <span>各级搜索</span>
            <Cascader
              options={[
                {
                  label: "中国",
                  value: "china-search",
                  children: [
                    {
                      label: "华东",
                      value: "east-search",
                      children: [
                        { label: "上海", value: "shanghai-search" },
                        { label: "杭州", value: "hangzhou-search" },
                      ],
                    },
                    { label: "华南", value: "south-search", children: [{ label: "深圳", value: "shenzhen-search" }] },
                  ],
                },
                { label: "海外", value: "overseas-search", children: [{ label: "新加坡", value: "singapore-search" }] },
              ]}
              searchable
              placeholder="可搜索当前列"
              optionRender={(option) => <span>{option.label}</span>}
            />
          </div>
          <div className="biu-capability-cascader-demo">
            <span>后端未知路径回显（当前 options 未加载）</span>
            <Cascader
              options={[{ label: "已知业务域", value: "known-domain", isLeaf: true }]}
              value={unknownCascade}
              onChange={setUnknownCascade}
              placeholder="后端未知路径"
            />
          </div>
          <div className="biu-capability-cascader-demo">
            <span>第四层搜索与懒加载（600 条）</span>
            <Cascader
              options={[
                {
                  label: "业务域",
                  value: "domain",
                  children: [
                    {
                      label: "仓库",
                      value: "warehouse",
                      children: [{ label: "远程节点目录", value: "remote-catalog", hasChildren: true }],
                    },
                  ],
                },
              ]}
              defaultValue={[]}
              searchLevels={[3]}
              searchable
              placeholder="先选择到第四层"
              loadChildren={async () => {
                await new Promise((resolve) => window.setTimeout(resolve, 180));
                setCascaderLazyLoadedCount(cascaderLazyPageSize);
                return cascaderLazyCatalog.slice(0, cascaderLazyPageSize);
              }}
              hasMore={(option, level, searchValue) =>
                level === 3 && !searchValue && cascaderLazyLoadedCount < cascaderLazyCatalog.length
              }
              loadMoreTrigger="both"
              loadMoreText="点击加载更多"
              loadMoreChildren={async (_option, level, currentOptions, searchValue) => {
                await new Promise((resolve) => window.setTimeout(resolve, 120));
                if (level !== 3 || searchValue) return [];
                const next = cascaderLazyCatalog.slice(
                  currentOptions.length,
                  currentOptions.length + cascaderLazyPageSize,
                );
                setCascaderLazyLoadedCount(currentOptions.length + next.length);
                return next;
              }}
              loadSearchChildren={async (_option, level, searchValue) => {
                await new Promise((resolve) => window.setTimeout(resolve, 120));
                if (level !== 3) return [];
                const query = searchValue.trim().toLowerCase();
                return query
                  ? cascaderLazyCatalog
                      .filter((item) => item.label.toLowerCase().includes(query))
                      .slice(0, cascaderLazyPageSize)
                  : cascaderLazyCatalog.slice(0, cascaderLazyPageSize);
              }}
              optionRender={(option) => <span>{option.label}</span>}
            />
          </div>
        </div>
      </Section>
      <Section
        id="select"
        title="选择器 Select"
        description="先展示基础单选，再展示搜索单选、600 条数据懒加载单选和多选；支持全部、全选、三参数 onChange、自定义 option/label/tag 和下拉插槽。"
      >
        <div className="biu-capability-select-demos">
          <div className="biu-capability-select-demo">
            <span>基础单选</span>
            <Select
              options={options}
              value={basicSelect}
              onChange={(value) => setBasicSelect(typeof value === "string" ? value : "")}
              placeholder="基础单选"
            />
          </div>
          <div className="biu-capability-select-demo">
            <span>后端未知值回显（不在 options 中）</span>
            <Select
              options={[{ label: "平台团队", value: "platform" }]}
              value={unknownSelect}
              allowClear
              onChange={(value) => setUnknownSelect(typeof value === "string" ? value : "")}
              placeholder="后端未知值"
            />
          </div>
          <div className="biu-capability-select-demo">
            <span>搜索单选、全部选项与自定义下拉区域</span>
            <Select
              options={options}
              hasAllOption
              searchable
              allowClear
              value={typeof select === "string" ? select : undefined}
              onChange={(value, option, index) => {
                setSelect(value ?? "");
                biuMessage.info($t("值：{value}，索引：{index}", { value: String(value), index: String(index) }));
              }}
              optionRender={(option) => (
                <>
                  <strong>{option.label}</strong>
                  {option.disabled ? "（暂不可用）" : ""}
                </>
              )}
              dropdownHeader={<small>请选择所属团队</small>}
              dropdownFooter={
                <Button
                  type="default"
                  variant="text"
                  size="small"
                  block
                  onClick={() => biuMessage.info($t("自定义底部操作"))}
                >
                  自定义底部操作
                </Button>
              }
            />
          </div>
          <div className="biu-capability-select-demo">
            <span>搜索与懒加载单选（600 条，滚动或点击加载）</span>
            <Select
              options={lazySelectOptions}
              value={lazySelect}
              searchable
              searchValue={lazySelectSearch}
              onSearch={(value) => {
                setLazySelectSearch(value);
                const query = value.trim().toLowerCase();
                if (!query) return;
                const matches = selectLazyCatalog.filter((option) => option.label.toLowerCase().includes(query));
                setLazySelectOptions((current) => [
                  ...current,
                  ...matches.filter((option) => !current.some((item) => item.value === option.value)),
                ]);
              }}
              loadMoreTrigger="both"
              loadMoreText="点击加载更多"
              hasMore={lazySelectLoadedCount < selectLazyCatalog.length}
              loadingMore={lazySelectLoading}
              onChange={(value) => setLazySelect(typeof value === "string" ? value : "")}
              onLoadMore={async () => {
                if (lazySelectLoading || lazySelectLoadedCount >= selectLazyCatalog.length) return;
                setLazySelectLoading(true);
                await new Promise((resolve) => window.setTimeout(resolve, 250));
                const nextCount = Math.min(lazySelectLoadedCount + 20, selectLazyCatalog.length);
                setLazySelectOptions((current) => [
                  ...current,
                  ...selectLazyCatalog
                    .slice(lazySelectLoadedCount, nextCount)
                    .filter((option) => !current.some((item) => item.value === option.value)),
                ]);
                setLazySelectLoadedCount(nextCount);
                setLazySelectLoading(false);
              }}
              placeholder="滚动加载更多"
            />
            <span>已准备 {lazySelectOptions.length} / 600 条，可搜索、点击或滚动加载</span>
          </div>
          <div className="biu-capability-select-demo">
            <span>多选、全选与标签省略</span>
            <Select
              mode="multiple"
              options={multiSelectOptions}
              hasAllOption
              allowAllSelect
              searchable
              maxTagCount="responsive"
              value={multiSelect}
              onChange={(value, option, index) => {
                setMultiSelect(Array.isArray(value) ? value : value ? [value] : []);
                biuMessage.info($t("多选索引：{index}", { index: String(index) }));
              }}
              labelRender={(_value, option) => option?.label ?? "未命名"}
              tagRender={(option, onClose) => (
                <span className="biu-ui-select__tag">
                  <Ellipsis
                    content={String(option.label ?? "未命名")}
                    maxWidth={150}
                    className="biu-ui-select__tag-label"
                  />
                  <button
                    type="button"
                    aria-label={$t("移除 {label}", { label: String(option.label) })}
                    className="biu-capability-tag-close"
                    onClick={onClose}
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </span>
              )}
            />
          </div>
        </div>
      </Section>
    </>
  );
}
