/** 导览 Agent：服务端加载地点并检索（Supabase 优先，否则内置样本） */

import { createClient } from '@supabase/supabase-js';
import { REMOVED_MARKER_IDS } from '../../src/utils/constants.js';
import {
  buildMarkerIndex,
  buildRetrievalIntent,
  mergeRetrievalIntents,
  retrieveMarkers,
  retrieveMarkersWithIntent,
} from './agentRetrieval.js';
import { planRetrievalWithLLM } from './agentQueryPlanner.js';

const removed = new Set(REMOVED_MARKER_IDS);

export async function loadMarkersForAgent() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const { data, error } = await supabase.from('markers').select('id, payload');
      if (!error && data?.length) {
        return data
          .map((row) => row.payload)
          .filter((m) => m?.id && !removed.has(m.id));
      }
    } catch (_) {
      /* fallback below */
    }
  }

  const { SAMPLE_MARKERS } = await import('../../src/utils/constants.js');
  return SAMPLE_MARKERS.filter((m) => !removed.has(m.id));
}

/** 两阶段检索：语料索引 + 必要时 LLM 规划 */
export async function searchMarkersForAgent(markers, question, { apiKey } = {}) {
  const { hits: firstHits, intent } = retrieveMarkers(markers, question);

  const complexQuestion =
    question.length > 45 ||
    (intent.years.length > 0 && intent.places.length > 0) ||
    (intent.keywords.length >= 4);

  const needsPlanner =
    apiKey &&
    (firstHits.length < 3 || (complexQuestion && firstHits.length < 8));

  if (!needsPlanner) {
    return { hits: firstHits, intent, usedLlmPlanner: false };
  }

  try {
    const planned = await planRetrievalWithLLM(question, apiKey);
    if (!planned) return { hits: firstHits, intent, usedLlmPlanner: false };

    const merged = mergeRetrievalIntents(intent, planned);
    const secondHits = retrieveMarkersWithIntent(markers, merged);
    const hits = secondHits.length > firstHits.length ? secondHits : firstHits;
    return { hits, intent: merged, usedLlmPlanner: true };
  } catch (err) {
    console.warn('[agent/search] LLM planner failed:', err?.message || err);
    return { hits: firstHits, intent, usedLlmPlanner: false };
  }
}

export { buildMarkerIndex, buildRetrievalIntent, retrieveMarkers };

export function summarizeMarkerForPrompt(m) {
  const typeLabels = { spot: '足迹', event: '历史事件', inscription: '题字' };
  return {
    id: m.id,
    name: m.name,
    type: m.type,
    typeLabel: typeLabels[m.type] || m.type,
    date: m.date || null,
    endDate: m.endDate || null,
    title: m.title || null,
    tags: m.tags || [],
    region: [m.country, m.province, m.city].filter(Boolean).join(' / ') || null,
    description: (m.description || m.tripSummary || '').slice(0, 280) || null,
  };
}

export function toMapHits(markers) {
  return markers.map((m) => ({
    id: m.id,
    name: m.name,
    date: m.date || null,
    title: m.title || null,
  }));
}
