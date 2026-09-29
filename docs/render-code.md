# Render Code 能力

`@biugle/render-code` 是不限制前端框架的二维码/条码包，基于 `qrcode` 和 `jsbarcode` 封装。它不依赖 React、Vue、Runtime 或 Preset。

## API

| API                               | 作用                                                           |
| --------------------------------- | -------------------------------------------------------------- |
| `renderQRCode(value, options?)`   | 无 target 时返回 PNG data URL；有 target 时清理并追加 canvas。 |
| `renderBarcode(value, options)`   | 在 target 中生成 JsBarcode SVG。                               |
| `barcodeDataUrl(svg)`             | 将生成的 SVG 转成可下载/嵌入的 data URL。                      |
| `downloadCode(dataUrl, options?)` | 浏览器端触发下载，默认文件名为 `biu-code.png`。                |
| `qrcode` / `barcode`              | 上述方法的便捷命名空间。                                       |

`clear` 默认值为 `true`，避免值变化后留下旧图。二维码 renderer 参数和条码配置会继续向下透传；`downloadCode` 只需要浏览器 `Document`，渲染方法本身可以在不挂载 React 组件的环境使用。

## 示例

```ts
import { barcodeDataUrl, downloadCode, renderBarcode, renderQRCode } from "@biugle/render-code";

const png = await renderQRCode("order:1001");
downloadCode(png, { fileName: "order-1001.png" });

const svg = renderBarcode("890123456789", { target: document.querySelector("#barcode")! });
downloadCode(barcodeDataUrl(svg), { fileName: "order-1001.svg" });
```

Demo 的 **Render Code 能力展示** 页面覆盖实时生成、canvas/SVG 预览、data URL 导出和下载。
