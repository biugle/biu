---
"@biugle/react-components": patch
"@biugle/react-form": patch
"@biugle/react-table": patch
"@biugle/biu-preset": patch
"@biugle/biu-runtime": minor
"@biugle/biu-cli": minor
"@biugle/biu-bridge": minor
---

组件部分样式边界优化。

Add opt-in route-level keep-alive caching for local pages and remote APP iframes. The Bridge exposes optional host activation state so embedded apps can pause background work; the default remains off.

增加 keepAlive 支持。
