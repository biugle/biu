import { useState } from "react";
import {
  Box,
  Card,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Divider,
  FileCard,
  FilePreviewDialog,
  FileRender,
  Grid,
  ResizeBox,
  Stack,
  Space,
  Typography,
  Upload,
  type BiuFileItem,
} from "@biugle/react-components/ui";
import { biuMessage } from "@biugle/react-components";
import { useBiuContext, useBiuI18n } from "@biugle/biu-runtime";
import { AnchorScrollProgressDemo } from "../anchor-scroll-progress-demo.js";
import { Section } from "../section.js";
import type { CatalogDirectionProps } from "../catalog-types.js";

export function LayoutFileSections({ pro, showcaseDirection, setShowcaseDirection }: CatalogDirectionProps) {
  const { $t } = useBiuI18n();
  const { locale } = useBiuContext();
  const [previewFile, setPreviewFile] = useState<BiuFileItem>();
  const [files, setFiles] = useState<BiuFileItem[]>([
    { uid: "logo", name: "logo.svg", type: "image/svg+xml", url: "/logo.svg", status: "success" },
    { uid: "guide", name: "guide.pdf", type: "application/pdf", url: "/guide.pdf", status: "ready" },
  ]);
  return (
    <>
      <Section
        id="resizebox"
        title="调整尺寸 ResizeBox"
        description="普通容器支持受边界约束的宽高调整，并通过回调同步最新尺寸。"
      >
        <ResizeBox width={280} height={110}>
          <Space direction="vertical">
            <Typography strong>可调整容器</Typography>
            <Typography muted>拖动右下角调整大小，子内容保持在容器内部。</Typography>
          </Space>
        </ResizeBox>
      </Section>
      <Section id="box" title="布局 Box" description="最小布局容器，支持 css/sx CSS-in-JS 对象、数组和函数样式。">
        <Space direction="vertical" size="small">
          <Box css={{ padding: 12, border: "1px solid #dbe3ee", borderRadius: 6 }}>css 对象样式</Box>
          <Box sx={[{ padding: 12, border: "1px solid #bfdbfe" }, { color: "#2563eb" }]}>sx 数组样式</Box>
          <Box sx={() => ({ padding: 12, border: "1px solid #bbf7d0", color: "#16a34a" })}>sx 函数样式</Box>
        </Space>
      </Section>
      <Section id="grid" title="布局 Grid" description="响应式网格，统一处理列数和间距。">
        <Grid columns={pro ? 3 : 2} gap={12}>
          <Box>Grid 项目一</Box>
          <Box>Grid 项目二</Box>
          <Box>Grid 项目三</Box>
        </Grid>
      </Section>
      <Section id="stack" title="布局 Stack" description="统一处理横向或纵向排列及间距。">
        <Stack gap={6}>
          <span>Stack 项目一</span>
          <span>Stack 项目二</span>
          <span>Stack 项目三</span>
        </Stack>
      </Section>
      <Section id="card" title="卡片 Card" description="用于承载一组相关内容，保持标题、内容和间距一致。">
        <Card title="Card 标题">Card 内容区域</Card>
      </Section>
      <Section id="divider" title="分隔线 Divider" description="在内容组之间提供清晰的视觉分隔。">
        <Stack direction="column" gap={8}>
          <span>上方内容</span>
          <Divider />
          <span>下方内容</span>
        </Stack>
      </Section>
      <Section id="collapsible" title="折叠面板 Collapsible" description="支持展开、收起和自定义触发器。">
        <Collapsible defaultOpen>
          <CollapsibleTrigger>展开更多</CollapsibleTrigger>
          <CollapsibleContent>Collapsible 内容区。</CollapsibleContent>
        </Collapsible>
      </Section>
      <Section
        id="anchor-scroll-progress"
        title="标题锚点 Anchor / 滚动进度 ScrollProgress"
        description="自动扫描 h1-h5 标题生成目录；切换方向时，目录与阅读进度保持在同一侧。"
      >
        <AnchorScrollProgressDemo direction={showcaseDirection} onDirectionChange={setShowcaseDirection} />
      </Section>
      <Section
        id="upload-file-preview"
        title="上传与文件预览 Upload / File Preview"
        description="拖拽或选择文件，演示类型/大小校验、模拟上传进度、取消/重试、大小/时间、下载和预览。"
      >
        <Upload
          multiple
          drag
          accept="image/*,.pdf,.md"
          maxSize={5 * 1024 * 1024}
          showFileList
          fileList={files}
          locale={locale}
          onFileListChange={setFiles}
          onFiles={(selected) => biuMessage.success($t("选择 {count} 个文件", { count: selected.length }))}
          onFileRejected={(_file, reason) =>
            biuMessage.warning(reason === "accept" ? $t("文件类型不支持") : $t("文件不能超过 5 MB"))
          }
          onCancel={() => biuMessage.info($t("上传已取消"))}
          customRequest={({ onProgress, onSuccess, signal }) => {
            let percent = 0;
            const timer = window.setInterval(() => {
              if (signal.aborted) {
                window.clearInterval(timer);
                return;
              }
              percent += 25;
              onProgress(percent);
              if (percent >= 100) {
                window.clearInterval(timer);
                onSuccess();
              }
            }, 160);
            return { abort: () => window.clearInterval(timer) };
          }}
          onPreview={setPreviewFile}
        >
          <div>
            <span className="biu-showcase-upload-button">选择文件或拖拽到这里</span>
            <p>支持图片、PDF、Markdown；单文件不超过 5 MB。</p>
          </div>
        </Upload>
        <FileCard name="architecture.md" size="12 KB" locale={locale} />
        <FilePreviewDialog
          open={Boolean(previewFile)}
          onOpenChange={(open) => {
            if (!open) setPreviewFile(undefined);
          }}
          file={previewFile ?? files[0]}
          locale={locale}
        />
        <FileRender src="/logo.svg" name="logo.svg" kind="image" locale={locale} />
      </Section>
    </>
  );
}
