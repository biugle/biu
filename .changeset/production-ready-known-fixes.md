---
"@biugle/biu-cli": minor
"@biugle/biu-i18n": patch
"@biugle/http": patch
"@biugle/biu-bridge": patch
"@biugle/biu-router": patch
"@biugle/biu-store": patch
"@biugle/biu-adapter-react": major
"@biugle/biu-preset": major
"@biugle/biu-runtime": major
"@biugle/icons": major
"@biugle/react-components": major
"@biugle/react-form": major
"@biugle/react-table": major
"@biugle/tanstack-query": major
---

修复实际使用中碰到的多个已知问题，发布正式可用版本。

React 集成相关公共包统一要求 React 19（`^19.0.0`），不再兼容 React 18。升级本版本前，请同步将宿主应用的 `react` 和 `react-dom` 升级到 React 19。
