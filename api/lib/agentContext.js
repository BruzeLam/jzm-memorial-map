/** 导览 Agent 站点语境（服务端，与 branding 保持一致） */

export function getAgentSubject() {
  const portfolio = process.env.REACT_APP_PORTFOLIO_MODE === 'true';
  if (portfolio) {
    return {
      name: '该历史人物',
      siteLabel: '伟人足迹互动地图',
      pronouns: ['他', '她', '这位', '其人'],
    };
  }
  return {
    name: '江泽民同志',
    siteLabel: '江泽民同志生平纪念地图',
    pronouns: ['他', '她', '这位', '其人', '江泽民', '泽民'],
  };
}

/** 将问句中的代词替换为主题人物名，便于检索 */
export function normalizeQuestionPronouns(message, subject = getAgentSubject()) {
  let q = message;
  for (const p of subject.pronouns) {
    if (p.length <= 1) continue;
    q = q.replace(new RegExp(p, 'g'), subject.name);
  }
  q = q.replace(/(?<![\u4e00-\u9fff])他(?![们])/g, subject.name);
  q = q.replace(/(?<![\u4e00-\u9fff])她(?![们])/g, subject.name);
  return q;
}
