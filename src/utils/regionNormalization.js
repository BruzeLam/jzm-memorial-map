// 中国主要省份/直辖市规范化字典
const CHINA_REGIONS = {
  // 直辖市
  '北京': { fullName: '北京市', aliases: ['beijing', '北京市', '北京'] },
  '上海': { fullName: '上海市', aliases: ['shanghai', '上海市', '上海'] },
  '天津': { fullName: '天津市', aliases: ['tianjin', '天津市', '天津'] },
  '重庆': { fullName: '重庆市', aliases: ['chongqing', '重庆市', '重庆'] },

  // 其他省份
  '江苏': { fullName: '江苏省', aliases: ['jiangsu', '江苏省', '江苏'] },
  '浙江': { fullName: '浙江省', aliases: ['zhejiang', '浙江省', '浙江'] },
  '广东': { fullName: '广东省', aliases: ['guangdong', '广东省', '广东'] },
  '山东': { fullName: '山东省', aliases: ['shandong', '山东省', '山东'] },
  '四川': { fullName: '四川省', aliases: ['sichuan', '四川省', '四川'] },
  '陕西': { fullName: '陕西省', aliases: ['shaanxi', '陕西省', '陕西'] },
  '湖北': { fullName: '湖北省', aliases: ['hubei', '湖北省', '湖北'] },
  '湖南': { fullName: '湖南省', aliases: ['hunan', '湖南省', '湖南'] },
  '河南': { fullName: '河南省', aliases: ['henan', '河南省', '河南'] },
  '河北': { fullName: '河北省', aliases: ['hebei', '河北省', '河北'] },
  '山西': { fullName: '山西省', aliases: ['shanxi', '山西省', '山西'] },
  '安徽': { fullName: '安徽省', aliases: ['anhui', '安徽省', '安徽'] },
  '福建': { fullName: '福建省', aliases: ['fujian', '福建省', '福建'] },
  '江西': { fullName: '江西省', aliases: ['jiangxi', '江西省', '江西'] },
  '海南': { fullName: '海南省', aliases: ['hainan', '海南省', '海南'] },
  '云南': { fullName: '云南省', aliases: ['yunnan', '云南省', '云南'] },
  '贵州': { fullName: '贵州省', aliases: ['guizhou', '贵州省', '贵州'] },
  '西藏': { fullName: '西藏', aliases: ['tibet', '西藏'] },
  '新疆': { fullName: '新疆', aliases: ['xinjiang', '新疆'] },
  '青海': { fullName: '青海省', aliases: ['qinghai', '青海省', '青海'] },
  '甘肃': { fullName: '甘肃省', aliases: ['gansu', '甘肃省', '甘肃'] },
  '宁夏': { fullName: '宁夏', aliases: ['ningxia', '宁夏'] },
  '内蒙古': { fullName: '内蒙古', aliases: ['neimenggu', '内蒙古'] },
  '吉林': { fullName: '吉林省', aliases: ['jilin', '吉林省', '吉林'] },
  '辽宁': { fullName: '辽宁省', aliases: ['liaoning', '辽宁省', '辽宁'] },
  '黑龙江': { fullName: '黑龙江省', aliases: ['heilongjiang', '黑龙江省', '黑龙江'] },

  // 特别行政区
  '香港': { fullName: '香港', aliases: ['hong kong', '香港', 'hk'] },
  '澳门': { fullName: '澳门', aliases: ['macau', '澳门', 'mo'] },
  '台湾': { fullName: '台湾', aliases: ['taiwan', '台湾'] },
};

// 国际地区
const INTERNATIONAL_REGIONS = {
  '美国': { fullName: '美国', aliases: ['usa', 'united states', '美国'] },
  '俄罗斯': { fullName: '俄罗斯', aliases: ['russia', '俄罗斯'] },
  '瑞士': { fullName: '瑞士', aliases: ['switzerland', '瑞士'] },
  '法国': { fullName: '法国', aliases: ['france', '法国'] },
};

// 规范化地区输入（支持中文、拼音、英文）
export function normalizeRegion(input) {
  if (!input) return null;

  const normalized = input.trim().toLowerCase();
  const allRegions = { ...CHINA_REGIONS, ...INTERNATIONAL_REGIONS };

  // 精确匹配
  for (const [key, value] of Object.entries(allRegions)) {
    if (key.toLowerCase() === normalized || value.fullName.toLowerCase() === normalized) {
      return value.fullName;
    }
  }

  // 别名匹配
  for (const value of Object.values(allRegions)) {
    if (value.aliases.some(alias => alias === normalized)) {
      return value.fullName;
    }
  }

  // 模糊匹配（包含关系）
  for (const [key, value] of Object.entries(allRegions)) {
    if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return value.fullName;
    }
  }

  return null;
}

// 获取建议列表
export function getRegionSuggestions(input) {
  if (!input || input.length < 1) return [];

  const normalized = input.toLowerCase();
  const allRegions = { ...CHINA_REGIONS, ...INTERNATIONAL_REGIONS };
  const suggestions = [];

  for (const value of Object.values(allRegions)) {
    if (
      value.fullName.toLowerCase().includes(normalized) ||
      value.aliases.some(alias => alias.includes(normalized))
    ) {
      suggestions.push(value.fullName);
    }
  }

  return [...new Set(suggestions)].slice(0, 5); // 去重并限制数量
}
