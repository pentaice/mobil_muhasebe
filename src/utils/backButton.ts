import { useEffect } from 'react';

export type BackAction = () => boolean | void;

interface RegisteredHandler {
  id: string;
  priority: number;
  timestamp: number;
  handler: BackAction;
}

const handlers: RegisteredHandler[] = [];

/**
 * Register a back button handler.
 * Handlers are executed in order of highest priority first, then latest registered (LIFO).
 * If a handler returns `false`, execution continues to the next handler.
 * If a handler returns `true` or `undefined` (void), execution stops (event consumed).
 */
export function registerBackHandler(handler: BackAction, priority: number = 10): () => void {
  const item: RegisteredHandler = {
    id: `bh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    priority,
    timestamp: Date.now(),
    handler,
  };

  handlers.push(item);
  sortHandlers();

  return () => {
    const index = handlers.findIndex((h) => h.id === item.id);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  };
}

function sortHandlers() {
  handlers.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return b.timestamp - a.timestamp;
  });
}

/**
 * Executes registered back handlers.
 * Returns true if an active handler consumed the event, false otherwise.
 */
export function executeBackHandler(): boolean {
  for (const item of [...handlers]) {
    try {
      const result = item.handler();
      if (result !== false) {
        return true;
      }
    } catch (e) {
      console.error('Error executing back handler:', e);
    }
  }
  return false;
}

/**
 * React hook to register a back button handler while a component or modal is active.
 *
 * @param handler Callback to execute on back press (e.g. closing a modal).
 * @param active Whether the handler is currently active (e.g. modal is open).
 * @param priority Priority level (default 10). Higher values take precedence.
 */
export function useBackHandler(handler: BackAction, active: boolean = true, priority: number = 10) {
  useEffect(() => {
    if (!active) return;
    return registerBackHandler(handler, priority);
  }, [active, handler, priority]);
}
