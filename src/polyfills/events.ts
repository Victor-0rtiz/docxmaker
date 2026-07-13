/**
 * Minimal EventEmitter polyfill for browser environments.
 *
 * xmlbuilder2 depends on Node's built-in `events` module for its
 * callback-based builder (XMLBuilderCBImpl extends EventEmitter).
 * This polyfill provides just enough surface area to satisfy that
 * dependency at runtime in browsers.
 */
export class EventEmitter {
  private handlers = new Map<string, Array<(...args: unknown[]) => void>>();

  on(event: string, listener: (...args: unknown[]) => void): this {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event)!.push(listener);
    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    const listeners = this.handlers.get(event);
    if (!listeners) return false;
    for (const fn of listeners) fn(...args);
    return true;
  }

  removeListener(event: string, listener: (...args: unknown[]) => void): this {
    const listeners = this.handlers.get(event);
    if (listeners) {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    }
    return this;
  }

  once(event: string, listener: (...args: unknown[]) => void): this {
    const wrapper = (...args: unknown[]) => {
      listener(...args);
      this.removeListener(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  removeAllListeners(event?: string): this {
    if (event) this.handlers.delete(event);
    else this.handlers.clear();
    return this;
  }
}

export default EventEmitter;
