import React, { useState, useEffect, useCallback } from 'react';

export default function ImageViewer({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, onClose]);

  if (!images || images.length === 0) return null;

  const current = images[currentIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-[9999] flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4">
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 text-3xl font-light transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center w-full px-8">
        <img
          src={current.url}
          alt={`图片 ${currentIndex + 1}`}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          onClick={goToPrevious}
          className="text-white hover:text-gray-300 text-2xl transition-colors"
          title="上一张 (←)"
        >
          ◀
        </button>
        <span className="text-white text-sm">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          onClick={goToNext}
          className="text-white hover:text-gray-300 text-2xl transition-colors"
          title="下一张 (→)"
        >
          ▶
        </button>
      </div>

      {images.length > 1 && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <button
            onClick={goToPrevious}
            className="text-white hover:text-gray-300 opacity-50 hover:opacity-100 text-4xl transition-all"
            title="上一张"
          >
            ◀
          </button>
        </div>
      )}

      {images.length > 1 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <button
            onClick={goToNext}
            className="text-white hover:text-gray-300 opacity-50 hover:opacity-100 text-4xl transition-all"
            title="下一张"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}
