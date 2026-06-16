import { compareMarkerDates } from './markerDates';

/** 解析 YYYY-MM-DD、YYYY-MM 或 YYYY 为月、日（模糊日期按当月/当年 1 日） */
export function parseMarkerMonthDay(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const full = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (full) {
    return { month: parseInt(full[2], 10), day: parseInt(full[3], 10) };
  }
  const monthOnly = dateStr.match(/^(\d{4})-(\d{1,2})$/);
  if (monthOnly) {
    return { month: parseInt(monthOnly[2], 10), day: 1 };
  }
  const yearOnly = dateStr.match(/^(\d{4})$/);
  if (yearOnly) {
    return { month: 1, day: 1 };
  }
  return null;
}

function monthDayKey(month, day) {
  return month * 100 + day;
}

/** 判断 ref 日期的月-日是否落在 marker 的 date～endDate 区间内（按年内月日比较） */
export function markerMatchesOnThisDay(marker, refDate = new Date()) {
  const start = parseMarkerMonthDay(marker.date);
  if (!start) return false;

  const today = {
    month: refDate.getMonth() + 1,
    day: refDate.getDate(),
  };
  const t = monthDayKey(today.month, today.day);
  const s = monthDayKey(start.month, start.day);

  const end = parseMarkerMonthDay(marker.endDate);
  if (!end) {
    return t === s;
  }

  const e = monthDayKey(end.month, end.day);
  if (s === e) return t === s;
  if (s < e) return t >= s && t <= e;
  return t >= s || t <= e;
}

/** 侧边栏按钮展示用：5月30日 / May 30 */
export function formatOnThisDayLabel(refDate = new Date(), locale = 'zh') {
  const month = refDate.getMonth() + 1;
  const day = refDate.getDate();
  if (locale === 'en' || (typeof locale === 'string' && locale.startsWith('en'))) {
    const names = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${names[month - 1]} ${day}`;
  }
  return `${month}月${day}日`;
}

/** 筛选并排序「历史上的今天」标点（按 date 升序） */
export function getOnThisDayMarkers(markers, refDate = new Date()) {
  if (!Array.isArray(markers)) return [];
  return markers
    .filter((m) => markerMatchesOnThisDay(m, refDate))
    .sort((a, b) => compareMarkerDates(a.date, b.date));
}
