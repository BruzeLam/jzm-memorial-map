/** 汇总类问题检测与地图统计 */

export function isAggregateQuestion(message) {
  return /多少|几个|若干|总共|一共|共|数量|统计|列举|列出|盘点|概览|汇总|分布/.test(message) ||
    /哪些国|哪些国家|哪些地区|哪些城市|哪些省份|到访过|访问过|去过哪/.test(message);
}

function countByType(markers) {
  const counts = { spot: 0, event: 0, inscription: 0 };
  for (const m of markers) {
    if (counts[m.type] != null) counts[m.type] += 1;
  }
  return counts;
}

function countryStats(markers) {
  const all = new Map();
  const foreign = new Map();
  for (const m of markers) {
    const c = (m.country || '').trim();
    if (!c) continue;
    all.set(c, (all.get(c) || 0) + 1);
    if (c !== '中国') foreign.set(c, (foreign.get(c) || 0) + 1);
  }
  const sortEntries = (map) =>
    [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));

  return {
    distinctCountries: all.size,
    distinctForeignCountries: foreign.size,
    countries: sortEntries(all),
    foreignCountries: sortEntries(foreign),
  };
}

/** 为汇总问题生成地图统计摘要 */
export function computeMapStatistics(markers, question = '') {
  const byType = countByType(markers);
  const spots = markers.filter((m) => m.type === 'spot');
  const spotCountries = countryStats(spots);
  const allCountries = countryStats(markers);

  const stats = {
    totalMarkers: markers.length,
    byType,
    footprint: {
      markerCount: spots.length,
      ...spotCountries,
    },
    allMarkersByCountry: {
      distinctCountries: allCountries.distinctCountries,
      distinctForeignCountries: allCountries.distinctForeignCountries,
      foreignCountries: allCountries.foreignCountries,
    },
  };

  if (/国家|国别|海外|外国|境外|出访/.test(question)) {
    stats.focus = 'country';
    stats.answerHint =
      '「去过多少国家」通常指足迹中标点涉及的不同国家；出访/国事访问可重点看 footprint.foreignCountries';
  }
  if (/城市|地方|地区|省份/.test(question)) {
    const regions = new Set();
    for (const m of spots) {
      const parts = [m.country, m.province, m.city].filter(Boolean);
      if (parts.length) regions.add(parts.join(' / '));
    }
    stats.footprint.distinctRegions = regions.size;
    stats.footprint.sampleRegions = [...regions].slice(0, 20);
    stats.focus = 'region';
  }

  return stats;
}

/** 汇总问题：每个国家/地区取一条代表标点，供地图跳转 */
export function sampleMarkersForAggregateQuestion(markers, question) {
  if (!isAggregateQuestion(question)) return [];

  const pool = /国家|国别|海外|外国|境外|出访/.test(question)
    ? markers.filter((m) => m.country && m.country !== '中国')
    : markers.filter((m) => m.type === 'spot');

  const seen = new Map();
  for (const m of pool) {
    const key = m.country || m.province || m.name;
    if (!key || seen.has(key)) continue;
    seen.set(key, m);
  }
  return [...seen.values()].slice(0, 15);
}
