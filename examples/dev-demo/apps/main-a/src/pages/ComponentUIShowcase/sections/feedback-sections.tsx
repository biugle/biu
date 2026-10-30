import {
  Alert,
  Affix,
  Badge,
  Box,
  Button,
  ColorPicker,
  ContextMenu,
  Divider,
  Empty,
  Image,
  Loading,
  List,
  Notification,
  notification,
  Progress,
  Paragraph,
  Stack,
  Space,
  Spin,
  Steps,
  Tag,
  Timeline,
  Title,
  Typography,
} from "@biugle/react-components/ui";
import { biuMessage, ConfigProvider } from "@biugle/react-components";
import { useBiuContext, useBiuI18n } from "@biugle/biu-runtime";
import { X } from "@biugle/icons";
import { DirectionSwitch } from "../direction-switch.js";
import { Section } from "../section.js";
import type { CatalogDirectionProps } from "../catalog-types.js";

export function FeedbackSections({ pro, showcaseDirection, setShowcaseDirection }: CatalogDirectionProps) {
  const { $t } = useBiuI18n();
  const { locale } = useBiuContext();
  return (
    <>
      <Section
        id="alert"
        title="提示 Alert"
        description="default、info、success、warning、error 五种状态，支持自定义 icon、description、action 和关闭。"
      >
        <DirectionSwitch value={showcaseDirection} onChange={setShowcaseDirection} />
        <div className="biu-capability-status-grid">
          <Alert dir={showcaseDirection} status="default" title="默认提示">
            这是默认信息。
          </Alert>
          <Alert dir={showcaseDirection} status="info" title="信息提示">
            数据正在同步。
          </Alert>
          <Alert dir={showcaseDirection} status="success" title="操作成功">
            数据已保存。
          </Alert>
          <Alert dir={showcaseDirection} status="warning" title="注意">
            部分字段尚未填写。
          </Alert>
          <Alert
            dir={showcaseDirection}
            status="info"
            title="多行说明"
            closable
            description={
              <>
                第一行说明当前同步范围。
                <br />
                第二行说明完成后可以继续编辑，关闭按钮保持在右侧垂直居中。
              </>
            }
          />
          <Alert
            dir={showcaseDirection}
            status="error"
            title="操作失败"
            description="请检查网络后重试。"
            icon={<X size={18} aria-hidden="true" />}
            action={
              <Button
                type="error"
                variant="outlined"
                size="small"
                onClick={() => biuMessage.info($t("正在重试"), { locale, dir: showcaseDirection })}
              >
                重试
              </Button>
            }
            closable
            onClose={() => biuMessage.info($t("提示已关闭"), { locale, dir: showcaseDirection })}
          />
        </div>
      </Section>
      <Section
        id="message"
        title="消息 Message"
        description="默认是轻量简约样式；复杂样式使用 complex=true。四个案例覆盖单行、多行和不同语义色，关闭按钮始终独占逻辑末端（LTR 右侧、RTL 左侧）。"
      >
        <DirectionSwitch value={showcaseDirection} onChange={setShowcaseDirection} />
        <Stack align={"center"} gap={8} wrap="wrap">
          <Button
            type="primary"
            size="small"
            onClick={() => biuMessage.info($t("这是一条简约单行消息"), { locale, dir: showcaseDirection })}
          >
            简约单行
          </Button>
          <Button
            type="warning"
            size="small"
            onClick={() =>
              biuMessage.warning($t("第一行简约说明\n第二行补充当前状态和下一步处理建议。"), {
                locale,
                dir: showcaseDirection,
              })
            }
          >
            简约多行
          </Button>
          <Button
            type="success"
            size="small"
            onClick={() =>
              biuMessage.success($t("复杂样式单行消息"), { locale, dir: showcaseDirection, complex: true })
            }
          >
            复杂单行
          </Button>
          <Button
            type="error"
            size="small"
            onClick={() =>
              biuMessage.error($t("第一行复杂错误说明\n第二行说明处理建议，右侧关闭按钮不会覆盖正文。"), {
                locale,
                dir: showcaseDirection,
                complex: true,
              })
            }
          >
            复杂多行
          </Button>
        </Stack>
      </Section>
      <Section id="empty" title="空状态 Empty" description="无数据时提供明确的视觉反馈和可选操作。">
        <Empty locale={locale} description="当前筛选条件下暂无数据" />
      </Section>
      <Section id="loading" title="加载 Loading" description="提供统一的加载指示和中文/英文文案。">
        <Loading locale={locale} />
      </Section>
      <Section id="progress" title="进度 Progress" description="支持百分比、状态色和连续进度反馈。">
        <Progress percent={pro ? 86 : 62} />
      </Section>
      <Section id="tag" title="标签 Tag" description="用于表达轻量状态，支持语义颜色和自定义内容。">
        <Stack align={"center"} gap={8} wrap="wrap">
          <Tag color="default">默认</Tag>
          <Tag color="info">信息</Tag>
          <Tag color="success">成功</Tag>
          <Tag color="warning">处理中</Tag>
          <Tag color="danger">失败</Tag>
        </Stack>
      </Section>
      <Section id="badge" title="徽标 Badge" description="支持数字徽标、圆点徽标和语义颜色。">
        <Stack align={"center"} gap={8} wrap="wrap">
          <Badge count={pro ? 8 : 3}>消息</Badge>
          <Badge dot color="success">
            在线
          </Badge>
          <Badge count={99} color="danger">
            通知
          </Badge>
        </Stack>
      </Section>
      <Section id="steps" title="步骤 Steps" description="展示流程进度和当前处理节点。">
        <Steps
          current={pro ? 1 : 0}
          items={[
            { key: "a", title: "准备" },
            { key: "b", title: "审核" },
            { key: "c", title: "完成" },
          ]}
        />
      </Section>
      <Section id="typography" title="文本排版 Typography" description="统一文本语义、标题层级、弱化和单行省略。">
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Title level={3}>示例标题</Title>
          <Paragraph>这是一段用于展示文本排版的演示内容，支持普通文本、强调文本和弱化文本。</Paragraph>
          <Space size="middle">
            <Typography strong>强调文本</Typography>
            <Typography muted>弱化文本</Typography>
            <Typography color="primary">Primary 文本</Typography>
            <Typography color="success">Success 文本</Typography>
            <Typography color="warning">Warning 文本</Typography>
            <Typography color="error">Error 文本</Typography>
            <Typography ellipsis style={{ maxWidth: 180 }}>
              这是一段超长文本的单行省略展示
            </Typography>
          </Space>
        </Space>
      </Section>
      <Section id="space" title="间距 Space" description="使用统一间距排列一组内容，支持方向、对齐、换行和分隔节点。">
        <Space size="middle" split={<Divider orientation="vertical" />} wrap>
          <Button size="small">项目一</Button>
          <Button size="small">项目二</Button>
          <Button size="small">项目三</Button>
        </Space>
      </Section>
      <Section id="list" title="列表 List" description="使用数据源和 renderItem 渲染统一的列表容器。">
        <List
          bordered
          header="最近操作"
          footer="共 3 条记录"
          dataSource={["创建订单", "更新收货地址", "导出报表"]}
          renderItem={(item, index) => (
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Typography>{item}</Typography>
              <Typography muted>{$t("第 {index} 项", { index: index + 1 })}</Typography>
            </Space>
          )}
        />
      </Section>
      <Section id="colorpicker" title="颜色选择 ColorPicker" description="支持当前颜色、颜色文本和常用预设色。">
        <ColorPicker showText presets={["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed"]} />
      </Section>
      <Section id="context-menu" title="右键菜单 ContextMenu" description="在指定内容区域打开可操作的右键菜单。">
        <ContextMenu
          items={[
            { key: "refresh", label: "刷新内容", onClick: () => biuMessage.success($t("内容已刷新")) },
            { key: "copy", label: "复制地址", onClick: () => biuMessage.info($t("地址已复制")) },
            { key: "disabled", label: "暂不可用", disabled: true },
          ]}
        >
          <Box css={{ padding: 24, border: "1px dashed #94a3b8", borderRadius: 6, textAlign: "center" }}>
            在此区域点击右键
          </Box>
        </ContextMenu>
      </Section>
      <Section
        id="config-provider"
        title="全局配置 ConfigProvider"
        description="通过 Provider 向组件树统一提供语言、文案、主题和方向配置。"
      >
        <ConfigProvider locale="zh-CN" localeText={{ 暂无数据: "暂无可用记录" }}>
          <Empty description="ConfigProvider 已提供全局中文文案" />
        </ConfigProvider>
      </Section>
      <Section id="timeline" title="时间线 Timeline" description="展示时间顺序、处理状态和进行中节点。">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Timeline
            items={[
              { title: "示例节点一", content: "已完成的演示步骤", time: "09:00", color: "success" },
              { title: "示例节点二", content: "当前处理中的演示步骤", time: "10:30", color: "primary" },
            ]}
            pending="等待下一个示例节点"
          />
          <Timeline
            direction="horizontal"
            items={[
              { title: "提交", content: "申请已提交", time: "09:00", color: "success" },
              { title: "审核", content: "正在审核", time: "10:30", color: "primary" },
              { title: "完成", content: "等待处理", time: "--:--", color: "default" },
            ]}
          />
        </Space>
      </Section>
      <Section id="spin" title="加载 Spin" description="提供独立加载指示器或覆盖在内容区域上的加载状态。">
        <Space size="large">
          <Spin tip="加载中" />
          <Spin spinning size="small" tip="已完成" />
        </Space>
      </Section>
      <Section
        id="image"
        title="图片 Image"
        description="支持尺寸约束、懒加载、加载降级和点击预览；上传缩略图继续使用 Upload/FilePreview。"
      >
        <Space size="middle" align="start">
          <Image src="/logo.svg" alt="示例图片" width={120} height={80} preview />
          <Image src="/not-found-demo.png" alt="失败图片" width={120} height={80} fallback={<span>加载失败</span>} />
          <Image
            src="/logo.svg"
            alt="懒加载图片"
            width={120}
            height={80}
            lazy
            placeholder={<Spin size="small" />}
            preview
          />
        </Space>
      </Section>
      <Section
        id="notification"
        title="通知 Notification"
        description="通知支持标题、描述、语义类型、关闭和自动销毁；手动切换 LTR / RTL 时，通知堆栈跟随逻辑末端。"
      >
        <DirectionSwitch value={showcaseDirection} onChange={setShowcaseDirection} />
        <Space>
          <Button
            size="small"
            onClick={() =>
              notification.success($t("示例操作已完成"), { title: $t("成功通知"), dir: showcaseDirection })
            }
          >
            打开通知
          </Button>
          <Notification
            dir={showcaseDirection}
            title="静态通知"
            description="通知也可以直接作为受控内容渲染。"
            type="info"
            duration={0}
          />
        </Space>
      </Section>
      <Section id="affix" title="固定 Affix" description="滚动时固定工具或提示内容，支持指定滚动容器和状态回调。">
        <Affix offsetTop={12}>
          <span className="biu-showcase-affix-demo">滚动时固定的示例内容</span>
        </Affix>
      </Section>
    </>
  );
}
