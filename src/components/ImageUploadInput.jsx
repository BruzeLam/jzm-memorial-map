import React, { useRef, useState } from 'react';

export default function ImageUploadInput({ onUpload, disabled, label = '📸 上传图片' }) {
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (files) => {
    if (files && files[0]) {
      await onUpload({ target: { files } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handlePaste = (e) => {
    const files = e.clipboardData.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={(e) => handleFileUpload(e.target.files)}
        disabled={disabled}
        className="hidden"
      />

      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
        className={`w-full py-1.5 px-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
          isDragging
            ? 'bg-blue-100 border-blue-400 text-blue-600'
            : disabled
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        }`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {disabled ? '上传中...' : `${label} (或粘贴/拖拽)`}
      </div>
    </div>
  );
}
