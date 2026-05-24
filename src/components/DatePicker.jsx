import React, { useState } from 'react';

// 模糊匹配多种日期格式
function parseDateString(dateStr) {
  if (!dateStr) return null;

  dateStr = dateStr.trim();

  // 已经是标准格式 YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    const year = parts[0];
    const month = String(parseInt(parts[1])).padStart(2, '0');
    const day = String(parseInt(parts[2])).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 8 位纯数字：YYYYMMDD
  if (/^\d{8}$/.test(dateStr)) {
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    return `${year}-${month}-${day}`;
  }

  // 7 位纯数字：YYYYMDD（月份单数字）
  if (/^\d{7}$/.test(dateStr)) {
    const year = dateStr.slice(0, 4);
    const month = String(parseInt(dateStr.slice(4, 5))).padStart(2, '0');
    const day = dateStr.slice(5, 7);
    return `${year}-${month}-${day}`;
  }

  // 6 位纯数字：YYYYMM（只有年月，默认为月初）
  if (/^\d{6}$/.test(dateStr)) {
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    return `${year}-${month}-01`;
  }

  return null;
}

export default function DatePicker({ onSelect, initialDate, initialEndDate, onClose }) {
  const [startDate, setStartDate] = useState(initialDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');
  const [error, setError] = useState('');

  const validateAndParse = (dateStr) => {
    const parsed = parseDateString(dateStr);
    return parsed !== null ? parsed : null;
  };

  const handleConfirm = () => {
    if (!startDate.trim()) {
      setError('请输入起始日期');
      return;
    }

    const parsedStart = validateAndParse(startDate);
    if (!parsedStart) {
      setError('起始日期格式错误，请用 YYYY-MM-DD、YYYYMMDD、YYYYMDD 或 YYYYMM');
      return;
    }

    let parsedEnd = null;
    if (endDate) {
      parsedEnd = validateAndParse(endDate);
      if (!parsedEnd) {
        setError('结束日期格式错误，请用 YYYY-MM-DD、YYYYMMDD、YYYYMDD 或 YYYYMM');
        return;
      }
    }

    if (parsedEnd && parsedStart === parsedEnd) {
      // Same date - treat as point
      onSelect({
        date: parsedStart,
        endDate: undefined,
      });
    } else if (parsedEnd) {
      // Different dates - treat as range, ensure chronological order
      const [minDate, maxDate] = parsedStart < parsedEnd ? [parsedStart, parsedEnd] : [parsedEnd, parsedStart];
      onSelect({
        date: minDate,
        endDate: maxDate,
      });
    } else {
      // Only start date - point mode
      onSelect({
        date: parsedStart,
        endDate: undefined,
      });
    }

    onClose && onClose();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setError('');
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-w-sm">
      {/* Instructions */}
      <div className="text-xs text-gray-500 mb-3 px-2 py-1.5 bg-gray-50 rounded leading-relaxed">
        📝 一个日期 = 时间点｜两个日期 = 时间段
      </div>

      {/* Input fields */}
      <div className="space-y-2 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">起始日期 *</label>
          <input
            type="text"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setError('');
            }}
            placeholder="YYYY-MM-DD"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">结束日期（可选）</label>
          <input
            type="text"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setError('');
            }}
            placeholder="YYYY-MM-DD（留空为时间点）"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-2 px-2 py-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Selected dates display */}
      {startDate && (
        <div className="mb-2 px-2 py-1 bg-blue-50 rounded text-xs text-gray-700 text-center font-medium">
          选中: {endDate && startDate !== endDate ? `${startDate} — ${endDate}` : startDate}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={!startDate}
          className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:hover:bg-white transition-colors"
        >
          重置
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!startDate}
          className="flex-1 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-blue-500 font-medium transition-colors"
        >
          确定
        </button>
      </div>
    </div>
  );
}
