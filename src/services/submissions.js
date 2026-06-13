import { getSupabase } from '../lib/supabase';
import { migrateAllMarkerRegions } from '../utils/regionFormat';
import { normalizeMarkerTagList } from '../utils/markerTags';
import {
  upsertCloudMarker,
  upsertCloudGalleryBatch,
  buildGalleryFromMarkers,
} from './cloudData';
import { ensureMarkerImagesUploaded } from './imageStorage';

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

  let payload = normalizeMarkerSubmissionPayload(markerData);
  payload = await ensureMarkerImagesUploaded(payload);
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

export async function fetchSubmissions(status = 'pending') {
  const supabase = getSupabase();
  if (!supabase) throw new Error('云端未配置');

  let query = supabase.from('submissions').select('*').order('created_at', { ascending: false });
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function getReviewerEmail() {
  const supabase = getSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user?.email) throw new Error('未登录');
  return normalizeEmail(user.email);
}

export async function approveSubmission(submissionId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('云端未配置');

  const { data: row, error: fetchError } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .single();
  if (fetchError) throw fetchError;
  if (row.status !== 'pending') throw new Error('该条目已处理');

  if (row.type === 'marker') {
    const payload = await ensureMarkerImagesUploaded(row.payload);
    await upsertCloudMarker(payload);
    const gallery = buildGalleryFromMarkers([payload]);
    if (gallery.length) await upsertCloudGalleryBatch(gallery);
  } else {
    throw new Error(`暂不支持审核类型：${row.type}`);
  }

  const reviewerEmail = await getReviewerEmail();
  const { error } = await supabase
    .from('submissions')
    .update({
      status: 'approved',
      reviewer_email: reviewerEmail,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId);
  if (error) throw error;
}

export async function rejectSubmission(submissionId, reviewNote = '') {
  const supabase = getSupabase();
  if (!supabase) throw new Error('云端未配置');

  const reviewerEmail = await getReviewerEmail();
  const { error } = await supabase
    .from('submissions')
    .update({
      status: 'rejected',
      reviewer_email: reviewerEmail,
      review_note: reviewNote?.trim() || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .eq('status', 'pending');
  if (error) throw error;
}

/** 当前用户提交统计（用于账号菜单） */
export async function fetchMySubmissionStats() {
  const supabase = getSupabase();
  if (!supabase) return { total: 0, pending: 0, approved: 0, rejected: 0 };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user?.email) return { total: 0, pending: 0, approved: 0, rejected: 0 };

  const email = normalizeEmail(user.email);
  const { data, error } = await supabase
    .from('submissions')
    .select('status')
    .eq('submitter_email', email);

  if (error) throw error;

  const rows = data || [];
  return {
    total: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  };
}
