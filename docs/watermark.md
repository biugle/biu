# Watermark 能力

`@biugle/watermark` 使用原生 DOM 和 SVG 生成可重复的非交互水印，适用于 React、Vue、HTML 和 iframe。它不依赖任何前端框架。

```ts
import { createWatermark } from "@biugle/watermark";

const watermark = createWatermark(document.querySelector<HTMLElement>("#workspace")!, {
  text: ["Biu", "仅供演示"],
  opacity: 0.14,
  rotate: -22,
  gap: [120, 90],
});

watermark.update({ text: "已更新" });
watermark.destroy();
```

可配置 `color`、`opacity`、`fontSize`、`fontFamily`、`rotate`、`gap`、`offset`、`zIndex` 和 `className`。组件会在需要时把 target 设为相对定位，水印层使用 `pointer-events: none`，销毁时恢复原始 inline position。

独立 `createWatermark` 默认使用 `text="Biu"`、`color="#64748b"`、`opacity=0.16`、`fontSize=14`、`fontFamily="Arial, sans-serif"`、`rotate=-22`、`gap=[100,80]`、`offset=[0,0]` 和 `zIndex=10`。`opacity` 限制在 0..1，字号至少 8px；创建时的 `refreshThrottleMs` 默认 500ms，至少 100ms。这些是独立包默认值，官方 Preset 可根据应用名提供不同的 text。

## 基座接入

官方 `@biugle/biu-preset` 通过 `BiuLayoutOptions.watermark` 使用同一个实现：

```ts
layout: {
  preset: "sidebar",
  watermark: {
    enabled: true,
    text: ["Biu", "内部系统"],
    opacity: 0.12,
  },
}
```

省略 `text` 时默认使用 `brandLabel`/应用名，`enabled: false` 仅移除水印，不改变布局骨架。Demo 的 **Watermark 能力展示** 页面可以实时修改文案、颜色、透明度和旋转角度。
