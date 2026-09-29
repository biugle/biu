# @biugle/tanstack-query

One package for Biu's TanStack Query conventions. The root entry is framework-neutral and the `./react` entry contains React bindings.

```ts
import { createBiuQueryKeys } from "@biugle/tanstack-query";
import { BiuQueryClientProvider, createBiuReactQueryClient, useBiuRequest } from "@biugle/tanstack-query/react";

const queryKeys = createBiuQueryKeys("users");
const client = createBiuReactQueryClient();
```

`@biugle/tanstack-query` does not depend on React, `@biugle/http`, Runtime, Router, Store or UI. Requests receive the standard `AbortSignal`; applications can pass `@biugle/http` or any other transport. Chart, RichText, Editor and Preview Server adapters are intentionally outside this package.

Core 常用方法包括 `createBiuQueryClient`、`createBiuQueryKeys`、`createBiuQueryOptions`、`createBiuMutationOptions`、`createBiuMutationController`、`normalizeBiuListResponse`、`unwrapBiuResponse`、`isAbortError` 和 `shouldRetryBiuQuery`。`createBiuMutationOptions` 可通过 `signal` 接入外部取消控制器：

```ts
const controller = createBiuMutationController();
const options = createBiuMutationOptions({
  signal: controller.signal,
  mutationFn: (payload, { signal }) => request("/save", { payload, signal }),
});
controller.cancel("用户取消");
```

React `/react` 入口提供 `BiuQueryClientProvider`、`useBiuQuery`、`useBiuQueries`、`useBiuInfiniteQuery`、`useBiuMutation`、`useBiuRequest`、`useBiuMutationRequest` 和 `useBiuMutationController`。`useBiuMutationRequest` 返回的 mutation 额外提供 `cancel(reason?)`，用于取消当前请求；新 mutation 会自动取消旧 mutation，组件卸载时也会取消当前请求。
