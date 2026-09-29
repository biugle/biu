# @biugle/watermark

`@biugle/watermark` is a framework-neutral DOM watermark helper. It works in React, Vue, HTML and iframe applications without a framework dependency. It renders a non-interactive repeating SVG background and supports multi-line text, color, opacity, rotation, spacing, offsets, custom classes and runtime updates.

## Install

```bash
pnpm add @biugle/watermark
```

## Basic usage

```ts
import { createWatermark } from "@biugle/watermark";

const handle = createWatermark(document.querySelector("#workspace")!, {
  text: ["Biu Internal", "仅供演示"],
  color: "#64748b",
  opacity: 0.14,
  rotate: -22,
  gap: [120, 90],
  observeTamper: true,
  zIndex: 10,
});

handle.update({ text: "已更新的水印", opacity: 0.2 });
handle.refresh();
handle.destroy();
```

The target is made `position: relative` only when it is statically positioned, the watermark has `pointer-events: none`, and the original inline position is restored on `destroy`. Text, font family and color are escaped before being embedded in the SVG data URI. When `observeTamper` is enabled, the helper watches the watermark layer and restores removed or changed layer attributes with a throttled refresh. A logger can call `handle.refresh()` from its `onConsoleOpen` or `onWatermarkRefresh` callback without creating a package dependency cycle.

## Official Layout integration

The official `@biugle/biu-preset` consumes the same helper through `BiuLayoutOptions.watermark`:

```ts
export default {
  layout: {
    preset: "sidebar",
    watermark: {
      enabled: true,
      text: ["Biu", "内部系统"],
      opacity: 0.12,
      rotate: -20,
    },
  },
};
```

When `enabled` is true and `text` is omitted, the official layout uses the configured application label. `enabled: false` removes the layer without changing the layout skeleton. The preset does not maintain a second watermark implementation.

## Demo

The Demo menu contains **Watermark 能力展示**, where text, color, opacity and rotation can be changed live. The page also shows the exact layout configuration used by the official preset.

## License

MIT
