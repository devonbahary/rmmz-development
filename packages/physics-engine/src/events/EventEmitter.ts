export type EventCallback<T> = (event: T) => void;

/**
 * Lightweight generic EventEmitter with TypeScript support
 * Zero overhead when no listeners are registered
 */
export class EventEmitter<EventMap extends Record<string, any>> {
  private listeners: Map<keyof EventMap, Set<EventCallback<any>>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * Register an event listener
   */
  on<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unregister an event listener
   */
  off<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event to all registered listeners
   */
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data);
      }
    }
  }

  /**
   * Check if there are any listeners for a specific event
   * Used for performance optimization - skip event creation if no listeners
   */
  hasListeners(event: keyof EventMap): boolean {
    const callbacks = this.listeners.get(event);
    return callbacks !== undefined && callbacks.size > 0;
  }

  /**
   * Remove all listeners for a specific event, or all events if no event specified
   */
  removeAllListeners(event?: keyof EventMap): void {
    if (event !== undefined) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
