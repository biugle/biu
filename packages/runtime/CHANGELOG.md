# @biugle/biu-runtime

## 2.0.0

### Major Changes

- a317c5b: 修复实际使用中碰到的多个已知问题，发布正式可用版本。

  React 集成相关公共包统一要求 React 19（`^19.0.0`），不再兼容 React 18。升级本版本前，请同步将宿主应用的 `react` 和 `react-dom` 升级到 React 19。

### Patch Changes

- Updated dependencies [a317c5b]
  - @biugle/biu-i18n@1.0.1
  - @biugle/biu-bridge@1.0.1
  - @biugle/biu-router@1.0.1
  - @biugle/biu-store@1.0.2
  - @biugle/react-components@2.0.0

## 1.0.3

### Patch Changes

- Updated dependencies
  - @biugle/biu-store@1.0.1

## 1.0.2

### Patch Changes

- 修复默认语言资源加载后重复请求并造成运行时持续重渲染的问题。

## 1.0.1

### Patch Changes

- Updated dependencies
  - @biugle/react-components@1.0.1

## 1.0.0

### Major Changes

- 732097a: 首次正式发版，功能完全可用。

### Patch Changes

- Updated dependencies [732097a]
  - @biugle/biu-bridge@1.0.0
  - @biugle/biu-events@1.0.0
  - @biugle/biu-i18n@1.0.0
  - @biugle/react-components@1.0.0
  - @biugle/biu-router@1.0.0
  - @biugle/biu-store@1.0.0

## 0.6.0

### Minor Changes

- c35a751: 增加组件库，开发库等基础能力，扩展基座能力范围。

### Patch Changes

- Updated dependencies [c35a751]
  - @biugle/biu-i18n@0.6.0
  - @biugle/biu-events@0.6.0
  - @biugle/biu-bridge@0.6.0
  - @biugle/biu-router@0.6.0
  - @biugle/biu-store@0.6.0
  - @biugle/react-components@0.4.0

## 0.5.0

### Minor Changes

- 3a7742c: 增加组件库，开发库等基础能力，扩展基座能力范围。

### Patch Changes

- Updated dependencies [3a7742c]
  - @biugle/biu-i18n@0.5.0
  - @biugle/biu-events@0.5.0
  - @biugle/biu-bridge@0.5.0
  - @biugle/biu-router@0.5.0
  - @biugle/biu-store@0.5.0
  - @biugle/react-components@0.3.0

## 0.4.0

### Minor Changes

- 3081003: 增加组件库，开发库等基础能力，扩展基座能力范围。

### Patch Changes

- Updated dependencies [3081003]
  - @biugle/biu-i18n@0.4.0
  - @biugle/biu-events@0.4.0
  - @biugle/biu-bridge@0.4.0
  - @biugle/biu-router@0.4.0
  - @biugle/biu-store@0.4.0
  - @biugle/react-components@0.2.0

## 0.3.0

### Minor Changes

- 774489a: 优化交互约束，收敛页面加载规范。

### Patch Changes

- Updated dependencies [774489a]
  - @biugle/biu-i18n@0.3.0
  - @biugle/biu-events@0.3.0
  - @biugle/biu-bridge@0.3.0
  - @biugle/biu-router@0.3.0
  - @biugle/biu-store@0.3.0
  - @biugle/biu-ui@0.3.0

## 0.2.1

### Patch Changes

- Prepare the 0.2.1 package release with the public package documentation and licensing metadata.
- Updated dependencies
  - @biugle/biu-bridge@0.2.1
  - @biugle/biu-events@0.2.1
  - @biugle/biu-i18n@0.2.1
  - @biugle/biu-router@0.2.1
  - @biugle/biu-store@0.2.1
  - @biugle/react-components@0.1.0

## 0.2.0

### Minor Changes

- 63740db: Rename the foundation scope and CLI to Biu, extract reusable i18n, events, bridge, router, store, and UI packages, and complete the demo and release workflow. Bridge and UI are consumed through their single public package entries.

### Patch Changes

- 63740db: Add package-level README files, MIT licenses, npm descriptions and explicit documentation metadata for the 0.2.1 release.
- Updated dependencies [63740db]
- Updated dependencies [63740db]
  - @biugle/biu-bridge@0.2.0
  - @biugle/biu-events@0.2.0
  - @biugle/biu-i18n@0.2.0
  - @biugle/biu-router@0.2.0
  - @biugle/biu-store@0.2.0
  - @biugle/react-components@0.1.0
