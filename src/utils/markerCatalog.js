/** 云端 markers 与内置 SAMPLE 合并（云端同 id 优先；已删 id 排除） */

export function mergeMarkerCatalog(remoteMarkers, builtInMarkers, removedIds = []) {
  const removed = new Set(removedIds);
  const remote = (remoteMarkers || []).filter((m) => m?.id && !removed.has(m.id));
  const ids = new Set(remote.map((m) => m.id));
  const missing = (builtInMarkers || []).filter((m) => m?.id && !ids.has(m.id) && !removed.has(m.id));
  if (!remote.length) {
    return missing.length ? missing : (builtInMarkers || []).filter((m) => !removed.has(m.id));
  }
  return [...remote, ...missing];
}
