/** 同步读取 localStorage JSON 缓存，失败返回 null */
export function readJsonCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** 在浏览器空闲或短延迟后执行，优先让首屏渲染完成 */
export function runWhenIdle(fn, delayMs = 600) {
  if (typeof window === 'undefined') {
    fn();
    return () => {};
  }
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(() => fn(), { timeout: delayMs + 400 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, delayMs);
  return () => window.clearTimeout(id);
}
