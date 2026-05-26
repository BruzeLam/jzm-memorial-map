/**
 * 中国省级行政区标准名称（国务院行政区划，共 34 个省级单位）
 * 参考：GB/T 2260 省级条目 · 民政部行政区划
 *
 * 第三级在应用中约定为：
 * - 直辖市 → 区
 * - 省 → 地级市
 * - 自治区 → 地级行政区（市/州/盟）
 * - 特别行政区 → 区（可选，默认留空）
 */

export const CHINA_ADMIN = {
  municipalities: ['北京市', '上海市', '天津市', '重庆市'],
  provinces: [
    '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
    '江苏省', '浙江省', '安徽省', '福建省', '江西省',
    '山东省', '河南省', '湖北省', '湖南省', '广东省',
    '海南省', '四川省', '贵州省', '云南省', '陕西省',
    '甘肃省', '青海省', '台湾省',
  ],
  autonomousRegions: [
    '内蒙古自治区',
    '广西壮族自治区',
    '西藏自治区',
    '宁夏回族自治区',
    '新疆维吾尔自治区',
  ],
  specialAdministrativeRegions: ['香港特别行政区', '澳门特别行政区'],
};

export const ALL_PROVINCE_LEVEL = [
  ...CHINA_ADMIN.municipalities,
  ...CHINA_ADMIN.provinces,
  ...CHINA_ADMIN.autonomousRegions,
  ...CHINA_ADMIN.specialAdministrativeRegions,
];

export const DIRECT_MUNICIPALITIES = new Set(CHINA_ADMIN.municipalities);
export const SPECIAL_ADMINISTRATIVE_REGIONS = new Set(CHINA_ADMIN.specialAdministrativeRegions);

/** 别名 → 标准省级全称 */
const PROVINCE_ALIASES = {
  北京: '北京市',
  北京市: '北京市',
  上海: '上海市',
  上海市: '上海市',
  天津: '天津市',
  天津市: '天津市',
  重庆: '重庆市',
  重庆市: '重庆市',
  河北: '河北省',
  山西: '山西省',
  辽宁: '辽宁省',
  吉林: '吉林省',
  黑龙江: '黑龙江省',
  江苏: '江苏省',
  浙江: '浙江省',
  安徽: '安徽省',
  福建: '福建省',
  江西: '江西省',
  山东: '山东省',
  河南: '河南省',
  湖北: '湖北省',
  湖南: '湖南省',
  广东: '广东省',
  海南: '海南省',
  四川: '四川省',
  贵州: '贵州省',
  云南: '云南省',
  陕西: '陕西省',
  甘肃: '甘肃省',
  青海: '青海省',
  台湾: '台湾省',
  台湾省: '台湾省',
  内蒙古: '内蒙古自治区',
  广西: '广西壮族自治区',
  西藏: '西藏自治区',
  宁夏: '宁夏回族自治区',
  新疆: '新疆维吾尔自治区',
  香港: '香港特别行政区',
  香港特别行政区: '香港特别行政区',
  香港特区: '香港特别行政区',
  澳门: '澳门特别行政区',
  澳门特别行政区: '澳门特别行政区',
  澳门特区: '澳门特别行政区',
  Macau: '澳门特别行政区',
  'Macao': '澳门特别行政区',
  'Macau SAR': '澳门特别行政区',
  'Hong Kong': '香港特别行政区',
  HK: '香港特别行政区',
  MO: '澳门特别行政区',
};

/** 繁体 / Nominatim 异写 → 标准省级全称 */
const PROVINCE_ALIASES_TW = {
  澳門: '澳门特别行政区',
  澳門特別行政區: '澳门特别行政区',
  澳門特别行政区: '澳门特别行政区',
  香港: '香港特别行政区',
  香港特別行政區: '香港特别行政区',
  臺灣: '台湾省',
  台灣: '台湾省',
  臺灣省: '台湾省',
  台灣省: '台湾省',
  廣東: '广东省',
  廣東省: '广东省',
  江蘇: '江苏省',
  江蘇省: '江苏省',
  四川: '四川省',
  四川省: '四川省',
};

export function isSpecialAdministrativeRegion(province) {
  return SPECIAL_ADMINISTRATIVE_REGIONS.has(province);
}

export function isDirectMunicipalityName(province) {
  return DIRECT_MUNICIPALITIES.has(province);
}

/**
 * 将任意省级输入解析为标准全称（不匹配则返回简体清洗后的原值）
 */
export function resolveChinaProvinceLevel(raw) {
  if (!raw) return '';
  const text = String(raw).trim();
  if (!text) return '';

  if (PROVINCE_ALIASES[text]) return PROVINCE_ALIASES[text];
  if (PROVINCE_ALIASES_TW[text]) return PROVINCE_ALIASES_TW[text];

  const simplified = text
    .replace(/國/g, '国')
    .replace(/華/g, '华')
    .replace(/區/g, '区')
    .replace(/縣/g, '县')
    .replace(/門/g, '门')
    .replace(/灣/g, '湾')
    .replace(/東/g, '东')
    .replace(/廣/g, '广')
    .replace(/蘇/g, '苏')
    .replace(/爾/g, '尔')
    .replace(/羅/g, '罗')
    .replace(/島/g, '岛')
    .replace(/縣/g, '县')
    .replace(/陽/g, '阳')
    .replace(/漢/g, '汉')
    .replace(/州/g, '州');

  if (PROVINCE_ALIASES[simplified]) return PROVINCE_ALIASES[simplified];
  if (PROVINCE_ALIASES_TW[simplified]) return PROVINCE_ALIASES_TW[simplified];

  if (ALL_PROVINCE_LEVEL.includes(simplified)) return simplified;

  if (simplified.endsWith('省') || simplified.endsWith('市') || simplified.endsWith('自治区') || simplified.endsWith('特别行政区')) {
    return simplified;
  }

  return simplified;
}

/** 港澳城市字段若重复省级名称则清空；若为区级则保留 */
export function normalizeSarCity(province, city) {
  if (!isSpecialAdministrativeRegion(province)) return city;

  const c = (city || '').trim();
  if (!c) return '';

  const dupNames = new Set([
    '澳门',
    '澳門',
    '澳门市',
    '澳門市',
    '澳门特别行政区',
    '澳門特別行政區',
    '香港',
    '香港市',
    '香港特别行政区',
    '香港特別行政區',
  ]);

  if (dupNames.has(c)) return '';

  if (c.endsWith('市') && (c.startsWith('澳门') || c.startsWith('澳門') || c.startsWith('香港'))) {
    return '';
  }

  return c.endsWith('区') || c.endsWith('區') ? c.replace(/區/g, '区') : c;
}
