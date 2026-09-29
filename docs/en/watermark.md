# Watermark

`@biugle/watermark` creates a repeating non-interactive watermark with native DOM and SVG for React, Vue, HTML and iframe applications. It has no framework dependency.

```ts
import { createWatermark } from "@biugle/watermark";

const watermark = createWatermark(document.querySelector("#workspace")!, {
  text: ["Biu", "Demo only"],
  opacity: 0.14,
  rotate: -22,
  gap: [120, 90],
});

watermark.update({ text: "Updated" });
watermark.destroy();
```

Configure `color`, `opacity`, `fontSize`, `fontFamily`, `rotate`, `gap`, `offset`, `zIndex` and `className`. The helper makes the target relative only when necessary, uses `pointer-events: none` for the layer and restores the original inline position on destroy.

## Preset integration

Official `@biugle/biu-preset` consumes the same helper through `BiuLayoutOptions.watermark`:

```ts
layout: {
  preset: "sidebar",
  watermark: {
    enabled: true,
    text: ["Biu", "Internal system"],
    opacity: 0.12,
  },
}
```

When `text` is omitted, the official layout uses `brandLabel`/the application name. `enabled: false` removes only the watermark layer and does not change the layout skeleton. The Demo **Watermark** page lets you edit text, color, opacity and rotation live.
