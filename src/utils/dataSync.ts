export const DATA_CATEGORIES = ['berita', 'tim', 'galeri', 'aspirasi', 'users', 'logs'] as const;
export type DataCategory = typeof DATA_CATEGORIES[number];

export function createReadQueue<K>() {
  const running = new Map<K, Promise<void>>();
  const dirty = new Set<K>();
  return (key: K, read: () => Promise<void>, invalidate = false): Promise<void> => {
    const existing = running.get(key);
    if (existing) {
      if (invalidate) dirty.add(key);
      return existing;
    }
    const operation = Promise.resolve().then(async () => {
      do {
        dirty.delete(key);
        await read();
      } while (dirty.has(key));
    }).finally(() => { running.delete(key); dirty.delete(key); });
    running.set(key, operation);
    return operation;
  };
}

export function startDataSync(options: {
  refresh: (category: DataCategory | 'all', invalidate?: boolean) => Promise<void>;
  health: () => void;
  connection: (connected: boolean) => void;
}) {
  let disposed = false;
  let connected = false;
  let opened = false;
  let hiddenAt = document.hidden ? Date.now() : 0;
  const pending = new Set<DataCategory | 'all'>();
  let batch: ReturnType<typeof setTimeout> | undefined;
  const flush = () => {
    batch = undefined;
    if (disposed || document.hidden) return;
    const categories = pending.has('all') ? ['all' as const] : [...pending];
    pending.clear();
    for (const category of categories) void options.refresh(category, true);
  };
  const schedule = (category: DataCategory | 'all') => {
    pending.add(category);
    if (!document.hidden && !batch) batch = setTimeout(flush, 150);
  };
  void options.refresh('all');
  options.health();
  let source: EventSource | undefined;
  try {
    source = new EventSource('/api/events');
    source.onopen = () => {
      if (disposed) return;
      connected = true;
      options.connection(true);
      if (opened) schedule('all');
      opened = true;
    };
    source.onerror = () => {
      if (disposed) return;
      connected = false;
      options.connection(false);
      // EventSource owns reconnect/backoff; do not create overlapping connections.
    };
    source.addEventListener('update', event => {
      if (disposed) return;
      try {
        const { type } = JSON.parse((event as MessageEvent).data);
        if (type === 'all' || DATA_CATEGORIES.includes(type)) schedule(type);
      } catch { /* Ignore malformed realtime events. */ }
    });
  } catch { options.connection(false); }
  const fallback = setInterval(() => {
    if (!document.hidden && !connected) { options.health(); schedule('all'); }
  }, 60000);
  const onVisibility = () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt >= 30000) schedule('all');
    hiddenAt = 0;
    if (pending.size) schedule(pending.has('all') ? 'all' : [...pending][0]);
  };
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    if (disposed) return;
    disposed = true;
    source?.close();
    clearInterval(fallback);
    clearTimeout(batch);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
