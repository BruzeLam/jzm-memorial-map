import React, { useEffect } from 'react';

/**
 * 纪念地图统一弹窗壳：backdrop-blur + 移动端上滑 / 桌面端缩放
 */
export default function MemorialModal({
  onClose,
  children,
  panelClassName = '',
  overlayClassName = '',
  zClass = 'z-[5000]',
  align = 'responsive',
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const alignClass =
    align === 'center'
      ? 'items-center justify-center p-4'
      : align === 'bottom'
        ? 'items-end justify-center p-0 sm:p-4 sm:items-center'
        : 'items-end md:items-center justify-center p-0 md:p-4';

  return (
    <div
      className={`memorial-modal-overlay ${zClass} ${alignClass} ${overlayClassName}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`memorial-modal-panel ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
