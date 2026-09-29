import { useCallback, useEffect, useRef, useState } from "react";
import {
  barcodeDataUrl,
  downloadCode,
  renderBarcode,
  renderBarcodeImage,
  renderQRCode,
  renderQRCodeImage,
} from "@biugle/render-code";
import { Button, Tag, TextField } from "@biugle/react-components";
import {
  CapabilityActions,
  CapabilityApiTable,
  CapabilityCard,
  CapabilityGrid,
  CapabilityPage,
} from "../CapabilityPage/index.js";

export default function RenderCodeShowcase() {
  const qrTarget = useRef<HTMLDivElement>(null);
  const barcodeTarget = useRef<HTMLDivElement>(null);
  const qrImageTarget = useRef<HTMLImageElement>(null);
  const barcodeImageTarget = useRef<HTMLImageElement>(null);
  const [value, setValue] = useState("https://biugle.cn/order/1001");
  const [qrDataUrl, setQrDataUrl] = useState<string>();
  const [barcodeUrl, setBarcodeUrl] = useState<string>();
  const [qrImageUrl, setQrImageUrl] = useState<string>();
  const [barcodeImageUrl, setBarcodeImageUrl] = useState<string>();
  const [status, setStatus] = useState("尚未生成");

  const generate = useCallback(async () => {
    if (!qrTarget.current || !barcodeTarget.current || !qrImageTarget.current || !barcodeImageTarget.current) return;
    try {
      const canvas = await renderQRCode(value, { target: qrTarget.current, width: 180, margin: 2 });
      const svg = renderBarcode(value.replace(/\D/g, "") || "890123456789", {
        target: barcodeTarget.current,
        format: "CODE128",
        displayValue: true,
        height: 58,
        margin: 8,
      });
      const qrImage = await renderQRCodeImage(value, {
        target: qrImageTarget.current,
        width: 180,
        margin: 2,
        alt: "二维码图片降级预览",
      });
      const barcodeImage = renderBarcodeImage(value.replace(/\D/g, "") || "890123456789", {
        target: barcodeImageTarget.current,
        format: "CODE128",
        displayValue: true,
        height: 58,
        margin: 8,
        alt: "条形码图片降级预览",
      });
      setQrDataUrl(canvas.toDataURL("image/png"));
      setBarcodeUrl(barcodeDataUrl(svg));
      setQrImageUrl(qrImage);
      setBarcodeImageUrl(barcodeImage);
      setStatus(`已生成：${value}`);
    } catch (error) {
      setStatus(`生成失败：${error instanceof Error ? error.message : String(error)}`);
    }
  }, [value]);

  useEffect(() => {
    void generate();
  }, [generate]);

  return (
    <CapabilityPage
      className="biu-service-showcase-page"
      title="Render Code 能力展示"
      description="@biugle/render-code 用原生 DOM API 封装 qrcode 与 jsbarcode，不依赖 React/Vue，可在任意前端系统直接复用。"
    >
      <CapabilityGrid>
        <CapabilityCard
          title="统一生成入口"
          description="二维码支持 data URL 或 canvas 目标；条码默认输出 SVG，clear 默认清理旧内容。"
        >
          <div className="biu-capability-control-row">
            <TextField
              value={value}
              onChange={(event) => setValue(event.target.value)}
              allowClear
              placeholder="输入订单号或 URL"
            />
            <Button type="primary" onClick={() => void generate()}>
              重新生成
            </Button>
            <Tag color="info">{status}</Tag>
          </div>
          <pre className="biu-capability-code">{`renderQRCode(value, { target, width: 180 })\nrenderBarcode(value, { target, format: "CODE128" })`}</pre>
        </CapabilityCard>

        <CapabilityCard title="QRCode / Barcode 实时预览">
          <div className="biu-capability-control-row">
            <div ref={qrTarget} aria-label="二维码预览" />
            <div ref={barcodeTarget} aria-label="条形码预览" />
          </div>
          <div className="biu-capability-control-row" style={{ marginTop: 16 }}>
            <figure style={{ margin: 0 }}>
              <img ref={qrImageTarget} src={qrImageUrl} alt="二维码图片降级预览" width={180} height={180} />
              <figcaption>img / PNG 降级</figcaption>
            </figure>
            <figure style={{ margin: 0 }}>
              <img ref={barcodeImageTarget} src={barcodeImageUrl} alt="条形码图片降级预览" />
              <figcaption>img / PNG 或 SVG 降级</figcaption>
            </figure>
          </div>
          <CapabilityActions>
            <Button
              size="small"
              disabled={!qrDataUrl}
              onClick={() => qrDataUrl && downloadCode(qrDataUrl, { fileName: "biu-qrcode.png" })}
            >
              下载二维码
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!barcodeUrl && !barcodeImageUrl}
              onClick={() =>
                (barcodeImageUrl || barcodeUrl) &&
                downloadCode(barcodeImageUrl || barcodeUrl || "", { fileName: "biu-barcode-image" })
              }
            >
              下载条码图片
            </Button>
          </CapabilityActions>
        </CapabilityCard>

        <CapabilityCard title="能力边界">
          <ul className="biu-capability-list">
            <li>React、Vue、HTML、iframe 都直接调用同一个原生 JS 包。</li>
            <li>qrcode 与 jsbarcode 的渲染参数向下透传，业务可按需要自定义颜色、尺寸和格式。</li>
            <li>下载只是浏览器增强方法；服务端或 SSR 可只使用二维码 data URL 生成能力。</li>
          </ul>
        </CapabilityCard>
      </CapabilityGrid>
      <CapabilityCard
        title="Render Code 属性与方法"
        description="原生 JavaScript 入口同时支持 DOM 挂载、data URL、img 降级和浏览器下载；不依赖 React。"
      >
        <CapabilityApiTable
          rows={[
            {
              component: "renderQRCode",
              name: "value / target / width / margin",
              type: "string / HTMLElement / number / number",
              defaultValue: "target 可选 / qrcode 默认值",
              description: "无 target 返回 PNG data URL，有 target 挂载 canvas 并按 clear 清理旧内容。",
              demo: "Canvas / PNG 预览",
            },
            {
              component: "renderBarcode",
              name: "value / target / format / displayValue",
              type: "string / HTMLElement | SVGElement / string / boolean",
              defaultValue: "CODE128 由 JsBarcode 决定",
              description: "使用 JsBarcode 生成 SVG，支持颜色、尺寸、字体和条码格式透传。",
              demo: "SVG 预览",
            },
            {
              component: "renderQRCodeImage / renderBarcodeImage",
              name: "target / alt / clear",
              type: "HTMLImageElement / string / boolean",
              defaultValue: "clear=true",
              description:
                "为旧打印插件提供 img.src 可用的 base64 图片；条码优先 PNG，Canvas 不可用时回退 SVG data URL。",
              demo: "img / PNG 或 SVG 降级",
            },
            {
              component: "barcodeDataUrl",
              name: "node",
              type: "SVGElement => string",
              defaultValue: "-",
              description: "把已生成的 SVG 条码序列化为可下载或嵌入的 data URL。",
              demo: "下载条码图片",
            },
            {
              component: "downloadCode",
              name: "dataUrl / fileName",
              type: "string / string",
              defaultValue: "biu-code.png",
              description: "浏览器环境创建临时下载链接；SSR/Node 只使用渲染方法，不调用下载。",
              demo: "下载二维码",
            },
          ]}
        />
      </CapabilityCard>
    </CapabilityPage>
  );
}
