# Watermark

`@biugle/watermark` creates a repeating non-interactive watermark with native DOM and SVG for React, Vue, HTML and iframe applications. It has no framework dependency.

```ts
import { createWatermark } from "@biugle/watermark";

const watermark = createWatermark(document.querySelector<HTMLElement>("#workspace")!, {
  text: ["Biu", "Demo only"],
  opacity: 0.14,
  rotate: -22,
  gap: [120, 90],
});

watermark.update({ text: "Updated" });
watermark.destroy();
```

Configure `color`, `opacity`, `fontSize`, `fontFamily`, `rotate`, `gap`, `offset`, `zIndex` and `className`. The helper makes the target relative only when necessary, uses `pointer-events: none` for the layer and restores the original inline position on destroy.

Standalone `createWatermark` defaults to `text="Biu"`, `color="#64748b"`, `opacity=0.16`, `fontSize=14`, `fontFamily="Arial, sans-serif"`, `rotate=-22`, `gap=[100,80]`, `offset=[0,0]` and `zIndex=10`. Opacity is clamped to 0..1 and font size to at least 8px. The creation-time `refreshThrottleMs` defaults to 500ms with a 100ms minimum. These are package defaults; the official Preset can supply application-specific text.

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
