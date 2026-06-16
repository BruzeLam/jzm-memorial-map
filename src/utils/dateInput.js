/** 表单日期输入解析：保留 YYYY / YYYY-MM 模糊格式，完整日归一化为 YYYY-MM-DD */

export function parseFlexibleDateInput(dateStr) {
  if (!dateStr) return null;
  const s = dateStr.trim();
  if (!s) return null;

  if (/^\d{4}$/.test(s)) {
    return s;
  }

  if (/^\d{4}-\d{1,2}$/.test(s)) {
    const [y, m] = s.split('-');
    return `${y}-${String(parseInt(m, 10)).padStart(2, '0')}`;
  }

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return `${y}-${String(parseInt(m, 10)).padStart(2, '0')}-${String(parseInt(d, 10)).padStart(2, '0')}`;
  }

  if (/^\d{8}$/.test(s)) {
    const year = s.slice(0, 4);
    const month = s.slice(4, 6);
    const day = s.slice(6, 8);
    return `${year}-${month}-${day}`;
  }

  if (/^\d{7}$/.test(s)) {
    const year = s.slice(0, 4);
    const month = String(parseInt(s.slice(4, 5), 10)).padStart(2, '0');
    const day = s.slice(5, 7);
    return `${year}-${month}-${day}`;
  }

  if (/^\d{6}$/.test(s)) {
    const year = s.slice(0, 4);
    const month = s.slice(4, 6);
    return `${year}-${month}`;
  }

  return null;
}
