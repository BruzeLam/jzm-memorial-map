/**
 * 统一三级行政区划：国家 → 省/直辖市 → 地级市 / 区
 * - 直辖市：中国 / 北京市 / 东城区
 * - 省辖：中国 / 广东省 / 广州市
 * - 海外：美国 / （州，可选） / 华盛顿
 */

export const DIRECT_MUNICIPALITIES = new Set([
  '北京市',
  '上海市',
  '天津市',
  '重庆市',
]);

const PROVINCE_SUFFIXES = ['省', '自治区', '特别行政区'];
const MUNICIPALITY_SUFFIXES = ['市', '州', '盟', '地区'];

/** Nominatim 常返回「简体;繁体」或多值，取单一简体中文名 */
const ZH_TW_TO_CN = {
  美國: '美国',
  臺灣: '台湾',
  台灣: '台湾',
  華盛頓: '华盛顿',
  哥倫比亞特區: '哥伦比亚特区',
  哥倫比亞特区: '哥伦比亚特区',
  莫斯科: '莫斯科',
  日內瓦: '日内瓦',
  日內瓦州: '日内瓦',
  巴黎: '巴黎',
};

const COUNTRY_ALIASES = {
  'United States': '美国',
  'United States of America': '美国',
  USA: '美国',
  Russia: '俄罗斯',
  'Russian Federation': '俄罗斯',
  Switzerland: '瑞士',
  France: '法国',
  China: '中国',
};

/**
 * 从 Nominatim 字段中提取唯一中文地名（优先简体、优先 zh-CN 段）
 */
export function pickChinesePlaceName(raw) {
  if (!raw) return '';
  const text = String(raw).trim();
  if (!text) return '';

  if (COUNTRY_ALIASES[text]) return COUNTRY_ALIASES[text];

  const parts = text
    .split(/[;/,|]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const candidates = parts.length > 0 ? parts : [text];

  const score = (s) => {
    if (ZH_TW_TO_CN[s]) return 100;
    let n = 0;
    if (/[\u4e00-\u9fff]/.test(s)) n += 20;
    if (s.includes('国') && !s.includes('國')) n += 15;
    if (s.includes('國')) n -= 10;
    if (/[區縣華爾盛頓羅蘇格蘭]/.test(s)) n -= 5;
    if (s.length <= 12) n += 3;
    if (/[a-zA-Z]/.test(s)) n -= 8;
    return n;
  };

  const best = [...candidates].sort((a, b) => score(b) - score(a))[0];
  if (ZH_TW_TO_CN[best]) return ZH_TW_TO_CN[best];

  return best
    .replace(/國/g, '国')
    .replace(/華/g, '华')
    .replace(/爾/g, '尔')
    .replace(/羅/g, '罗')
    .replace(/蘇/g, '苏')
    .replace(/區/g, '区')
    .replace(/縣/g, '县')
    .replace(/倫/g, '伦')
    .replace(/亞/g, '亚')
    .replace(/島/g, '岛')
    .replace(/灣/g, '湾');
}

/** 常见「区/县」→ 地级市」纠错（逆地理或手填误把区级写入 city） */
const DISTRICT_TO_PREFECTURE_CITY = {
  广陵区: '扬州市',
  邗江区: '扬州市',
  江都区: '扬州市',
  浦东新区: '上海市',
  黄浦区: '上海市',
  静安区: '上海市',
  徐汇区: '上海市',
  东城区: '北京市',
  西城区: '北京市',
  朝阳区: '北京市',
  海淀区: '北京市',
};

export function isChina(country) {
  const c = (country || '').trim();
  return c === '中国' || c === 'China' || c === 'CN';
}

export function isDirectMunicipality(province, country = '中国') {
  const p = normalizeProvinceName(province, country);
  return DIRECT_MUNICIPALITIES.has(p);
}

export function normalizeProvinceName(province, country = '') {
  if (!province) return '';
  let p = pickChinesePlaceName(province);

  if (p === '北京') p = '北京市';
  if (p === '上海') p = '上海市';
  if (p === '天津') p = '天津市';
  if (p === '重庆') p = '重庆市';
  if (p === '江苏') p = '江苏省';
  if (p === '广东') p = '广东省';
  if (p === '四川') p = '四川省';
  if (p === '澳门') p = '澳门特别行政区';
  if (p === '香港') p = '香港特别行政区';

  const countryNorm = pickChinesePlaceName(country) || country;

  if (
    isChina(countryNorm) &&
    !DIRECT_MUNICIPALITIES.has(p) &&
    !PROVINCE_SUFFIXES.some((s) => p.endsWith(s)) &&
    !p.endsWith('市') &&
    p.length >= 2
  ) {
    if (['内蒙古', '西藏', '新疆', '宁夏', '广西'].some((r) => p.startsWith(r))) {
      if (!p.includes('自治区')) p = p + '自治区';
    } else if (!p.endsWith('省')) {
      p = p + '省';
    }
  }

  return p;
}

function normalizeCityName(city, province, country) {
  if (!city) return '';
  let c = pickChinesePlaceName(city);
  if (!c) return '';

  const countryNorm = pickChinesePlaceName(country) || country;
  const p = normalizeProvinceName(province, countryNorm);

  if (isChina(countryNorm) && isDirectMunicipality(p, countryNorm)) {
    if (c === p || c === p.replace('市', '')) return '';
    if (!c.endsWith('区') && !c.endsWith('县') && !c.endsWith('旗')) {
      if (!c.endsWith('市')) c = c + '区';
    }
    return c;
  }

  if (isChina(countryNorm) && p && !isDirectMunicipality(p, countryNorm)) {
    if (c.endsWith('区') || c.endsWith('县')) {
      const mapped = DISTRICT_TO_PREFECTURE_CITY[c];
      if (mapped) return mapped;
      return c;
    }
    if (
      !MUNICIPALITY_SUFFIXES.some((s) => c.endsWith(s)) &&
      c.length >= 2 &&
      !['香港', '澳门'].includes(c)
    ) {
      c = c + '市';
    }
  }

  return c;
}

/**
 * 规范为三级：{ country, province, city }
 */
export function normalizeAdminRegion({ country = '', province = '', city = '' } = {}) {
  let c = pickChinesePlaceName(country);
  let p = normalizeProvinceName(province, c);
  let cityNorm = pickChinesePlaceName(city);

  if (!c && (p || cityNorm)) c = '中国';
  if (COUNTRY_ALIASES[c]) c = COUNTRY_ALIASES[c];
  if (c === 'China') c = '中国';

  if (isChina(c)) {
    c = '中国';

    if (cityNorm && DIRECT_MUNICIPALITIES.has(cityNorm) && !p) {
      p = cityNorm;
      cityNorm = '';
    }

    if (p && cityNorm === p) cityNorm = '';

    if (p && !isDirectMunicipality(p) && (p.endsWith('区') || p.endsWith('县'))) {
      const mapped = DISTRICT_TO_PREFECTURE_CITY[p];
      if (mapped) {
        cityNorm = mapped;
        p = inferProvinceFromCity(mapped) || p.replace(/(区|县)$/, '省');
      }
    }

    cityNorm = normalizeCityName(cityNorm, p, c);
    p = normalizeProvinceName(p, c);
  } else {
    p = pickChinesePlaceName(province);
    cityNorm = pickChinesePlaceName(city);
    if (p.endsWith('省') && !isChina(c)) {
      p = p.replace(/省$/, '');
    }
  }

  return { country: c, province: p, city: cityNorm };
}

function inferProvinceFromCity(cityName) {
  const map = {
    扬州市: '江苏省',
    广州市: '广东省',
    深圳市: '广东省',
    东莞市: '广东省',
    广元市: '四川省',
  };
  return map[cityName] || '';
}

/** 表单字段标签 */
export function getAdminFieldLabels(country, province) {
  if (isChina(country) && isDirectMunicipality(province, country)) {
    return {
      level2: '直辖市',
      level2Placeholder: '如：北京市',
      level3: '区',
      level3Placeholder: '如：东城区（可选）',
      hint: '直辖市：国家 → 直辖市 → 区',
    };
  }
  if (isChina(country)) {
    return {
      level2: '省/自治区',
      level2Placeholder: '如：江苏省',
      level3: '地级市',
      level3Placeholder: '如：扬州市',
      hint: '省辖：国家 → 省 → 地级市',
    };
  }
  return {
    level2: '州/省',
    level2Placeholder: '可选',
    level3: '城市',
    level3Placeholder: '如：华盛顿',
    hint: '海外：国家 → 州/省 → 城市',
  };
}

/** 展示用：中国 / 江苏省 / 扬州市 */
export function formatRegionPath({ country, province, city } = {}) {
  const { country: c, province: p, city: ct } = normalizeAdminRegion({ country, province, city });
  return [c, p, ct].filter(Boolean).join(' / ');
}

/** 筛选键：与展示路径一致 */
export function getRegionFilterKey(marker) {
  return formatRegionPath(marker);
}

/** 树节点用的分级 key */
export function makeCountryKey(country) {
  return `c:${country}`;
}

export function makeProvinceKey(country, province) {
  return `p:${country}/${province}`;
}

export function makeCityKey(country, province, city) {
  return `x:${country}/${province}/${city}`;
}

export function getMarkerRegionKeys(marker) {
  const r = normalizeAdminRegion(marker);
  const keys = [];
  if (r.country) keys.push(makeCountryKey(r.country));
  if (r.country && r.province) {
    keys.push(makeProvinceKey(r.country, r.province));
    if (r.city) keys.push(makeCityKey(r.country, r.province, r.city));
  } else if (r.country && r.city) {
    keys.push(makeProvinceKey(r.country, r.city));
  }
  return keys;
}

/** 多选地区：选中父级则包含其下所有标记 */
export function markerMatchesRegionFilter(marker, selectedKeys) {
  if (!selectedKeys || selectedKeys.size === 0) return true;

  const r = normalizeAdminRegion(marker);
  for (const sel of selectedKeys) {
    if (sel.startsWith('c:')) {
      const country = sel.slice(2);
      if (r.country === country) return true;
    } else if (sel.startsWith('p:')) {
      const path = sel.slice(2);
      const [country, province] = path.split('/');
      if (r.country !== country) continue;
      if (r.province === province) return true;
      if (!r.province && r.city === province) return true;
    } else if (sel.startsWith('x:')) {
      const path = sel.slice(2);
      const [country, province, city] = path.split('/');
      if (r.country === country && r.province === province && r.city === city) return true;
    }
  }
  return false;
}

function countMarkersForKeys(markers, matchFn) {
  return markers.filter(matchFn).length;
}

/** 从标记列表构建三级树（国家 → 省/直辖市 → 市/区） */
export function buildRegionTree(markers) {
  const tree = new Map();

  markers.forEach((m) => {
    const r = normalizeAdminRegion(m);
    if (!r.country) return;

    if (!tree.has(r.country)) {
      tree.set(r.country, new Map());
    }
    const provinces = tree.get(r.country);

    if (!r.province) {
      if (r.city) {
        if (!provinces.has(r.city)) provinces.set(r.city, new Set());
      }
      return;
    }

    if (!provinces.has(r.province)) {
      provinces.set(r.province, new Set());
    }
    if (r.city) {
      provinces.get(r.province).add(r.city);
    }
  });

  const china = [];
  const overseas = [];

  const sortedCountries = [...tree.keys()].sort((a, b) => {
    if (a === '中国') return -1;
    if (b === '中国') return 1;
    return a.localeCompare(b, 'zh-CN');
  });

  sortedCountries.forEach((country) => {
    const provincesMap = tree.get(country);
    const provinceNodes = [...provincesMap.keys()]
      .sort((a, b) => a.localeCompare(b, 'zh-CN'))
      .map((province) => {
        const cities = [...provincesMap.get(province)]
          .sort((a, b) => a.localeCompare(b, 'zh-CN'))
          .map((city) => {
            const key = makeCityKey(country, province, city);
            const count = countMarkersForKeys(markers, (m) =>
              markerMatchesRegionFilter(m, new Set([key]))
            );
            return { key, label: city, count };
          });

        const pKey = makeProvinceKey(country, province);
        const pCount = countMarkersForKeys(markers, (m) =>
          markerMatchesRegionFilter(m, new Set([pKey]))
        );

        return { key: pKey, label: province, count: pCount, cities };
      });

    const cKey = makeCountryKey(country);
    const cCount = countMarkersForKeys(markers, (m) =>
      markerMatchesRegionFilter(m, new Set([cKey]))
    );

    const node = { key: cKey, label: country, count: cCount, provinces: provinceNodes };

    if (country === '中国') china.push(node);
    else overseas.push(node);
  });

  return { china, overseas };
}

export function migrateMarkerRegion(marker) {
  const { tripId, tripName, parentId, childIds, ...rest } = marker;
  const { country, province, city } = normalizeAdminRegion(rest);
  return { ...rest, country, province, city };
}

export function migrateAllMarkerRegions(markers) {
  return markers.map(migrateMarkerRegion);
}
