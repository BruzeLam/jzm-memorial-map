import { useState, useEffect, useCallback } from 'react';
import {
  dedupeGallery,
  isSameImageData,
  markerImageAlreadyInGallery,
} from '../utils/galleryUtils';
import { filterGalleryBySearch } from '../utils/textSearch';
import { isCloudEnabled } from '../lib/cloudConfig';
import { getStorageKeys } from '../config/branding';
import { fetchCloudGallery, upsertCloudGalleryBatch } from '../services/cloudData';

const _sk = getStorageKeys();
const GALLERY_KEY = _sk.gallery;
const GALLERY_CACHE_KEY = _sk.galleryCache;
const GALLERY_VERSION_KEY = _sk.galleryVersion;
const GALLERY_DATA_VERSION = 2;

function migrateGallery(gallery) {
  return dedupeGallery(gallery);
}

function loadFromStorage(markers = []) {
  try {
    const storedVersion = parseInt(localStorage.getItem(GALLERY_VERSION_KEY) || '0', 10);
    const raw = localStorage.getItem(GALLERY_KEY);
    let gallery = raw ? JSON.parse(raw) : [];

    if (storedVersion < 1) {
      markers.forEach((marker) => {
        if (!marker.images?.length) return;
        marker.images.forEach((img, idx) => {
          if (markerImageAlreadyInGallery(gallery, img.data, marker.id)) return;
          gallery.push({
            id: `img_${marker.id}_${idx}`,
            data: img.data,
            name: img.name || `${marker.name}-${idx}`,
            title: marker.name,
            description: '',
            location: {
              country: marker.country || '',
              province: marker.province || '',
              city: marker.city || '',
              address: '',
              latitude: marker.latitude || '',
              longitude: marker.longitude || '',
            },
            relatedMarker: marker.id,
            uploadTime: new Date().toISOString(),
          });
        });
      });
    }

    if (storedVersion < GALLERY_DATA_VERSION) {
      gallery = migrateGallery(gallery);
      localStorage.setItem(GALLERY_VERSION_KEY, String(GALLERY_DATA_VERSION));
      localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
    }

    return gallery;
  } catch (e) {
    console.error('Failed to load gallery from localStorage:', e);
    return [];
  }
}

function saveToStorage(gallery) {
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
  } catch (e) {
    console.error('Failed to save gallery to localStorage:', e);
  }
}

export function useGallery(markers = [], { isEditor = false } = {}) {
  const cloudMode = isCloudEnabled();
  const [gallery, setGallery] = useState(() => (cloudMode ? [] : loadFromStorage(markers)));
  const readOnly = cloudMode && !isEditor;

  const persistGallery = useCallback(
    (items) => {
      if (cloudMode && isEditor && items.length) {
        upsertCloudGalleryBatch(items).catch((err) =>
          console.error('Cloud gallery save failed:', err)
        );
      }
    },
    [cloudMode, isEditor]
  );

  useEffect(() => {
    if (!cloudMode) {
      saveToStorage(gallery);
    }
  }, [gallery, cloudMode]);

  useEffect(() => {
    if (!cloudMode) return undefined;

    let cancelled = false;
    fetchCloudGallery()
      .then((rows) => {
        if (cancelled) return;
        const next = dedupeGallery(rows || []);
        setGallery(next);
        try {
          localStorage.setItem(GALLERY_CACHE_KEY, JSON.stringify(next));
        } catch (_) {}
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Cloud gallery fetch failed:', err);
        try {
          const cached = localStorage.getItem(GALLERY_CACHE_KEY);
          if (cached) setGallery(JSON.parse(cached));
        } catch (_) {}
      });

    return () => {
      cancelled = true;
    };
  }, [cloudMode]);

  const addImage = useCallback((imageData, metadata = {}) => {
    if (readOnly) return null;
    let result = null;
    setGallery((prev) => {
      if (prev.some((g) => isSameImageData(g.data, imageData.data))) {
        return prev;
      }
      const newImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        data: imageData.data,
        name: imageData.name || '图片',
        title: metadata.title || '',
        description: metadata.description || '',
        location: metadata.location || {
          country: '',
          province: '',
          city: '',
          address: '',
          latitude: '',
          longitude: '',
        },
        relatedMarker: metadata.relatedMarker || null,
        uploadTime: new Date().toISOString(),
      };
      result = newImage;
      if (cloudMode && isEditor) {
        persistGallery([newImage]);
      }
      return [newImage, ...prev];
    });
    return result;
  }, [readOnly, cloudMode, isEditor, persistGallery]);

  /** 地点图片 → 影像馆（单向，按数据去重） */
  const syncImagesFromMarker = useCallback((markerId, markerName, images = [], region = {}) => {
    if (readOnly || !images.length) return;
    setGallery((prev) => {
      let next = [...prev];
      let changed = false;
      const added = [];
      images.forEach((img, idx) => {
        if (markerImageAlreadyInGallery(next, img.data, markerId)) return;
        const entry = {
          id: `img_${markerId}_${Date.now()}_${idx}`,
          data: img.data,
          name: img.name || `${markerName}-${idx}`,
          title: markerName,
          description: '',
          location: {
            country: region.country || '',
            province: region.province || '',
            city: region.city || '',
            address: '',
            latitude: region.latitude ?? '',
            longitude: region.longitude ?? '',
          },
          relatedMarker: markerId,
          uploadTime: new Date().toISOString(),
        };
        added.push(entry);
        next.unshift(entry);
        changed = true;
      });
      if (changed) {
        const deduped = dedupeGallery(next);
        if (cloudMode && isEditor && added.length) {
          persistGallery(added);
        }
        return deduped;
      }
      return prev;
    });
  }, [readOnly, cloudMode, isEditor, persistGallery]);

  const updateImage = useCallback((id, updates) => {
    if (readOnly) return;
    setGallery((prev) => {
      const next = prev.map((img) => {
        if (img.id !== id) return img;
        const merged = { ...img, ...updates };
        if (cloudMode && isEditor) {
          persistGallery([merged]);
        }
        return merged;
      });
      return next;
    });
  }, [readOnly, cloudMode, isEditor, persistGallery]);

  const deleteImage = useCallback((id) => {
    if (readOnly) return;
    setGallery((prev) => prev.filter((img) => img.id !== id));
    // 云端删除暂不在首页暴露；后台可补全
  }, [readOnly]);

  const removeMarkerRelation = useCallback((markerId) => {
    if (readOnly) return;
    setGallery((prev) =>
      prev.map((img) =>
        img.relatedMarker === markerId ? { ...img, relatedMarker: null } : img
      )
    );
  }, [readOnly]);

  const searchImages = useCallback(
    (query, markersList = []) => filterGalleryBySearch(gallery, query, markersList),
    [gallery]
  );

  const dedupeAll = useCallback(() => {
    setGallery((prev) => dedupeGallery(prev));
  }, []);

  return {
    gallery,
    addImage,
    syncImagesFromMarker,
    updateImage,
    deleteImage,
    removeMarkerRelation,
    searchImages,
    dedupeAll,
    readOnly,
  };
}
