import { getSupabase } from '../lib/supabase';
import { uploadBase64Image } from './imageStorage';

const MAX_BODY_LENGTH = 800;
const MAX_IMAGES = 3;

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

export function getPilgrimageDisplayName(email) {
  if (!email) return '';
  const local = email.split('@')[0] || email;
  return local.length > 16 ? `${local.slice(0, 14)}…` : local;
}

function buildGalleryPayload({ id, img, marker, authorEmail, body }) {
  return {
    id,
    data: img.data,
    name: img.name || '巡礼图片',
    title: marker?.name || '',
    description: body ? body.slice(0, 200) : '',
    location: {
      country: marker?.country || '',
      province: marker?.province || '',
      city: marker?.city || '',
      address: '',
      latitude: marker?.latitude ?? '',
      longitude: marker?.longitude ?? '',
    },
    relatedMarker: marker?.id || null,
    source: 'community',
    authorEmail: normalizeEmail(authorEmail),
    uploadTime: new Date().toISOString(),
  };
}

async function attachGalleryImages(rows) {
  if (!rows.length) return rows;
  const supabase = getSupabase();
  if (!supabase) return rows.map((row) => ({ ...row, images: [] }));

  const allIds = [...new Set(rows.flatMap((row) => row.gallery_ids || []))];
  if (!allIds.length) return rows.map((row) => ({ ...row, images: [] }));

  const { data: galleryRows, error } = await supabase
    .from('gallery')
    .select('id, payload')
    .in('id', allIds);

  if (error) throw error;
  const map = Object.fromEntries((galleryRows || []).map((r) => [r.id, r.payload]));

  return rows.map((row) => ({
    ...row,
    images: (row.gallery_ids || []).map((id) => map[id]).filter(Boolean),
  }));
}

export async function fetchPilgrimageVisits(markerId) {
  const supabase = getSupabase();
  if (!supabase || !markerId) return [];

  const { data, error } = await supabase
    .from('pilgrimage_visits')
    .select('id, marker_id, author_email, body, gallery_ids, created_at')
    .eq('marker_id', markerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return attachGalleryImages(data || []);
}

async function createCommunityGalleryEntries(images, { marker, authorEmail, body }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('云端未配置');

  const galleryIds = [];
  const now = Date.now();

  for (let i = 0; i < images.length; i += 1) {
    const img = images[i];
    const id = `img_pilgrimage_${now}_${i}_${Math.random().toString(36).slice(2, 7)}`;
    const uploadedUrl = await uploadBase64Image(img.data, `pilgrimage/${marker?.id || 'misc'}`);
    const payload = buildGalleryPayload({
      id,
      img: { ...img, data: uploadedUrl },
      marker,
      authorEmail,
      body,
    });

    const { error } = await supabase.from('gallery').insert({
      id,
      payload,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    galleryIds.push(id);
  }

  return galleryIds;
}

export async function createPilgrimageVisit(markerId, { body = '', images = [], marker = {} } = {}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('云端未配置');

  const trimmed = (body || '').trim();
  if (trimmed.length > MAX_BODY_LENGTH) {
    throw new Error(`内容不能超过 ${MAX_BODY_LENGTH} 字`);
  }
  if (!trimmed && !images.length) throw new Error('请输入文字或添加图片');

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user?.email) throw new Error('请先登录');

  if (images.length > MAX_IMAGES) {
    throw new Error(`最多上传 ${MAX_IMAGES} 张图片`);
  }

  const authorEmail = normalizeEmail(user.email);
  const galleryIds = images.length
    ? await createCommunityGalleryEntries(images, { marker, authorEmail, body: trimmed })
    : [];

  const { data, error } = await supabase
    .from('pilgrimage_visits')
    .insert({
      marker_id: markerId,
      author_email: authorEmail,
      body: trimmed,
      gallery_ids: galleryIds,
    })
    .select('id, marker_id, author_email, body, gallery_ids, created_at')
    .single();

  if (error) throw error;
  const [withImages] = await attachGalleryImages([data]);
  return withImages;
}

export async function deletePilgrimageVisit(id) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('云端未配置');

  const { data: row, error: fetchError } = await supabase
    .from('pilgrimage_visits')
    .select('gallery_ids')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const galleryIds = row?.gallery_ids || [];
  if (galleryIds.length) {
    const { error: galleryError } = await supabase.from('gallery').delete().in('id', galleryIds);
    if (galleryError) throw galleryError;
  }

  const { error } = await supabase.from('pilgrimage_visits').delete().eq('id', id);
  if (error) throw error;
}

export { MAX_BODY_LENGTH, MAX_IMAGES };
