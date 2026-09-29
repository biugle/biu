# @biugle/logger

Framework-neutral console utilities for Biu applications. The package works in React, Vue, HTML and iframe applications without a framework dependency.

## Basic usage

```ts
import { createLogger } from "@biugle/logger";

const logger = createLogger({ prefix: "Orders" });
logger.success("loaded", { count: 10 });
logger.warning("using mock data");
logger.error("request failed", error);
logger.destroy();
```

`default`, `primary`, `success`, `warning` and `error` logs share a stable `[Biu][type]` prefix and use browser colors when the console supports `%c`. Multiple arguments remain usable as native console arguments.

## Console guard and DevTools callback

Console replacement, DevTools detection and repeated debugger pauses are opt-in:

```ts
const logger = createLogger({
  detectConsoleOpen: true,
  debuggerMode: "on-open",
  onConsoleOpen(event) {
    watermark.update({});
    console.info("console detection", event.confidence);
  },
  onWatermarkRefresh: () => watermark.update({}),
});

logger.destroy(); // stops timers and restores any patched console methods
```

Browsers do not expose a reliable standard “DevTools opened” event. The detector is therefore explicitly enabled and best-effort; callbacks include the probe method and confidence. The debugger uses a cancellable timer rather than a synchronous infinite loop, and its default is off. `disableConsole` can be `true` or a list of specific methods; `restoreConsole()` and `destroy()` restore the originals.

## License

MIT
