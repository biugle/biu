import { useMemo, useState } from "react";
import { biuIconCategories, searchBiuIcons, type BiuIconCategory } from "@biugle/icons";
import { Button, InputNumber, Select, Tag, TextField } from "@biugle/react-components/ui";
import { biuMessage } from "@biugle/react-components";
import { CapabilityApiTable, CapabilityCard, CapabilityPage } from "../CapabilityPage/index.js";

const categoryLabels: Record<BiuIconCategory, string> = {
  navigation: "导航",
  actions: "操作",
  communication: "通信",
  files: "文件",
  editor: "编辑",
  media: "媒体",
  business: "业务",
  devices: "设备",
  layout: "布局",
  security: "安全",
  shapes: "形状",
  brands: "品牌",
  other: "其他",
};

export default function IconsSearch() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BiuIconCategory | "">("");
  const [iconColor, setIconColor] = useState("#2563eb");
  const [iconSize, setIconSize] = useState(24);
  const [selectedIcon, setSelectedIcon] = useState("Search");
  const filtered = useMemo(() => searchBiuIcons(query, category || undefined), [category, query]);
  const grouped = useMemo(
    () =>
      biuIconCategories
        .map((item) => ({ category: item, icons: filtered.filter((icon) => icon.category === item) }))
        .filter((item) => item.icons.length > 0),
    [filtered],
  );
  const copyUsage = async (name: string) => {
    const usage = `import { ${name} } from "@biugle/icons";`;
    setSelectedIcon(name);
    try {
      await navigator.clipboard?.writeText(usage);
      biuMessage.success(`已复制 ${name} 的引入代码`);
    } catch {
      biuMessage.error("复制失败，请手动复制用法");
    }
  };
  return (
    <CapabilityPage
      title="Icons 快速查询"
      description="所有 Demo 和基座代码统一从 @biugle/icons 引用图标，不直接依赖 lucide-react。"
    >
      <CapabilityCard title="搜索图标">
        <div className="biu-capability-control-row">
          <TextField
            className="biu-icons-search__input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入图标名称，例如 Search"
            aria-label="搜索图标"
            allowClear
            onClear={() => setQuery("")}
          />
          <Select
            value={category}
            options={[
              { value: "", label: "全部分类" },
              ...biuIconCategories.map((item) => ({ value: item, label: categoryLabels[item] })),
            ]}
            onChange={(value) => setCategory(String(value ?? "") as BiuIconCategory | "")}
            aria-label="图标分类"
          />
          <TextField
            type="color"
            className="biu-icons-search__color"
            value={iconColor}
            onChange={(event) => setIconColor(event.target.value)}
            aria-label="图标颜色"
          />
          <InputNumber
            className="biu-icons-search__size"
            value={iconSize}
            min={12}
            max={64}
            decimal={0}
            onChange={(value) => setIconSize(Math.max(12, Math.min(64, Number(value ?? 24))))}
            aria-label="图标大小"
          />
        </div>
        <div className="biu-capability-actions" style={{ marginTop: 12 }}>
          <Tag color="info">{filtered.length} 个图标</Tag>
          <span>点击图标复制 import 用法，也可以直接使用浏览器搜索。</span>
        </div>
        <div className="biu-capability-icon-groups">
          {grouped.map(({ category: itemCategory, icons }) => (
            <section className="biu-capability-icon-group" key={itemCategory}>
              <h3>
                {categoryLabels[itemCategory]} <span>({icons.length})</span>
              </h3>
              <div className="biu-capability-icon-grid">
                {icons.map(({ name, icon: Icon }) => (
                  <Button
                    type="default"
                    variant="text"
                    className="biu-capability-icon-item"
                    key={name}
                    title={`复制 ${name} 的引入代码`}
                    aria-label={`复制 ${name} 图标用法`}
                    onClick={() => void copyUsage(name)}
                  >
                    <Icon size={iconSize} color={iconColor} aria-hidden="true" />
                    <span>{name}</span>
                  </Button>
                ))}
              </div>
            </section>
          ))}
        </div>
        {!filtered.length ? <p>没有匹配的图标。</p> : null}
        <div className="biu-capability-code">
          {`import { ${selectedIcon} } from "@biugle/icons";\n<${selectedIcon} size={${iconSize}} color="${iconColor}" />`}
        </div>
      </CapabilityCard>
      <CapabilityCard
        title="Icons 属性与方法"
        description="图标统一从 @biugle/icons 引入；catalog 搜索和分类由包公开 API 提供，Demo 不维护手写子集。"
      >
        <CapabilityApiTable
          rows={[
            {
              component: "biuIconCatalog",
              name: "name / category / icon",
              type: "BiuIconEntry[]",
              defaultValue: "完整图标 catalog",
              description: "提供名称、分类和 React 图标组件，供搜索、分类展示和运行时选择。",
              demo: "分类图标网格",
            },
            {
              component: "searchBiuIcons",
              name: "query / category",
              type: "(string, category?) => BiuIconEntry[]",
              defaultValue: "空查询返回全部",
              description: "按名称和分类过滤；支持浏览器原生查找配合页面分组展示。",
              demo: "搜索框 / 分类",
            },
            {
              component: "getBiuIcon",
              name: "name",
              type: "(string) => Component | undefined",
              defaultValue: "undefined",
              description: "按公开图标名获取组件，业务可自行传入颜色和尺寸。",
              demo: "用法代码",
            },
            {
              component: "React icon",
              name: "size / color / className",
              type: "number | string / string / string",
              defaultValue: "图标组件默认值",
              description: "图标组件保留可覆写的 SVG 属性，点击 Demo 项复制 import 用法。",
              demo: "颜色 / 大小控制",
            },
          ]}
        />
      </CapabilityCard>
    </CapabilityPage>
  );
}
