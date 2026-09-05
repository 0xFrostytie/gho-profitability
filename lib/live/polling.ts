/** Small testable lifecycle: no overlapping requests; pause while hidden; refresh on return. */
export function startPolling(
  load: () => Promise<void>,
  options: {
    intervalMs: number;
    isVisible: () => boolean;
    subscribeVisibility: (listener: () => void) => () => void;
    schedule?: typeof setInterval;
    cancel?: typeof clearInterval;
  },
) {
  let active = true;
  let pending: Promise<void> | null = null;
  const run = () => {
    if (!active || !options.isVisible()) return Promise.resolve();
    if (pending) return pending;
    pending = load()
      .catch(() => undefined)
      .finally(() => {
        pending = null;
      });
    return pending;
  };
  const timer = (options.schedule ?? setInterval)(() => {
    void run();
  }, options.intervalMs);
  const unsubscribe = options.subscribeVisibility(() => {
    void run();
  });
  void run();
  return {
    refresh: run,
    stop() {
      active = false;
      (options.cancel ?? clearInterval)(timer);
      unsubscribe();
    },
  };
}
