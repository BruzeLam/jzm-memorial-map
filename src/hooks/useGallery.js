import { useState, useEffect, useCallback } from 'react';

const GALLERY_KEY = 'jzm_gallery_images';
const GALLERY_VERSION_KEY = 'jzm_gallery_version';

function loadFromStorage(markers = []) {
  try {
    const stored = localStorage.getItem(GALLERY_KEY);
    let gallery = stored ? JSON.parse(stored) : [];

    // 首次加载时，导入已有标记中的图片
    const hasExisting = localStorage.getItem(GALLERY_VERSION_KEY);
    if (!hasExisting) {
      // 从所有标记中提取图片，导入到影像馆
      markers.forEach(marker => {
        if (marker.images && marker.images.length > 0) {
          marker.images.forEach((img, idx) => {
            // 检查是否已存在（避免重复）
            const exists = gallery.some(g => g.data === img.data);
            if (!exists) {
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
            }
          });
        }
      });

      localStorage.setItem(GALLERY_VERSION_KEY, '1');
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
    const newImage = {
      id: `img_${Date.now()}`,
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
    setGallery((prev) => [newImage, ...prev]); // 新图片放在前面
    return newImage;
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
    // 当标记被删除时，清除影像馆中的关联
    setGallery((prev) =>
      prev.map((img) =>
        img.relatedMarker === markerId
          ? { ...img, relatedMarker: null }
          : img
      )
    );
  }, []);

  const searchImages = useCallback((query) => {
    if (!query.trim()) return gallery;

    const q = query.toLowerCase();
    return gallery.filter((img) =>
      img.title?.toLowerCase().includes(q) ||
      img.description?.toLowerCase().includes(q) ||
      img.location?.address?.toLowerCase().includes(q) ||
      img.location?.city?.toLowerCase().includes(q) ||
      img.location?.province?.toLowerCase().includes(q) ||
      img.name?.toLowerCase().includes(q)
    );
  }, [gallery]);

  return {
    gallery,
    addImage,
    updateImage,
    deleteImage,
    removeMarkerRelation,
    searchImages,
  };
}
