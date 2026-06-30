/**
 * 常量模板 — 仅保留类型定义 + 2 条示例标记
 * 复制到 src/utils/constants.js 并扩充 SAMPLE_MARKERS
 */

export const MARKER_TYPES = {
  spot: {
    key: 'spot',
    label: '足迹',
    labelEn: 'Footprint',
    color: '#1E88E5',
    icon: '📍',
    description: '出生地、工作地、访问地点',
  },
  event: {
    key: 'event',
    label: '历史事件',
    labelEn: 'Event',
    color: '#D32F2F',
    icon: '⭐',
    description: '重要历史时刻',
  },
  inscription: {
    key: 'inscription',
    label: '题字',
    labelEn: 'Inscription',
    color: '#F57F17',
    icon: '✒️',
    description: '书法题字地点',
  },
};

export const DATA_VERSION = 1; // 改内置数据时递增

export const DEFAULT_CENTER = [35.8617, 104.1954];
export const DEFAULT_ZOOM = 4;

export const SAMPLE_MARKERS = [
  {
    id: 'spot_demo_001',
    type: 'spot',
    name: '示例城市',
    latitude: 39.9042,
    longitude: 116.4074,
    country: '中国',
    province: '北京市',
    city: '',
    date: '1900-01-01',
    title: '出生地（示例）',
    description: '替换为你的真实描述，附可溯源来源。',
    color: '#1E88E5',
    icon: '📍',
    images: [],
    sources: [{ title: '出处说明', note: '' }],
  },
  {
    id: 'event_demo_001',
    type: 'event',
    name: '示例事件地点',
    latitude: 31.2304,
    longitude: 121.4737,
    country: '中国',
    province: '上海市',
    city: '',
    date: '2000-01',
    title: '重要事件（示例）',
    description: '历史事件描述，日期无依据则留空。',
    color: '#D32F2F',
    icon: '⭐',
    images: [],
    sources: [],
  },
];
