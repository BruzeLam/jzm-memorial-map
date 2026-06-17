/** 导览 Agent：服务端加载地点（Supabase 为准，与前端一致） */

import { createClient } from '@supabase/supabase-js';
import { REMOVED_MARKER_IDS } from '../../src/utils/constants.js';
import {
  SITE_META_REMOVED_MARKER_IDS_KEY,
  combineRemovedMarkerIds,
} from '../../src/utils/removedMarkers.js';
import { mergeMarkerCatalog } from '../../src/utils/markerCatalog.js';
import {
  buildMarkerIndex,
  buildRetrievalIntent,
  mergeRetrievalIntents,
  retrieveMarkers,
  retrieveMarkersWithIntent,
} from './agentRetrieval.js';
import { planRetrievalWithLLM } from './agentQueryPlanner.js';
import { normalizeQuestionPronouns } from './agentContext.js';
import {
  isAggregateQuestion,
  sampleMarkersForAggregateQuestion,
} from './agentStats.js';

async function fetchDynamicRemovedIds(supabase) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('site_meta')
      .select('value')
      .eq('key', SITE_META_REMOVED_MARKER_IDS_KEY)
      .maybeSingle();
    if (error) return [];
    const ids = data?.value?.ids;
    return Array.isArray(ids) ? ids.filter(Boolean) : [];
  } catch {
    return [];
  }
}

async function loadFallbackSampleMarkers() {
  const { SAMPLE_MARKERS } = await import('../../src/utils/constants.js');
  const removed = new Set(REMOVED_MARKER_IDS);
  return SAMPLE_MARKERS.filter((m) => !removed.has(m.id));
}

export async function loadMarkersForAgent() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return loadFallbackSampleMarkers();
  }

  try {
    const supabase = createClient(url, key);
    const dynamicRemoved = await fetchDynamicRemovedIds(supabase);
    const removed = new Set(combineRemovedMarkerIds(dynamicRemoved));

    const { data, error } = await supabase
      .from('markers')
      .select('id, payload')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const remote = (data || [])
      .map((row) => row.payload)
      .filter((m) => m?.id && !removed.has(m.id));
    const { SAMPLE_MARKERS } = await import('../../src/utils/constants.js');
    return mergeMarkerCatalog(remote, SAMPLE_MARKERS, [...removed]);
  } catch (err) {
    console.warn('[agent/markers] Supabase load failed:', err?.message || err);
    return loadFallbackSampleMarkers();
  }
}

/** 两阶段检索：语料索引 + 必要时 LLM 规划 */
export async function searchMarkersForAgent(markers, question, { apiKey } = {}) {
  const normalizedQuestion = normalizeQuestionPronouns(question);
  let { hits: firstHits, intent } = retrieveMarkers(markers, normalizedQuestion);

  if (firstHits.length === 0 && isAggregateQuestion(question)) {
    firstHits = sampleMarkersForAggregateQuestion(markers, question);
  }

  const needsPlanner =
    apiKey &&
    firstHits.length < 3 &&
    !isAggregateQuestion(question);

  if (!needsPlanner) {
    return { hits: firstHits, intent, usedLlmPlanner: false, normalizedQuestion };
  }

  try {
    const planned = await planRetrievalWithLLM(normalizedQuestion, apiKey);
    if (!planned) return { hits: firstHits, intent, usedLlmPlanner: false, normalizedQuestion };

    const merged = mergeRetrievalIntents(intent, planned);
    const secondHits = retrieveMarkersWithIntent(markers, merged);
    const hits = secondHits.length > firstHits.length ? secondHits : firstHits;
    return { hits, intent: merged, usedLlmPlanner: true, normalizedQuestion };
  } catch (err) {
    console.warn('[agent/search] LLM planner failed:', err?.message || err);
    return { hits: firstHits, intent, usedLlmPlanner: false, normalizedQuestion };
  }
}

export { buildMarkerIndex, buildRetrievalIntent, retrieveMarkers, sampleMarkersForAggregateQuestion };

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
