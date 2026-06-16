/**
 * 标点日期排序：支持 YYYY、YYYY-MM、YYYY-MM-DD。
 * 模糊日期按当年/当月 1 日参与排序，展示仍保留用户输入格式。
 */

export function getSortableDateKey(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const s = dateStr.trim();
  if (!s) return '';

  const full = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (full) {
    const y = full[1];
    const m = String(parseInt(full[2], 10)).padStart(2, '0');
    const d = String(parseInt(full[3], 10)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const monthOnly = s.match(/^(\d{4})-(\d{1,2})$/);
  if (monthOnly) {
    const y = monthOnly[1];
    const m = String(parseInt(monthOnly[2], 10)).padStart(2, '0');
    return `${y}-${m}-01`;
  }

  if (/^\d{4}$/.test(s)) {
    return `${s}-01-01`;
  }

  return s;
}

/** @returns {number} 负数表示 a 在前 */
export function compareMarkerDates(dateA, dateB) {
  const keyA = getSortableDateKey(dateA);
  const keyB = getSortableDateKey(dateB);
  if (!keyA && !keyB) return 0;
  if (!keyA) return 1;
  if (!keyB) return -1;
  return keyA.localeCompare(keyB);
}

export function sortMarkersByDate(markers, order = 'asc') {
  const dir = order === 'desc' ? -1 : 1;
  return [...markers].sort((a, b) => dir * compareMarkerDates(a.date, b.date));
}
