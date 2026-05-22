import { useState, useCallback } from 'react';

export function useGallery() {
  const [gallery, setGallery] = useState(() => {
    const stored = localStorage.getItem('jzm_gallery');
    return stored ? JSON.parse(stored) : [];
  });

  const saveGallery = useCallback((newGallery) => {
    setGallery(newGallery);
    localStorage.setItem('jzm_gallery', JSON.stringify(newGallery));
  }, []);

  const addGalleryItem = useCallback((item) => {
    const newItem = {
      id: Date.now().toString(),
      images: item.images || [],
      description: item.description || '',
      relatedMarkerId: item.relatedMarkerId || null,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newItem, ...gallery];
    saveGallery(updated);
    return newItem.id;
  }, [gallery, saveGallery]);

  const deleteGalleryItem = useCallback((id) => {
    const updated = gallery.filter((item) => item.id !== id);
    saveGallery(updated);
  }, [gallery, saveGallery]);

  const updateGalleryItem = useCallback((id, updates) => {
    const updated = gallery.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    saveGallery(updated);
  }, [gallery, saveGallery]);

  return {
    gallery,
    addGalleryItem,
    deleteGalleryItem,
    updateGalleryItem,
  };
}
