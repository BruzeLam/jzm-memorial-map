import React, { useRef, useState } from 'react';

export default function ImageUploadInput({ onUpload, disabled, label = '📸 上传图片' }) {
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const busyRef = useRef(false);

  const handleFileUpload = async (files) => {
    if (!files?.[0] || disabled || busyRef.current) return;
    busyRef.current = true;
    try {
      await onUpload({ target: { files } });
    } finally {
      busyRef.current = false;
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
    if (disabled) return; // 上传中禁止再次粘贴
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
        className={`w-full py-8 px-4 rounded-lg border-2 border-dashed text-center transition-colors cursor-pointer ${
          isDragging
            ? 'bg-blue-50 border-blue-400'
            : disabled
            ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
            : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="text-3xl mb-2">📸</div>
        <div className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
          {disabled ? '上传中...' : '拖拽图片到此处'}
        </div>
        <div className={`text-xs mt-2 ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
          或点击选择 / Ctrl+V 粘贴
        </div>
      </div>
    </div>
  );
}
