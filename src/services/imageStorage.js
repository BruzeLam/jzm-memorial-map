import { getSupabase } from '../lib/supabase';
import { isCloudEnabled } from '../lib/cloudConfig';

const BUCKET = 'images';

export function isBase64ImageData(data) {
  return typeof data === 'string' && data.startsWith('data:image');
}

export function isStoredImageUrl(data) {
  return (
    typeof data === 'string' &&
    (data.startsWith('http://') || data.startsWith('https://') || data.startsWith('/'))
  );
}

function buildObjectPath(prefix, ext = 'webp') {
  const safePrefix = (prefix || 'uploads').replace(/[^a-zA-Z0-9/_-]/g, '_');
  return `${safePrefix}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
}

/** 将 Base64 data URL 上传到 Storage，已是 URL 则原样返回 */
export async function uploadBase64Image(dataUrl, pathPrefix = 'uploads') {
  if (!isBase64ImageData(dataUrl)) return dataUrl;
  if (!isCloudEnabled()) return dataUrl;

  const supabase = getSupabase();
  if (!supabase) return dataUrl;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('请先登录后再上传图片');

  const blob = await fetch(dataUrl).then((res) => res.blob());
  const path = buildObjectPath(pathPrefix, blob.type === 'image/png' ? 'png' : 'webp');

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || 'image/webp',
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) throw new Error(`图片上传失败：${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function normalizeArchiveImage(img) {
  if (img?.data && typeof img.data === 'object' && typeof img.data.data === 'string') {
    return {
      ...img,
      data: img.data.data,
      name: img.name || img.data.name || '图片',
    };
  }
  return img;
}

export async function ensureMarkerImagesUploaded(marker) {
  if (!marker?.images?.length) return marker;

  const needsUpload = marker.images.some((img) => isBase64ImageData(img.data));
  if (!needsUpload) return marker;

  const prefix = `markers/${marker.id || 'draft'}`;
  const images = await Promise.all(
    marker.images.map(async (img) => ({
      ...img,
      data: await uploadBase64Image(img.data, prefix),
    }))
  );

  return { ...marker, images };
}

export async function ensureGalleryImageUploaded(item) {
  if (!item || !isBase64ImageData(item.data)) return item;
  const data = await uploadBase64Image(item.data, `gallery/${item.id || 'misc'}`);
  return { ...item, data };
}

export async function ensureArchiveImagesUploaded(archive) {
  if (!archive?.images?.length) return archive;

  const images = archive.images.map(normalizeArchiveImage);
  const needsUpload = images.some((img) => isBase64ImageData(img.data));
  if (!needsUpload) return { ...archive, images };

  const prefix = `archives/${archive.id || 'draft'}`;
  const uploaded = await Promise.all(
    images.map(async (img) => ({
      ...img,
      data: await uploadBase64Image(img.data, prefix),
    }))
  );

  return { ...archive, images: uploaded };
}

/** 将云端已有 Base64 图片批量迁到 Storage（管理员后台调用） */
export async function migrateCloudImagesToStorage({ onProgress } = {}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('云端未配置');

  const report = (msg) => onProgress?.(msg);

  let markersUpdated = 0;
  let galleryUpdated = 0;
  let archivesUpdated = 0;
  let submissionsUpdated = 0;

  report('扫描地点…');
  const { data: markerRows, error: markerErr } = await supabase.from('markers').select('id, payload');
  if (markerErr) throw markerErr;

  for (const row of markerRows || []) {
    const next = await ensureMarkerImagesUploaded(row.payload);
    if (JSON.stringify(next) !== JSON.stringify(row.payload)) {
      const { error } = await supabase.from('markers').upsert({
        id: row.id,
        payload: next,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      markersUpdated += 1;
    }
  }

  report('扫描影像馆…');
  const { data: galleryRows, error: galleryErr } = await supabase.from('gallery').select('id, payload');
  if (galleryErr) throw galleryErr;

  for (const row of galleryRows || []) {
    const next = await ensureGalleryImageUploaded(row.payload);
    if (JSON.stringify(next) !== JSON.stringify(row.payload)) {
      const { error } = await supabase.from('gallery').upsert({
        id: row.id,
        payload: next,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      galleryUpdated += 1;
    }
  }

  report('扫描档案馆…');
  const { data: archiveRows, error: archiveErr } = await supabase.from('archives').select('id, payload');
  if (archiveErr) throw archiveErr;

  for (const row of archiveRows || []) {
    const next = await ensureArchiveImagesUploaded(row.payload);
    if (JSON.stringify(next) !== JSON.stringify(row.payload)) {
      const { error } = await supabase.from('archives').upsert({
        id: row.id,
        payload: next,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      archivesUpdated += 1;
    }
  }

  report('扫描待审提交…');
  const { data: submissionRows, error: subErr } = await supabase.from('submissions').select('id, payload');
  if (subErr) throw subErr;

  for (const row of submissionRows || []) {
    const next = await ensureMarkerImagesUploaded(row.payload);
    if (JSON.stringify(next) !== JSON.stringify(row.payload)) {
      const { error } = await supabase.from('submissions').update({ payload: next }).eq('id', row.id);
      if (error) throw error;
      submissionsUpdated += 1;
    }
  }

  return { markersUpdated, galleryUpdated, archivesUpdated, submissionsUpdated };
}
