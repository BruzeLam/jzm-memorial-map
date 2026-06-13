import { getSupabase } from '../lib/supabase';
import { migrateAllMarkerRegions } from '../utils/regionFormat';
import { normalizeMarkerTagList, registerMarkerTags, collectAllMarkerTags } from '../utils/markerTags';
import { REMOVED_MARKER_IDS } from '../utils/constants';
import {
  ensureMarkerImagesUploaded,
  ensureGalleryImageUploaded,
  ensureArchiveImagesUploaded,
} from './imageStorage';

const removedIdSet = new Set(REMOVED_MARKER_IDS);

function normalizeMarkerFields(marker) {
  return {
    ...marker,
    tags: normalizeMarkerTagList(marker.tags),
    tripSummary: marker.tripSummary?.trim() || null,
    images: marker.images || [],
    sources: marker.sources || [],
  };
}

function applyMarkerMigrations(markers) {
  const withoutRemoved = markers.filter((m) => !removedIdSet.has(m.id));
  const migrated = migrateAllMarkerRegions(withoutRemoved).map(normalizeMarkerFields);
  registerMarkerTags(collectAllMarkerTags(migrated));
  return migrated;
}

function rowToMarker(row) {
  return normalizeMarkerFields(row.payload);
}

export async function fetchCloudMarkers() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('markers')
    .select('id, payload, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return applyMarkerMigrations((data || []).map(rowToMarker));
}

export async function upsertCloudMarker(marker) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Cloud not configured');

  let normalized = normalizeMarkerFields(migrateAllMarkerRegions([marker])[0]);
  normalized = await ensureMarkerImagesUploaded(normalized);
  const { error } = await supabase.from('markers').upsert({
    id: normalized.id,
    payload: normalized,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return normalized;
}

export async function upsertCloudMarkersBatch(markers) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Cloud not configured');

  const migrated = applyMarkerMigrations(markers);
  const uploaded = await Promise.all(migrated.map((m) => ensureMarkerImagesUploaded(m)));
  const rows = uploaded.map((m) => ({
    id: m.id,
    payload: m,
    updated_at: new Date().toISOString(),
  }));

  const chunkSize = 50;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from('markers').upsert(chunk);
    if (error) throw error;
  }
  registerMarkerTags(collectAllMarkerTags(rows.map((r) => r.payload)));
  return rows.length;
}

export async function deleteCloudMarker(id) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Cloud not configured');
  const { error } = await supabase.from('markers').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchCloudGallery() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('gallery')
    .select('id, payload')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => row.payload);
}

export async function upsertCloudGalleryBatch(items) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Cloud not configured');

  if (!items.length) return 0;

  const uploaded = await Promise.all(items.map((item) => ensureGalleryImageUploaded(item)));
  const rows = uploaded.map((item) => ({
    id: item.id,
    payload: item,
    updated_at: new Date().toISOString(),
  }));

  const chunkSize = 50;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const { error } = await supabase.from('gallery').upsert(rows.slice(i, i + chunkSize));
    if (error) throw error;
  }
  return rows.length;
}

export async function setCloudDataVersion(version) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Cloud not configured');
  const { error } = await supabase.from('site_meta').upsert({
    key: 'data_version',
    value: { version },
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function fetchCloudDataVersion() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('site_meta')
    .select('value')
    .eq('key', 'data_version')
    .maybeSingle();
  if (error) throw error;
  return data?.value?.version ?? null;
}

function rowToQuote(row) {
  return row.payload;
}

export async function fetchCloudQuotes() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('quotes')
    .select('id, payload, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(rowToQuote);
}

export async function upsertCloudQuote(quote) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Cloud not configured');

  const { error } = await supabase.from('quotes').upsert({
    id: quote.id,
    payload: quote,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return quote;
}

export async function upsertCloudQuotesBatch(quotes) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Cloud not configured');
  if (!quotes.length) return 0;

  const rows = quotes.map((q) => ({
    id: q.id,
    payload: q,
    updated_at: new Date().toISOString(),
  }));

  const chunkSize = 50;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const { error } = await supabase.from('quotes').upsert(rows.slice(i, i + chunkSize));
    if (error) throw error;
  }
  return rows.length;
}

export async function deleteCloudQuote(id) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Cloud not configured');
  const { error } = await supabase.from('quotes').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchCloudArchives() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('archives')
    .select('id, payload, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => row.payload);
}

export async function upsertCloudArchive(archive) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Cloud not configured');

  const normalized = await ensureArchiveImagesUploaded(archive);
  const { error } = await supabase.from('archives').upsert({
    id: normalized.id,
    payload: normalized,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return normalized;
}

export async function upsertCloudArchivesBatch(archives) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Cloud not configured');
  if (!archives.length) return 0;

  const uploaded = await Promise.all(archives.map((a) => ensureArchiveImagesUploaded(a)));
  const rows = uploaded.map((a) => ({
    id: a.id,
    payload: a,
    updated_at: new Date().toISOString(),
  }));

  const chunkSize = 20;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const { error } = await supabase.from('archives').upsert(rows.slice(i, i + chunkSize));
    if (error) throw error;
  }
  return rows.length;
}

export async function deleteCloudArchive(id) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Cloud not configured');
  const { error } = await supabase.from('archives').delete().eq('id', id);
  if (error) throw error;
}

/** 从 markers 构建 gallery 条目（与 useGallery 迁移逻辑一致） */
export function buildGalleryFromMarkers(markers) {
  const gallery = [];
  markers.forEach((marker) => {
    if (!marker.images?.length) return;
    marker.images.forEach((img, idx) => {
      gallery.push({
        id: `img_${marker.id}_${idx}`,
        data: img.data,
        name: img.name || `${marker.name}-${idx}`,
        title: img.title || marker.name,
        description: img.description || '',
        location: {
          country: marker.country || '',
          province: marker.province || '',
          city: marker.city || '',
          address: '',
          latitude: marker.latitude ?? '',
          longitude: marker.longitude ?? '',
        },
        relatedMarker: marker.id,
        uploadTime: new Date().toISOString(),
      });
    });
  });
  return gallery;
}

/** 解析侧栏导出的 JSON / GeoJSON / 纯数组 */
export function parseMarkersImport(raw) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.markers)) return data.markers;

  if (data?.type === 'FeatureCollection' && Array.isArray(data.features)) {
    return data.features.map((feature) => {
      const [longitude, latitude] = feature.geometry?.coordinates || [];
      return {
        ...feature.properties,
        latitude,
        longitude,
      };
    });
  }

  throw new Error('无法识别 JSON 格式（支持侧栏导出的 JSON 或 markers 数组）');
}

export { applyMarkerMigrations, normalizeMarkerFields };
