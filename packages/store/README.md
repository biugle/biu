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

`createBiuStore` accepts an optional `name` and an `initialState` object or factory. Its optional persistence layer filters credential-shaped field names by default only when no custom `partialize` is supplied; callers own filtering when they supply `partialize`. This does not sanitize arbitrary in-memory auth data or secrets hidden inside otherwise innocuous values. Pass only non-sensitive identity to `useBiuAuthStore.context`.

`createBiuStore` preserves Zustand's native stable `getInitialState()` snapshot, including actions, for SSR/hydration; reset still regenerates data through the `initialState` factory without replacing that initial snapshot.

See the [architecture guide](https://github.com/biugle/biu/blob/main/docs/design.md).

## License

MIT
