import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AddMarkerForm from '../components/AddMarkerForm';
import {
  fetchCloudMarkers,
  upsertCloudMarker,
  buildGalleryFromMarkers,
  upsertCloudGalleryBatch,
} from '../services/cloudData';
import { collectAllMarkerTags } from '../utils/markerTags';

export default function AdminMarkerEdit() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [marker, setMarker] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCloudMarkers()
      .then((rows) => setAllTags(collectAllMarkerTags(rows || [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    fetchCloudMarkers()
      .then((rows) => {
        const found = rows.find((m) => m.id === decodeURIComponent(id));
        if (!found) setError('未找到该地点');
        else setMarker(found);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = isNew
        ? { ...data, id: `${data.type}_${Date.now()}` }
        : { ...data, id: marker.id };

      await upsertCloudMarker(payload);

      if (payload.images?.length) {
        const galleryItems = buildGalleryFromMarkers([payload]);
        await upsertCloudGalleryBatch(galleryItems);
      }

      navigate('/admin/markers');
    } catch (e) {
      window.alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-memorial-muted">加载中…</p>;
  }

  if (error) {
    return (
      <div>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <Link to="/admin/markers" className="text-sm text-memorial-navy">← 返回列表</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-memorial-navy">{isNew ? '新建地点' : '编辑地点'}</h1>
        <Link to="/admin/markers" className="text-sm text-memorial-muted hover:text-memorial-ink">← 返回列表</Link>
      </div>

      <div className="admin-card p-4 max-w-2xl">
        <AddMarkerForm
          mapRef={mapRef}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/markers')}
          editingMarker={isNew ? null : marker}
          allMarkerTags={allTags}
          markers={[]}
        />
        {saving && <p className="text-xs text-memorial-muted mt-2">保存中…</p>}
      </div>
    </div>
  );
}
