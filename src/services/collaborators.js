import { getSupabase } from '../lib/supabase';

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

export async function fetchCollaborators() {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('collaborators')
    .select('email, role, invited_at, invited_by, notes')
    .order('invited_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addCollaborator({ email, role = 'editor', invitedBy, notes }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Cloud not configured');

  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error('请输入有效邮箱');

  const { error } = await supabase.from('collaborators').upsert({
    email: normalized,
    role: role === 'admin' ? 'admin' : 'editor',
    invited_by: invitedBy || null,
    notes: notes || null,
    invited_at: new Date().toISOString(),
  });

  if (error) throw error;
  return normalized;
}

export async function removeCollaborator(email) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Cloud not configured');

  const { error } = await supabase
    .from('collaborators')
    .delete()
    .eq('email', normalizeEmail(email));

  if (error) throw error;
}

export function findCollaborator(collaborators, userEmail) {
  const target = normalizeEmail(userEmail);
  if (!target) return null;
  return collaborators.find((c) => normalizeEmail(c.email) === target) || null;
}

export function canEditFromList(collaborators, userEmail) {
  return Boolean(findCollaborator(collaborators, userEmail));
}

export function isSuperAdminFromList(collaborators, userEmail) {
  const row = findCollaborator(collaborators, userEmail);
  return row?.role === 'admin';
}
