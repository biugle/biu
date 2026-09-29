export interface BiuEventEnvelope<T = unknown> {
  name: string;
  payload: T;
  source?: string;
  timestamp: number;
}

export interface BiuEventBus {
  publish<T>(name: string, payload: T, source?: string): void;
  subscribe<T>(name: string, listener: (event: BiuEventEnvelope<T>) => void): () => void;
  clear(name?: string): void;
}

export interface BiuEventBusOptions {
  /** Called when a subscriber throws. Other subscribers still receive the event. */
  onError?: (error: unknown, event: BiuEventEnvelope) => void;
}

function assertEventName(name: string) {
  if (typeof name !== "string" || !name.trim() || name.length > 160) {
    throw new TypeError("Event name must be a non-empty string of at most 160 characters");
  }
}

/** Framework-neutral, scoped event bus for same-document consumers. */
export function createBiuEventBus(options: BiuEventBusOptions = {}): BiuEventBus {
  const listeners = new Map<string, Set<(event: BiuEventEnvelope<unknown>) => void>>();

  return {
    publish<T>(name: string, payload: T, source?: string) {
      assertEventName(name);
      const event: BiuEventEnvelope<T> = {
        name,
        payload,
        source,
        timestamp: Date.now(),
      };
      for (const listener of [...(listeners.get(name) ?? [])]) {
        try {
          listener(event as BiuEventEnvelope<unknown>);
        } catch (error) {
          options.onError?.(error, event);
        }
      }
    },
    subscribe<T>(name: string, listener: (event: BiuEventEnvelope<T>) => void) {
      assertEventName(name);
      if (typeof listener !== "function") throw new TypeError("Event listener must be a function");
      const bucket = listeners.get(name) ?? new Set();
      const wrapped = listener as (event: BiuEventEnvelope<unknown>) => void;
      bucket.add(wrapped);
      listeners.set(name, bucket);
      return () => {
        bucket.delete(wrapped);
        if (!bucket.size) listeners.delete(name);
      };
    },
    clear(name?: string) {
      if (name !== undefined) {
        assertEventName(name);
        listeners.delete(name);
      } else listeners.clear();
    },
  };
}

export const biuEventBus = createBiuEventBus();
