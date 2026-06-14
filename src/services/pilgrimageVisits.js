import { getSupabase } from '../lib/supabase';

const MAX_BODY_LENGTH = 800;

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

export function getPilgrimageDisplayName(email) {
  if (!email) return '';
  const local = email.split('@')[0] || email;
  return local.length > 16 ? `${local.slice(0, 14)}…` : local;
}

export async function fetchPilgrimageVisits(markerId) {
  const supabase = getSupabase();
  if (!supabase || !markerId) return [];

  const { data, error } = await supabase
    .from('pilgrimage_visits')
    .select('id, marker_id, author_email, body, created_at')
    .eq('marker_id', markerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createPilgrimageVisit(markerId, body) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('云端未配置');

  const trimmed = (body || '').trim();
  if (!trimmed) throw new Error('请输入内容');
  if (trimmed.length > MAX_BODY_LENGTH) {
    throw new Error(`内容不能超过 ${MAX_BODY_LENGTH} 字`);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user?.email) throw new Error('请先登录');

  const { data, error } = await supabase
    .from('pilgrimage_visits')
    .insert({
      marker_id: markerId,
      author_email: normalizeEmail(user.email),
      body: trimmed,
    })
    .select('id, marker_id, author_email, body, created_at')
    .single();

  if (error) throw error;
  return data;
}

export async function deletePilgrimageVisit(id) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('云端未配置');

  const { error } = await supabase.from('pilgrimage_visits').delete().eq('id', id);
  if (error) throw error;
}

export { MAX_BODY_LENGTH };
