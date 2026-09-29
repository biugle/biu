# Logger 能力

`@biugle/logger` 是不限制前端框架的原生 JavaScript 日志包，支持 React、Vue、HTML、iframe 和 SSR/Node 场景。它不依赖 React、Runtime、Watermark 或 UI；水印刷新通过回调连接，避免循环依赖。

## 安装与日志

```bash
pnpm add @biugle/logger
```

```ts
import { createLogger } from "@biugle/logger";

const logger = createLogger({ prefix: "Orders" });
logger.success("loaded", { count: 10 });
logger.warning("using mock data");
logger.error("request failed", error);
logger.destroy();
```

`default`、`primary`、`success`、`warning`、`error` 会输出稳定的 `[prefix][type]` 前缀，并在支持 `%c` 的浏览器控制台中使用颜色；多参数仍按原生 console 参数传递。

## Console guard、检测与水印联动

```ts
const logger = createLogger({
  disableConsole: ["debug", "info"],
  detectConsoleOpen: true,
  onConsoleOpen: (event) => console.info("console signal", event.confidence),
  onWatermarkRefresh: () => watermark.refresh(),
  refreshThrottleMs: 1200,
});
```

禁止 console、DevTools 探测和 `debugger` 都是显式 opt-in。浏览器没有标准的“打开控制台”事件，因此探测属于最佳努力信号；回调包含 `method`、`confidence` 和时间戳。`debuggerMode` 默认关闭，支持 `off`、`on-open`、`interval`，定时器可由 `stop`/`destroy` 清理。任何被替换的 console 方法都由 `restoreConsole`/`destroy` 恢复。

`onWatermarkRefresh` 会按 `refreshThrottleMs` 节流，避免水印 observer、检测 timer 和 DOM 刷新互相触发。Logger 不直接依赖 `@biugle/watermark`，调用方可以将回调连接到任意水印实现。

## Demo

Demo 的 **Logger 能力展示** 页面覆盖彩色日志、生命周期、console 检测事件、水印刷新契约和完整 API 表。页面只调用公开入口，不维护第二套日志实现。
