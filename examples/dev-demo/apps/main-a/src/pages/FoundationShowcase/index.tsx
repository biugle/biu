import { useEffect, useState } from "react";
import { BiuStatusView, CopyButton, useBiuContext, useBiuI18n, useBiuLayoutControl } from "@biugle/biu-runtime";
import { Button, Dialog, Drawer, Ellipsis, TextField, biuMessage, fire } from "@biugle/react-components";
import {
  Checkbox,
  DatePicker,
  DropdownMenu,
  FileCard,
  FileRender,
  InputNumber,
  Progress,
  Select,
  Switch,
  Tabs,
  Tag,
  TimePicker,
  Tree,
  Transfer,
  Upload,
} from "@biugle/react-components/ui";
import { Form, FormActions, FormItem, useForm } from "@biugle/react-form";
import { Table, useQueryTable, type Column } from "@biugle/react-table";
import "./styles.css";
import "@biugle/react-form/styles.css";
import "@biugle/react-table/styles.css";

const showcaseMenuKey = "SystemConfig/SystemBasic/PageA";
const dashboardMenuKey = "SystemConfig/SystemAdvanced/Dashboard";

type DemoRow = { id: number; name: string; status: string };

const demoRows: DemoRow[] = [
  { id: 1, name: "统一导航", status: "已接入" },
  { id: 2, name: "跨应用事件", status: "已验证" },
  { id: 3, name: "错误兜底", status: "已覆盖" },
];

function ComponentPackageShowcase() {
  const form = useForm({ defaultValues: { keyword: "", department: "platform" } });
  const [range, setRange] = useState<unknown>();
  const [timeRange, setTimeRange] = useState<unknown>();
  const [checked, setChecked] = useState(true);
  const [selectedTransfer, setSelectedTransfer] = useState([{ label: "事件总线", value: "events" }]);
  const columns: Column<DemoRow>[] = [
    { key: "name", title: "能力", dataIndex: "name" },
    {
      key: "status",
      title: "状态",
      dataIndex: "status",
      render: (value) => <Tag color="success">{String(value ?? "")}</Tag>,
    },
  ];
  const table = useQueryTable<DemoRow>({
    queryKey: ["foundation-showcase"],
    queryFn: async ({ signal }) => {
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(resolve, 180);
        signal.addEventListener(
          "abort",
          () => {
            window.clearTimeout(timer);
            reject(new DOMException("aborted", "AbortError"));
          },
          { once: true },
        );
      });
      return { items: demoRows, total: demoRows.length };
    },
  });

  return (
    <section className="biu-showcase-card biu-showcase-components">
      <h2>Components / Form / Table</h2>
      <p>
        默认入口使用 Pro 组件；需要自由组合时从 <code>@biugle/react-components/ui</code> 获取 UI 部件。
      </p>
      <div className="biu-showcase-component-grid">
        <div className="biu-showcase-component-block">
          <h3>表单封装</h3>
          <Form
            form={form}
            onSubmit={(values) => {
              biuMessage.success(`提交：${values.department}`);
            }}
          >
            <FormItem name="keyword" label="关键词" rules={{ required: "请输入关键词" }}>
              {({ field, fieldState }) => (
                <TextField {...field} placeholder="render props 自定义渲染" error={fieldState.error?.message} />
              )}
            </FormItem>
            <FormItem name="department" label="部门">
              {({ field }) => (
                <Select
                  {...field}
                  options={[
                    { label: "平台工程", value: "platform" },
                    { label: "业务研发", value: "product" },
                  ]}
                />
              )}
            </FormItem>
            <FormActions>
              <Button type="submit" size="small">
                提交 Form
              </Button>
            </FormActions>
          </Form>
        </div>
        <div className="biu-showcase-component-block">
          <h3>日期与时间 range</h3>
          <DatePicker range value={range as never} onChange={setRange as never} />
          <TimePicker range value={timeRange as never} onChange={setTimeRange as never} />
          <small>
            日期：{range ? "已选择" : "未选择"}；时间：{timeRange ? "已选择" : "未选择"}（dayjs 值）
          </small>
        </div>
        <div className="biu-showcase-component-block">
          <h3>交互控件</h3>
          <div className="biu-showcase-control-row">
            <Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)} label="Checkbox" />
            <Switch checked={checked} onChange={setChecked} />
            <InputNumber defaultValue={8} aria-label="数量" />
          </div>
          <div className="biu-showcase-control-row">
            <DropdownMenu
              trigger={
                <Button size="small" variant="secondary">
                  DropdownMenu
                </Button>
              }
              items={[
                { key: "copy", label: "复制" },
                { key: "share", label: "分享" },
              ]}
              onSelect={(key) => biuMessage.info(`选择：${key}`)}
            />
          </div>
          <Progress percent={68} />
        </div>
        <div className="biu-showcase-component-block">
          <h3>Tabs / Tree / Transfer</h3>
          <Tabs
            items={[
              { key: "one", label: "概览", children: <span>可控页签内容</span> },
              { key: "two", label: "说明", children: <span>UI 结构可以组合</span> },
            ]}
          />
          <Tree
            data={[{ key: "foundation", title: "Foundation", children: [{ key: "runtime", title: "Runtime" }] }]}
            selectedKeys={["runtime"]}
          />
          <Transfer
            source={[
              { label: "Runtime", value: "runtime" },
              { label: "Preset", value: "preset" },
            ]}
            target={selectedTransfer}
            onChange={(target) =>
              setSelectedTransfer(
                target.filter((item): item is { label: string; value: string } => typeof item.label === "string"),
              )
            }
          />
        </div>
        <div className="biu-showcase-component-block">
          <h3>File / Upload / Tag</h3>
          <FileCard name="architecture.md" size="12 KB" />
          <Upload multiple onFiles={(files) => biuMessage.success(`选择 ${files.length} 个文件`)}>
            选择文件
          </Upload>
          <FileRender
            src="/logo.svg"
            name="预览"
            kind="image"
            onDownload={() => biuMessage.info("下载动作由业务实现")}
          />
        </div>
        <div className="biu-showcase-component-block">
          <h3>useQueryTable</h3>
          <Table<DemoRow> columns={columns} {...table.tableProps} />
          <div className="biu-showcase-actions">
            <Button size="small" variant="secondary" onClick={() => table.refresh()}>
              重新查询
            </Button>
            <span>{table.loading ? "查询中…" : `共 ${table.pagination.total} 条`}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function FoundationShowcase() {
  const { $t } = useBiuI18n();
  const context = useBiuContext();
  const { layoutOverrides, setLayoutOverrides, resetLayoutOverrides } = useBiuLayoutControl();
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [result, setResult] = useState("等待操作");

  useEffect(() => {
    return context.events.subscribe("showcase:ping", (event) => {
      setEventLog((current) =>
        [`${event.source || "unknown"}: ${JSON.stringify(event.payload)}`, ...current].slice(0, 5),
      );
    });
  }, [context.events]);

  const openModal = () => {
    fire(Dialog)({
      title: "基座 Modal",
      children: <p>Modal 由 fire(modal) 挂载到当前文档 body，支持遮罩、Esc 和点击空白关闭。</p>,
    });
  };

  const openDrawer = () => {
    fire(Drawer)({
      title: "基座 Drawer",
      placement: "right",
      children: <p>Drawer 是统一的基础容器，业务表单和接口请求由项目自行实现。</p>,
    });
  };

  const openBodyNode = () => {
    fire.render(({ close }) => (
      <aside className="biu-showcase-body-node">
        <strong>fire.render 自定义内容</strong>
        <p>这是普通 React 内容，不依赖 Portal 布局。</p>
        <Button type="default" variant="outlined" size="small" onClick={close}>
          关闭
        </Button>
      </aside>
    ));
  };

  const publishEvent = () => {
    context.events.publish("showcase:ping", { at: new Date().toISOString() }, context.appId);
    setResult("事件已发布，当前页面订阅器会收到消息");
  };

  const navigateByKey = () => {
    const success = context.navigateByKey(showcaseMenuKey);
    setResult(success ? `已按完整 key 导航：${showcaseMenuKey}` : "导航失败，请检查菜单权限");
  };

  const navigateByPath = () => {
    const success = context.navigateByKey(dashboardMenuKey);
    setResult(success ? `已按完整菜单 key 导航到 Dashboard：${dashboardMenuKey}` : "导航失败，请检查菜单权限");
  };

  const showStatus = (status: 403 | 404 | 500) => {
    fire(Dialog)({
      title: `状态页 ${status}`,
      children: <BiuStatusView status={status} details="这是 Demo 触发的状态兜底页面" locale={context.locale} />,
    });
  };

  return (
    <main className="biu-showcase-page">
      <header className="biu-showcase-header">
        <div>
          <p className="biu-showcase-eyebrow">BIU FOUNDATION PLAYGROUND</p>
          <h1>基座能力验收</h1>
          <p>集中验证组件、路由、事件、布局控制和当前运行上下文。</p>
        </div>
        <div className="biu-showcase-context">
          <strong>{context.appId}</strong>
          <span>{context.currentPath || "/"}</span>
        </div>
      </header>

      <section className="biu-showcase-grid">
        <ComponentPackageShowcase />
        <article className="biu-showcase-card">
          <h2>Message / 弹层</h2>
          <p>验证统一消息和 body 挂载能力。</p>
          <div className="biu-showcase-actions">
            <Button type="success" size="small" onClick={() => biuMessage.success("Success message")}>
              Success
            </Button>
            <Button type="primary" variant="outlined" size="small" onClick={() => biuMessage.info("Info message")}>
              Info
            </Button>
            <Button type="warning" size="small" onClick={() => biuMessage.warning("Warning message")}>
              Warning
            </Button>
            <Button type="error" size="small" onClick={() => biuMessage.error("Error message")}>
              Error
            </Button>
            <Button type="default" variant="outlined" size="small" onClick={openModal}>
              Modal
            </Button>
            <Button type="default" variant="outlined" size="small" onClick={openDrawer}>
              Drawer
            </Button>
            <Button type="default" variant="outlined" size="small" onClick={openBodyNode}>
              fire.render
            </Button>
          </div>
        </article>

        <article className="biu-showcase-card">
          <h2>Tooltip / Copy</h2>
          <p>Tooltip 仅对真实溢出文本展示，复制组件使用统一反馈。</p>
          <Ellipsis
            content="这是一段会溢出的长文本，用于验证 Tooltip"
            tooltipContent="这是一段完整的超长 Tooltip 内容，用于验证自动避障和溢出判断。"
            maxWidth={260}
          />
          <div className="biu-showcase-actions">
            <CopyButton value={`route=${context.currentPath || "/"}\napp=${context.appId}`} locale={context.locale} />
            <Button type="default" variant="outlined" size="small" onClick={() => showStatus(403)}>
              403
            </Button>
            <Button type="warning" variant="outlined" size="small" onClick={() => showStatus(404)}>
              404
            </Button>
            <Button type="error" variant="outlined" size="small" onClick={() => showStatus(500)}>
              500
            </Button>
          </div>
        </article>

        <article className="biu-showcase-card">
          <h2>事件总线</h2>
          <p>验证当前门户内发布、订阅和来源信息。</p>
          <Button type="primary" size="small" onClick={publishEvent}>
            发布 showcase:ping
          </Button>
          <p className="biu-showcase-result">{result}</p>
          <ul className="biu-showcase-event-list">
            {eventLog.length ? (
              eventLog.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)
            ) : (
              <li>暂无事件</li>
            )}
          </ul>
        </article>

        <article className="biu-showcase-card">
          <h2>路由 / 菜单 Key</h2>
          <p>页面身份使用完整菜单链路，避免同名末级菜单冲突。</p>
          <code>{showcaseMenuKey}</code>
          <code>{context.resolveMenuPath("PageA", showcaseMenuKey) || "未解析"}</code>
          <div className="biu-showcase-actions">
            <Button type="default" variant="outlined" size="small" onClick={navigateByKey}>
              navigateByKey
            </Button>
            <Button type="default" variant="outlined" size="small" onClick={navigateByPath}>
              navigate(path)
            </Button>
          </div>
        </article>

        <article className="biu-showcase-card">
          <h2>布局控制 / Context</h2>
          <p>这些覆盖只作用于当前页面，离开页面后自动恢复。</p>
          <div className="biu-showcase-context-list">
            <span>locale: {context.locale || "zh-CN"}</span>
            <span>theme: {context.theme || "light"}</span>
            <span>timezone: {context.timezone || "Asia/Shanghai"}</span>
            <span>direction: {context.direction || "ltr"}</span>
            <span>auth: {context.auth?.authenticated ? "authenticated" : "guest"}</span>
          </div>
          <div className="biu-showcase-actions">
            <Button
              type="default"
              variant="outlined"
              size="small"
              onClick={() => setLayoutOverrides({ hideSidebar: true, hideTabs: true, hideBreadcrumb: true })}
            >
              隐藏基座区域
            </Button>
            <Button type="default" variant="outlined" size="small" onClick={resetLayoutOverrides}>
              恢复布局
            </Button>
            <Button type="default" variant="outlined" size="small" onClick={() => context.reloadMenus()}>
              重新读取菜单
            </Button>
            <Button type="default" variant="outlined" size="small" onClick={() => context.reloadLocale()}>
              重新读取语言
            </Button>
          </div>
          <small>当前覆盖：{Object.keys(layoutOverrides).join(", ") || "无"}</small>
        </article>

        <article className="biu-showcase-card">
          <h2>当前能力状态</h2>
          <p>用于快速确认门户 A 的配置是否已传入 Runtime。</p>
          <dl className="biu-showcase-context-list">
            <div>
              <dt>portal</dt>
              <dd>{context.portalCode || "-"}</dd>
            </div>
            <div>
              <dt>code</dt>
              <dd>{context.currentCode || "-"}</dd>
            </div>
            <div>
              <dt>environment</dt>
              <dd>{context.environment || "local"}</dd>
            </div>
            <div>
              <dt>permission</dt>
              <dd>{context.permissionCodes ? `${context.permissionCodes.size} codes` : "not configured"}</dd>
            </div>
          </dl>
          <p className="biu-showcase-hint">{$t("切换语言、主题、时区和方向后，可回到这里确认上下文同步。")}</p>
        </article>
      </section>
    </main>
  );
}
