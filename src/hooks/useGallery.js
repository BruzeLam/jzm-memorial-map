import { useState, useEffect, useCallback } from 'react';
import {
  dedupeGallery,
  filterGalleryByTitle,
  isSameImageData,
  markerImageAlreadyInGallery,
} from '../utils/galleryUtils';

const GALLERY_KEY = 'jzm_gallery_images';
const GALLERY_VERSION_KEY = 'jzm_gallery_version';
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

export function useGallery(markers = []) {
  const [gallery, setGallery] = useState(() => loadFromStorage(markers));

  useEffect(() => {
    saveToStorage(gallery);
  }, [gallery]);

  const addImage = useCallback((imageData, metadata = {}) => {
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
      return [newImage, ...prev];
    });
    return result;
  }, []);

  /** 地点图片 → 影像馆（单向，按数据去重） */
  const syncImagesFromMarker = useCallback((markerId, markerName, images = [], region = {}) => {
    if (!images.length) return;
    setGallery((prev) => {
      let next = [...prev];
      let changed = false;
      images.forEach((img, idx) => {
        if (markerImageAlreadyInGallery(next, img.data, markerId)) return;
        next.unshift({
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
        });
        changed = true;
      });
      return changed ? dedupeGallery(next) : prev;
    });
  }, []);

  const updateImage = useCallback((id, updates) => {
    setGallery((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...updates } : img))
    );
  }, []);

  const deleteImage = useCallback((id) => {
    setGallery((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const removeMarkerRelation = useCallback((markerId) => {
    setGallery((prev) =>
      prev.map((img) =>
        img.relatedMarker === markerId ? { ...img, relatedMarker: null } : img
      )
    );
  }, []);

  const searchImages = useCallback(
    (query) => filterGalleryByTitle(gallery, query),
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
  };
}
