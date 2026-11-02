# @biugle/biu-events

A small, typed, framework-agnostic event bus for communication inside a Portal, APP or shared runtime.

## What it provides

- Typed event envelopes with name, payload and source.
- createBiuEventBus for isolated buses.
- biuEventBus for a shared default bus.
- Subscription cleanup through an unsubscribe function.
- Event names are validated as non-empty strings up to 160 characters.
- Subscribers are snapshotted for each publish; one failing subscriber does not prevent the remaining subscribers from running. Pass `onError` to `createBiuEventBus` to collect subscriber errors. A synchronous exception thrown by `onError` is also isolated, so the remaining subscribers still receive the event.

## Install

```bash
pnpm add @biugle/biu-events
```

## Usage

```ts
import { createBiuEventBus } from "@biugle/biu-events";

const events = createBiuEventBus();
const unsubscribe = events.subscribe("demo:ready", (event) => {
  console.log(event.payload);
});
events.publish("demo:ready", { ready: true }, "portal");
unsubscribe();
```

`clear(name)` removes current same-name subscribers and `clear()` removes all current subscribers. Later subscriptions remain independent: calling an old unsubscribe handle, even repeatedly, cannot remove a bucket created after clearing.

Use `@biugle/biu-bridge` when an event must cross an iframe or browser-window boundary. The bus itself does not validate Origins or application IDs. Runtime applies those checks together with the actual sender window, delivers incoming host events only to the APP's base local bus, and forwards locally produced APP events through its outgoing wrapper. This avoids echoing received events back to their sender; payload `source` labels are not security identities.

See the [data contracts](https://github.com/biugle/biu/blob/main/docs/data-contracts.md).

## License

MIT
