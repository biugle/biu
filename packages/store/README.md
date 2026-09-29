# @biugle/biu-store

Zustand stores for shared biu foundation state.

## What it provides

- Preferences for locale, theme, timezone and direction.
- Authentication and user information state.
- Menu interaction state and selection.
- Tab session persistence with an explicit scope.
- Normalization and valid fallback values for user-provided settings.
- Persisted favorites, recent records and tab sessions are schema-filtered; invalid records and stale selected keys are ignored.

## Install

```bash
pnpm add @biugle/biu-store zustand
```

## Usage

```tsx
import { useBiuTheme, useBiuPreferenceStore } from "@biugle/biu-store";

const theme = useBiuTheme();
useBiuPreferenceStore.getState().setTheme("system");
```

Use a separate store scope for each Portal or application so sessions and preferences remain isolated.

See the architecture guide in https://github.com/biugle/biu/blob/main/docs/design.md.

## License

MIT
