import { useState, type ReactNode } from "react";
import {
  Breadcrumb,
  Button,
  DropdownMenu,
  Menu,
  Pagination,
  Popconfirm,
  Popover,
  Tabs,
  Typography,
  Transfer,
  Tree,
} from "@biugle/react-components/ui";
import { biuMessage } from "@biugle/react-components";
import { useBiuContext, useBiuI18n } from "@biugle/biu-runtime";
import { Plus, Search } from "@biugle/icons";
import { DirectionSwitch } from "../direction-switch.js";
import { Section } from "../section.js";
import type { CatalogDirectionProps } from "../catalog-types.js";

export function NavigationSections({ pro, showcaseDirection, setShowcaseDirection }: CatalogDirectionProps) {
  const { locale } = useBiuContext();
  const { $t } = useBiuI18n();
  const [activeTab, setActiveTab] = useState("overview");
  const [menuKey, setMenuKey] = useState("overview");
  const [dropdownChecks, setDropdownChecks] = useState(["compact"]);
  const [dropdownRadio, setDropdownRadio] = useState("light");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [treeSelected, setTreeSelected] = useState(["control"]);
  const [transfer, setTransfer] = useState<Array<{ label: ReactNode; value: string }>>([
    { label: "Runtime", value: "runtime" },
  ]);
  const [unknownTransfer, setUnknownTransfer] = useState<Array<{ label: ReactNode; value: string }>>([
    { label: "后端返回项：legacy-runtime（当前列表暂无）", value: "legacy-runtime" },
    { label: "Runtime", value: "runtime" },
  ]);
  const [oneWayTransfer, setOneWayTransfer] = useState<Array<{ label: ReactNode; value: string }>>([]);
  return (
    <>
      <Section
        id="popover"
        title="气泡 Popover"
        description="支持 disabled、受控状态、方向、碰撞避障和自定义 classNames。"
      >
        <Popover
          content={
            <div>
              <strong>Popover 内容</strong>
              <p>复杂内容可以直接放入。</p>
            </div>
          }
        >
          <Button type="default" variant="outlined">
            打开 Popover
          </Button>
        </Popover>
      </Section>
      <Section
        id="popconfirm"
        title="气泡确认 Popconfirm"
        description="确认/取消、异步 loading、danger 类型、description 和 disabled。"
      >
        <Popconfirm
          title="确认删除这条记录？"
          description="删除后无法恢复"
          type="danger"
          locale={locale}
          onConfirm={() => {
            biuMessage.success($t("已确认删除"));
          }}
        >
          <Button type="error" variant="outlined">
            删除
          </Button>
        </Popconfirm>
      </Section>
      <Section
        id="dropdown-menu"
        title="下拉菜单 DropdownMenu"
        description="支持分隔、标签、图标、快捷键、checkbox 和 submenu。"
      >
        <DropdownMenu
          trigger={<Button type="secondary">更多操作</Button>}
          items={[
            { key: "label", type: "label", label: "常用操作" },
            { key: "copy", label: "复制", shortcut: "⌘ C" },
            { key: "compact", type: "checkbox", label: "紧凑模式", checked: true },
            { key: "light", type: "radio", radioGroup: "theme", label: "浅色主题" },
            { key: "dark-theme", type: "radio", radioGroup: "theme", label: "深色主题" },
            { key: "line", type: "separator" },
            { key: "advanced", label: "高级", children: [{ key: "settings", label: "设置" }] },
          ]}
          checkedKeys={dropdownChecks}
          radioValues={{ theme: dropdownRadio }}
          dropdownHeader={<strong>常用操作</strong>}
          dropdownFooter={<span>支持自定义头部、尾部和菜单渲染</span>}
          onCheckedChange={setDropdownChecks}
          onRadioChange={(value, group) => {
            if (group === "theme") setDropdownRadio(value);
          }}
          onSelect={(key) => biuMessage.info($t("选择：{key}", { key }))}
        />
      </Section>
      <Section
        id="tabs"
        title="标签页 Tabs"
        description="line/card/tag 三种风格，支持方向、可关闭、添加、滚动箭头和多语言长度适配。"
      >
        <Tabs
          type={pro ? "card" : "line"}
          items={[
            { key: "overview", label: "概览 / Overview", children: <p>Tab 内容一</p>, closable: pro },
            { key: "config", label: "配置与权限 Configuration", children: <p>Tab 内容二</p>, closable: pro },
            { key: "disabled", label: "禁用", disabled: true },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          onClose={(key) => biuMessage.info($t("关闭：{key}", { key }))}
          showArrows={pro ? "both" : "auto"}
          addButton={pro ? <Plus size={15} aria-hidden="true" /> : undefined}
          onAdd={() => biuMessage.success($t("新增 Tab"))}
        />
      </Section>
      <Section
        id="menu"
        title="菜单 Menu / 面包屑 Breadcrumb"
        description="菜单目录、折叠、openKeys、选中状态和 Ellipsis 标题均可用于基座导航。"
      >
        <DirectionSwitch value={showcaseDirection} onChange={setShowcaseDirection} />
        <Typography muted>{$t("本页手动切换方向，只传给对应案例组件实例，不读取全局方向配置。")}</Typography>
        <Menu
          dir={showcaseDirection}
          selectedKey={menuKey}
          collapsed={false}
          onSelect={setMenuKey}
          items={[
            {
              key: "foundation",
              label: "基座能力展示",
              children: [
                { key: "overview", label: "菜单概览与一个很长的标题用于省略" },
                { key: "layout", label: "布局" },
              ],
            },
            {
              key: "components",
              label: "组件能力展示",
              children: [
                { key: "ui", label: "UI 组件" },
                { key: "pro", label: "Pro 组件" },
              ],
            },
          ]}
        />
        <Breadcrumb
          items={[
            { label: "基座能力" },
            { label: "组件能力", onClick: () => biuMessage.info($t("返回组件能力")) },
            { label: "Menu" },
          ]}
        />
        <p>当前菜单：{menuKey}</p>
      </Section>
      <Section
        id="pagination"
        title="分页 Pagination"
        description="响应式分为三档：小于 560px 显示当前页，560–799px 隐藏范围/总数并保留完整页码，800px 起使用标准样式；前两档的页大小和跳页控件宽度为 45px。"
      >
        <Pagination
          current={page}
          pageSize={pageSize}
          total={128}
          showSizeChanger
          pageSizeOptions={[10, 20, 50]}
          showQuickJumper
          showTotal={(total, range) =>
            $t("第 {start}-{end} 条，共 {total} 条", { start: range[0], end: range[1], total })
          }
          responsive
          showLessItems
          onChange={(next, nextPageSize) => {
            setPage(next);
            setPageSize(nextPageSize);
          }}
          locale={locale}
        />
      </Section>
      <Section id="tree" title="树 Tree" description="树节点展开、选择、多选和禁用状态。">
        <Tree
          data={[
            {
              key: "root",
              title: "组件库",
              children: [
                { key: "ui", title: "UI", children: [{ key: "control", title: "表单控件" }] },
                { key: "pro", title: "Pro" },
              ],
            },
          ]}
          defaultExpandedKeys={["root", "ui"]}
          selectedKeys={treeSelected}
          onSelect={setTreeSelected}
          multiple={pro}
          checkable
          defaultCheckedKeys={["ui"]}
          showSearch
          locale={locale}
        />
      </Section>
      <Section
        id="transfer"
        title="穿梭框 Transfer"
        description="双栏数据转移，支持搜索/禁用/自定义标题和条目末端操作；双向模式右侧默认提供删除按钮，oneWay 模式只允许左侧移入右侧。"
      >
        <div className="biu-capability-transfer-demos">
          <div className="biu-capability-transfer-demo">
            <span>双向模式：右侧默认可删除移回</span>
            <Transfer
              source={[
                { label: "Components", value: "components" },
                { label: "Runtime", value: "runtime" },
                { label: "Preset", value: "preset" },
                { label: "Router", value: "router" },
              ]}
              target={transfer}
              onChange={setTransfer}
              showSearch
              itemActions={(item, direction) =>
                direction === "left" ? (
                  <Button
                    type="secondary"
                    variant="text"
                    size="small"
                    onlyIcon
                    icon={<Search size={14} aria-hidden="true" />}
                    tooltip={$t("查看：{label}", { label: String(item.label) })}
                    aria-label={$t("查看：{label}", { label: String(item.label) })}
                    onClick={() => biuMessage.info($t("查看：{label}", { label: String(item.label) }), { locale })}
                  />
                ) : undefined
              }
              titles={pro ? ["可用包", "已选包"] : undefined}
              locale={locale}
            />
          </div>
          <div className="biu-capability-transfer-demo">
            <span>后端未知目标项：置顶、禁选，但仍可删除</span>
            <Transfer
              source={[
                { label: "Components", value: "components" },
                { label: "Runtime", value: "runtime" },
                { label: "Preset", value: "preset" },
              ]}
              target={unknownTransfer}
              onChange={setUnknownTransfer}
              showSearch
              titles={["当前可选", "后端已选"]}
              locale={locale}
            />
          </div>
          <div className="biu-capability-transfer-demo">
            <span>单向模式 oneWay：只能从左侧移入右侧</span>
            <Transfer
              source={[
                { label: "基础组件", value: "foundation" },
                { label: "业务组件", value: "business" },
                { label: "开发工具", value: "tooling" },
              ]}
              target={oneWayTransfer}
              onChange={setOneWayTransfer}
              oneWay
              titles={["待发布", "已发布"]}
              locale={locale}
            />
          </div>
        </div>
      </Section>
    </>
  );
}
