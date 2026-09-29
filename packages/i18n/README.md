# @biugle/biu-i18n

Framework-agnostic internationalization primitives shared by the biu foundation and business applications.

## What it provides

- Locale normalization with valid fallback values.
- Browser locale detection.
- Language resource registration and runtime reload.
- A simple typed translation resource API.
- Built-in zh-CN and en-US locale conventions.
- Runtime resources are validated and translation values are restricted to strings; removing the active locale persists the safe fallback.

## Install

```bash
pnpm add @biugle/biu-i18n
```

## Usage

```ts
import { createI18n } from "@biugle/biu-i18n";

const i18n = createI18n("zh-CN");
i18n.addLocale({ key: "en-US", desc: "English", translation: { 问候: "Hello" } });
i18n.setLocale("en-US");
console.log(i18n.$t("问候"));
```

Keep application resources in the application or data layer; this package provides the reusable i18n contract and runtime.

See the data contracts in https://github.com/biugle/biu/blob/main/docs/data-contracts.md.

## License

MIT
