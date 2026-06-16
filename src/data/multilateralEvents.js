/**
 * 在华主办的多边外交会议（历史事件）
 * 资料：外交部、上合组织官网、中非合作论坛官网、新华社等公开报道
 */

function multilateralEvent(id, fields) {
  return {
    id,
    type: 'event',
    color: '#D32F2F',
    icon: '⭐',
    images: [],
    sources: fields.sources || [{ title: '公开报道', note: '' }],
    province: '',
    ...fields,
  };
}

export const MULTILATERAL_EVENT_MARKERS = [
  multilateralEvent('event_mlr_1996_shanghai_five', {
    name: '上海',
    latitude: 31.2242,
    longitude: 121.4453,
    country: '中国',
    province: '上海市',
    city: '',
    date: '1996-04-26',
    title: '「上海五国」首次元首会晤',
    description:
      '4月26日，江泽民与叶利钦及哈、吉、塔三国总统在上海签署《关于在边境地区加强军事领域信任的协定》，「上海五国」会晤机制正式建立，为日后上海合作组织奠定基础。',
    sources: [
      { title: '中华人民共和国外交部', note: '新中国外交历史回顾' },
      { title: '上海合作组织官网', note: '' },
    ],
  }),

  multilateralEvent('event_mlr_2000_focac', {
    name: '北京',
    latitude: 39.9042,
    longitude: 116.3913,
    country: '中国',
    province: '北京市',
    city: '',
    date: '2000-10-10',
    endDate: '2000-10-12',
    title: '中非合作论坛成立',
    description:
      '10月10日至12日，中非合作论坛首届部长级会议在北京举行。江泽民出席开幕式并发表《中非携手合作，共迎新的世纪》讲话；会议通过《北京宣言》和《中非经济和社会发展合作纲领》，论坛正式成立。',
    sources: [
      { title: '中非合作论坛官网', note: '论坛机制' },
      { title: '人民网', note: '2000年10月' },
    ],
  }),

  multilateralEvent('event_mlr_2001_sco', {
    name: '上海',
    latitude: 31.2242,
    longitude: 121.4453,
    country: '中国',
    province: '上海市',
    city: '',
    date: '2001-06-15',
    title: '上海合作组织成立',
    description:
      '6月15日，中、俄、哈、吉、塔、乌六国元首在上海签署《上海合作组织成立宣言》和《打击恐怖主义、分裂主义和极端主义上海公约》，宣告上海合作组织正式成立；江泽民发表《深化团结协作 共创美好世纪》讲话。',
    sources: [
      { title: '上海合作组织官网', note: '' },
      { title: '中国新闻网', note: '2001年6月15日' },
    ],
  }),

  multilateralEvent('event_mlr_2001_apec', {
    name: '上海',
    latitude: 31.2197,
    longitude: 121.5447,
    country: '中国',
    province: '上海市',
    city: '',
    date: '2001-10-20',
    endDate: '2001-10-21',
    title: 'APEC上海峰会',
    description:
      '10月20日至21日，亚太经合组织第九次领导人非正式会议在上海举行，江泽民主持并宣读《领导人宣言》；会议通过《上海共识》，并发表反恐声明，系中国首次主办APEC领导人会议。',
    sources: [
      { title: '中华人民共和国外交部', note: 'APEC第九次领导人非正式会议' },
      { title: '维基百科', note: 'APEC 2001' },
    ],
  }),
];
