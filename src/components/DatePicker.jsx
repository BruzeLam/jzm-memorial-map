import React, { useState } from 'react';

export default function DatePicker({ onSelect, initialDate, initialEndDate, onClose }) {
  const [startDate, setStartDate] = useState(initialDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');
  const [error, setError] = useState('');

  const validateDateFormat = (dateStr) => {
    if (!dateStr) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  };

  const handleConfirm = () => {
    if (!startDate.trim()) {
      setError('请输入起始日期');
      return;
    }

    if (!validateDateFormat(startDate)) {
      setError('起始日期格式错误，请用 YYYY-MM-DD');
      return;
    }

    if (endDate && !validateDateFormat(endDate)) {
      setError('结束日期格式错误，请用 YYYY-MM-DD');
      return;
    }

    if (endDate && startDate === endDate) {
      // Same date - treat as point
      onSelect({
        date: startDate,
        endDate: undefined,
      });
    } else if (endDate) {
      // Different dates - treat as range, ensure chronological order
      const [minDate, maxDate] = startDate < endDate ? [startDate, endDate] : [endDate, startDate];
      onSelect({
        date: minDate,
        endDate: maxDate,
      });
    } else {
      // Only start date - point mode
      onSelect({
        date: startDate,
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
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      {/* Instructions */}
      <div className="text-xs text-gray-500 mb-4 px-3 py-2 bg-gray-50 rounded">
        <p className="mb-1">📝 使用说明：</p>
        <p>• 只填第一个框 = <strong>时间点</strong>（某一天）</p>
        <p>• 两个都填 = <strong>时间段</strong>（从某天到某天）</p>
        <p>• 格式: YYYY-MM-DD（如 2026-08-17）</p>
      </div>

      {/* Input fields */}
      <div className="space-y-3 mb-4">
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
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Selected dates display */}
      {startDate && (
        <div className="mb-3 px-3 py-2 bg-blue-50 rounded-lg text-sm text-gray-700 text-center font-medium">
          {endDate && startDate !== endDate
            ? `选中: ${startDate} — ${endDate}`
            : `选中: ${startDate}`}
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
