# @biugle/biu-bridge

Framework-agnostic protocol helpers with origin validation for communication between a Portal and an independent APP or iframe.

## What it provides

- Origin normalization and parent-origin resolution.
- Safe remote URL validation.
- Typed checks for auth, overlay, host-context and application-event messages.
- Safe public auth context serialization.
- Explicit message targets are normalized to HTTP(S) origins and the `CHANNEL` field cannot be overridden by caller data.
- Only an omitted `postBiuMessage` target invokes parent-origin inference. Explicit empty, malformed or rejected targets do not fall back to an unchecked parent. Pass the result of `parentOrigin(allowedOrigins)` explicitly when enforcing a host allowlist.
- Public identity extensions are recursively filtered for credential-like keys before crossing the window boundary.

## Install

```bash
pnpm add @biugle/biu-bridge
```

## Usage

```ts
import { isSafeRemoteUrl, postBiuMessage } from "@biugle/biu-bridge";

const portalOrigin = "https://biu-a.biugle.cn";
if (isSafeRemoteUrl(portalOrigin, [portalOrigin])) {
  postBiuMessage(
    { TYPE: "APP_EVENT", APP_ID: "child-app", PAYLOAD: { name: "order:saved", payload: { id: "example-order" } } },
    portalOrigin,
  );
}
```

Run this example inside the APP iframe; `postBiuMessage` targets its parent and adds `CHANNEL: "BIU"`. The receiving Portal must validate the sender's origin and application identity. Always configure an explicit allowlist for production origins. Runtime owns application-specific wiring, and callers must keep credentials out of application-event payloads.

Runtime also checks the actual parent/iframe window through `MessageEvent.source`; the event payload's optional `source` is only a label. Host events received by an APP are delivered locally without being echoed back through its outgoing wrapper. Locally produced APP events still forward to the validated host. Unknown or rejected hosts receive no `useBiuOverlay` notification.

See the [Adapter guide](https://github.com/biugle/biu/blob/main/docs/adapters.md) and [data contracts](https://github.com/biugle/biu/blob/main/docs/data-contracts.md).

## License

MIT
