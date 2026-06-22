import React, { useState } from 'react';
import { parseFlexibleDateInput } from '../utils/dateInput';
import { getSortableDateKey } from '../utils/markerDates';

export default function DatePicker({ onSelect, initialDate, initialEndDate, onClose }) {
  const [startDate, setStartDate] = useState(initialDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');
  const [error, setError] = useState('');

  const validateAndParse = (dateStr) => parseFlexibleDateInput(dateStr);

  const handleConfirm = () => {
    if (!startDate.trim() && !endDate.trim()) {
      onSelect({ date: undefined, endDate: undefined });
      onClose && onClose();
      return;
    }

    if (!startDate.trim() && endDate.trim()) {
      setError('请输入起始日期');
      return;
    }

    const parsedStart = validateAndParse(startDate);
    if (!parsedStart) {
      setError('起始日期格式错误，请用 YYYY、YYYY-MM 或 YYYY-MM-DD');
      return;
    }

    let parsedEnd = null;
    if (endDate) {
      parsedEnd = validateAndParse(endDate);
      if (!parsedEnd) {
        setError('结束日期格式错误，请用 YYYY、YYYY-MM 或 YYYY-MM-DD');
        return;
      }
    }

    if (parsedEnd && parsedStart === parsedEnd) {
      onSelect({ date: parsedStart, endDate: undefined });
    } else if (parsedEnd) {
      const [minDate, maxDate] =
        getSortableDateKey(parsedStart) <= getSortableDateKey(parsedEnd)
          ? [parsedStart, parsedEnd]
          : [parsedEnd, parsedStart];
      onSelect({ date: minDate, endDate: maxDate });
    } else {
      onSelect({ date: parsedStart, endDate: undefined });
    }

    onClose && onClose();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setError('');
  };

  return (
    <div className="memorial-card p-3 max-w-sm shadow-memorial-lg">
      <p className="text-xs text-memorial-muted mb-2 px-2 py-1 bg-memorial-cream rounded-lg">
        可留空；结束日期留空表示单日。支持 YYYY、YYYY-MM、YYYY-MM-DD
      </p>

      <div className="space-y-2 mb-3">
        <div>
          <label className="admin-label">起始日期</label>
          <input
            type="text"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setError('');
            }}
            placeholder="YYYY / YYYY-MM / YYYY-MM-DD"
            className="admin-input font-mono"
          />
        </div>

        <div>
          <label className="admin-label">结束日期（可选）</label>
          <input
            type="text"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setError('');
            }}
            placeholder="同上（留空为时间点）"
            className="admin-input font-mono"
          />
        </div>
      </div>

      {error && (
        <div className="mb-2 px-2 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {error}
        </div>
      )}

      {startDate && (
        <div className="mb-2 px-2 py-1 bg-amber-50 border border-amber-200/80 rounded-lg text-xs text-memorial-ink text-center font-medium">
          选中: {endDate && startDate !== endDate ? `${startDate} — ${endDate}` : startDate}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={!startDate && !endDate}
          className="flex-1 py-2 text-sm memorial-btn-secondary disabled:opacity-40"
        >
          重置
        </button>
        <button type="button" onClick={handleConfirm} className="flex-1 py-2 text-sm memorial-btn-primary">
          确定
        </button>
      </div>
    </div>
  );
}
