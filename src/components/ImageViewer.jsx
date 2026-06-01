import React, { useState, useEffect } from 'react';

export default function ImageViewer({ images, initialIndex = 0, onClose, overlayZClass = 'z-[6000]' }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setCurrentIndex((prev) => (prev + 1) % images.length);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, onClose]);

  const safeIndex = images.length
    ? Math.min(Math.max(0, currentIndex), images.length - 1)
    : 0;
  const currentImage = images[safeIndex];

  useEffect(() => {
    if (!images.length) onClose();
  }, [images.length, onClose]);

  if (!currentImage) return null;

  return (
    <div
      className={`fixed inset-0 ${overlayZClass} bg-black/90 flex items-center justify-center`}
      onClick={onClose}
    >
      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl leading-none z-10"
        >
          ✕
        </button>

        {/* 图片 */}
        <img
          src={currentImage.data}
          alt={currentImage.title || currentImage.name || ''}
          className="max-w-[90vw] max-h-[90vh] object-contain"
        />

        {/* 左右导航 */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
              className="absolute left-4 text-white hover:text-gray-300 text-3xl leading-none"
              aria-label="上一张"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
              className="absolute right-4 text-white hover:text-gray-300 text-3xl leading-none"
              aria-label="下一张"
            >
              ›
            </button>
          </>
        )}

        {/* 页码显示 */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1.5 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
}
