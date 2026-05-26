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

export function isDirectMunicipality(province) {
  const p = normalizeProvinceName(province);
  return DIRECT_MUNICIPALITIES.has(p);
}

export function normalizeProvinceName(province) {
  if (!province) return '';
  let p = province.trim();

  if (p === '北京') p = '北京市';
  if (p === '上海') p = '上海市';
  if (p === '天津') p = '天津市';
  if (p === '重庆') p = '重庆市';
  if (p === '江苏') p = '江苏省';
  if (p === '广东') p = '广东省';
  if (p === '四川') p = '四川省';
  if (p === '澳门') p = '澳门特别行政区';
  if (p === '香港') p = '香港特别行政区';

  if (
    !DIRECT_MUNICIPALITIES.has(p) &&
    !PROVINCE_SUFFIXES.some((s) => p.endsWith(s)) &&
    !p.endsWith('市') &&
    p.length >= 2 &&
    isChina('中国')
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
  let c = city.trim();
  if (!c) return '';

  const p = normalizeProvinceName(province);

  if (isChina(country) && isDirectMunicipality(p)) {
    if (c === p || c === p.replace('市', '')) return '';
    if (!c.endsWith('区') && !c.endsWith('县') && !c.endsWith('旗')) {
      if (!c.endsWith('市')) c = c + '区';
    }
    return c;
  }

  if (isChina(country) && p && !isDirectMunicipality(p)) {
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
  let c = (country || '').trim();
  let p = normalizeProvinceName(province);
  let cityNorm = (city || '').trim();

  if (!c && (p || cityNorm)) c = '中国';
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
    p = normalizeProvinceName(p);
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
  if (isChina(country) && isDirectMunicipality(province)) {
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

export function migrateMarkerRegion(marker) {
  const { country, province, city } = normalizeAdminRegion(marker);
  return { ...marker, country, province, city };
}

export function migrateAllMarkerRegions(markers) {
  return markers.map(migrateMarkerRegion);
}
