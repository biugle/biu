# Logger

`@biugle/logger` is a framework-neutral native JavaScript logging package for React, Vue, HTML, iframe and SSR/Node applications. It does not depend on React, Runtime, Watermark or UI. Watermark refresh is connected through callbacks to avoid a dependency cycle.

## Install and log

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

`default`, `primary`, `success`, `warning` and `error` use a stable `[prefix][type]` prefix and browser colors when `%c` is supported. Multiple arguments remain native console arguments.

## Console guard, detection and watermark

```ts
const logger = createLogger({
  disableConsole: ["debug", "info"],
  detectConsoleOpen: true,
  onConsoleOpen: (event) => console.info("console signal", event.confidence),
  onWatermarkRefresh: () => watermark.refresh(),
  refreshThrottleMs: 1200,
});
```

Console replacement, DevTools detection and `debugger` are opt-in. Browsers expose no standard “DevTools opened” event, so detection is best effort and reports a method, confidence and timestamp. `debuggerMode` defaults to `off` and supports `off`, `on-open` and `interval`; `stop`/`destroy` clean up timers. `restoreConsole` and `destroy` restore every patched console method.

`onWatermarkRefresh` is throttled by `refreshThrottleMs` so observers, detection timers and DOM refreshes do not loop. Logger never depends on `@biugle/watermark`; the callback can target any watermark implementation.

## Demo

The **Logger 能力展示** page covers colored logs, lifecycle controls, console detection events, the watermark refresh contract and a complete API table through the public package entry.
