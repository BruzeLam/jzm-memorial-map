/** 外事行程标点构造（系列标签 + 同行程关联） */

export const ITINERARY_SOURCE = '维基百科：江泽民外事访问列表';

export function visit(id, fields) {
  return {
    id,
    type: 'spot',
    color: '#1E88E5',
    icon: '📍',
    images: [],
    sources: [{ title: ITINERARY_SOURCE, note: fields.sourceNote || '' }],
    province: '',
    ...fields,
  };
}

export function city(id, tag, tripSummary, shared, cityFields) {
  return visit(id, {
    tags: [tag],
    tripSummary: cityFields.tripSummary ?? (shared.first ? tripSummary : undefined),
    ...shared,
    ...cityFields,
  });
}
