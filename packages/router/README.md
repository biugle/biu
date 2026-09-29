# @biugle/biu-router

Framework-agnostic menu and navigation utilities for biu projects.

## What it provides

- Hierarchical menu keys and complete route paths.
- Menu flattening, trail lookup and path lookup.
- Permission filtering and metadata merging.
- Portal and directory menu fetching.
- Query parameter handling and directory child replacement.
- Permission requests include the active locale. Metadata merges and lazy directory replacement use the complete menu hierarchy, so duplicate leaf Codes remain isolated.

## Install

```bash
pnpm add @biugle/biu-router
```

## Usage

```ts
import { annotateMenuKeys, menuRoutePath } from "@biugle/biu-router";

const menus = annotateMenuKeys(menuTree);
const path = menuRoutePath(menus[0]);
```

Use the complete menu key for navigation and authorization; do not identify a page by its last segment alone.

See the usage guide in https://github.com/biugle/biu/blob/main/docs/usage.md.

## License

MIT
