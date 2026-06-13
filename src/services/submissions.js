import { getSupabase } from '../lib/supabase';
import { migrateAllMarkerRegions } from '../utils/regionFormat';
import { normalizeMarkerTagList } from '../utils/markerTags';

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

export function normalizeMarkerSubmissionPayload(markerData) {
  const migrated = migrateAllMarkerRegions([markerData])[0];
  return {
    ...migrated,
    tags: normalizeMarkerTagList(migrated.tags),
    tripSummary: migrated.tripSummary?.trim() || null,
    images: migrated.images || [],
    sources: migrated.sources || [],
    id: `${markerData.type}_${Date.now()}`,
  };
}

/** 登录用户提交地点待审（不写入正式 markers 表） */
export async function submitMarkerForReview(markerData) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('云端未配置');

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user?.email) throw new Error('请先登录后再提交');

  const payload = normalizeMarkerSubmissionPayload(markerData);
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      type: 'marker',
      status: 'pending',
      payload,
      submitter_email: normalizeEmail(user.email),
    })
    .select('id, created_at')
    .single();

  if (error) throw error;
  return data;
}
