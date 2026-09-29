# @biugle/icons

The single icon boundary used by the biu foundation and its public component packages. It keeps the underlying icon implementation replaceable and prevents applications from depending on the raw icon package.

```bash
pnpm add @biugle/icons
```

```tsx
import { Search, Settings } from "@biugle/icons";

<Search aria-label="Search" size={16} />;
```

Applications should import icons from this package rather than importing the underlying icon implementation directly.

The package also exposes a complete runtime catalog for search and categorized showcases:

```tsx
import { biuIconCatalog, searchBiuIcons, getBiuIcon } from "@biugle/icons";

const results = searchBiuIcons("arrow", "navigation");
const SettingsIcon = getBiuIcon("settings");
```

The catalog is derived from the complete Lucide export object, so capability pages do not maintain a hand-written subset.

`@biugle/icons` is the single icon entry point for the biu ecosystem. It re-exports the Lucide React icon set so applications and foundation packages do not depend on the underlying icon package directly.

```tsx
import { Search, Settings2 } from "@biugle/icons";
```
