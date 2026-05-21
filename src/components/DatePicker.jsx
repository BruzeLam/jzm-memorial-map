import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

/**
 * Helper to format date to YYYY-MM-DD
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper to format date to YYYY-MM (year-month only)
 * Used for range display format
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date string
 */
function formatYearMonth(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Helper to parse YYYY-MM-DD or YYYY-MM or YYYY
 * @param {string} dateStr - Date string to parse
 * @returns {Date|null} Parsed date object or null
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch (e) {
    return null;
  }
}

export default function DatePicker({ onSelect, initialDate, initialEndDate, onClose }) {
  const [selectedStart, setSelectedStart] = useState(
    initialDate ? parseDate(initialDate) : null
  );
  const [selectedEnd, setSelectedEnd] = useState(
    initialEndDate ? parseDate(initialEndDate) : null
  );
  const [displayText, setDisplayText] = useState('');

  /**
   * Update display text based on selected dates
   * Point: "2026-08-17"
   * Range: "1989-04 — 1989-06"
   */
  useEffect(() => {
    if (!selectedStart) {
      setDisplayText('');
      return;
    }

    const startFormatted = formatDate(selectedStart);

    if (!selectedEnd) {
      // Only start date selected - point mode
      setDisplayText(`选中: ${startFormatted}`);
      return;
    }

    // Both dates selected
    const endFormatted = formatDate(selectedEnd);
    if (startFormatted === endFormatted) {
      // Same date - point mode
      setDisplayText(`选中: ${startFormatted}`);
    } else {
      // Different dates - range mode (display as YYYY-MM — YYYY-MM)
      const startYM = formatYearMonth(selectedStart);
      const endYM = formatYearMonth(selectedEnd);
      setDisplayText(`选中: ${startYM} — ${endYM}`);
    }
  }, [selectedStart, selectedEnd]);

  const handleCalendarSelect = (date) => {
    if (!selectedStart) {
      // First click: set start date
      setSelectedStart(date);
    } else {
      // Second click: set end date
      setSelectedEnd(date);
    }
  };

  const handleConfirm = () => {
    if (!selectedStart) {
      onClose && onClose();
      return;
    }

    /**
     * Auto-detect mode based on date selection:
     * - If only start date: return as point (single date)
     * - If start === end: return as point (single date)
     * - If start !== end: return as range (start + endDate)
     */
    if (selectedEnd) {
      const startFormatted = formatDate(selectedStart);
      const endFormatted = formatDate(selectedEnd);

      if (startFormatted === endFormatted) {
        // Same date - treat as point mode (single date)
        onSelect({
          date: startFormatted,
          endDate: undefined,
        });
      } else {
        // Different dates - treat as range mode
        // Ensure chronological order (start before end)
        const start = new Date(selectedStart);
        const end = new Date(selectedEnd);
        const [minDate, maxDate] = start < end ? [start, end] : [end, start];

        onSelect({
          date: formatDate(minDate),
          endDate: formatDate(maxDate),
        });
      }
    } else {
      // Only start date selected - point mode
      onSelect({
        date: formatDate(selectedStart),
        endDate: undefined,
      });
    }

    onClose && onClose();
  };

  const handleReset = () => {
    setSelectedStart(null);
    setSelectedEnd(null);
  };

  /**
   * Tile styling for calendar dates
   * - Selected start/end dates: highlighted blue
   * - Dates in range: light blue background
   */
  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';

    const dateStr = formatDate(date);
    const startStr = selectedStart ? formatDate(selectedStart) : '';
    const endStr = selectedEnd ? formatDate(selectedEnd) : '';

    let classes = [];

    // Highlight selected start date (primary highlight)
    if (dateStr === startStr) {
      classes.push('bg-blue-500 text-white font-bold rounded-lg');
    }

    // Highlight selected end date (secondary highlight)
    if (dateStr === endStr && dateStr !== startStr) {
      classes.push('bg-blue-500 text-white font-bold rounded-lg');
    }

    // Highlight dates in range (between start and end, excluding endpoints)
    if (startStr && endStr && dateStr !== startStr && dateStr !== endStr) {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const current = new Date(date);
      const min = start < end ? start : end;
      const max = start < end ? end : start;

      if (current > min && current < max) {
        classes.push('bg-blue-100 text-gray-700 rounded-sm');
      }
    }

    return classes.join(' ');
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      {/* Instructions */}
      <div className="text-xs text-gray-500 mb-3 px-2 py-1.5 bg-gray-50 rounded">
        {selectedStart ? (
          selectedEnd ? (
            <span>已选择: <strong>{selectedStart ? formatDate(selectedStart) : ''}</strong> 和 <strong>{selectedEnd ? formatDate(selectedEnd) : ''}</strong></span>
          ) : (
            <span>已选择起始日期: <strong>{formatDate(selectedStart)}</strong> (点击第二个日期完成范围)</span>
          )
        ) : (
          <span>点击日期开始选择</span>
        )}
      </div>

      {/* Calendar */}
      <div className="mb-3">
        <Calendar
          onChange={handleCalendarSelect}
          value={selectedEnd || selectedStart}
          tileClassName={tileClassName}
          locale="zh-CN"
          maxDetail="month"
          minDetail="month"
          className="w-full border-none"
        />
      </div>

      {/* Selected dates display */}
      {displayText && (
        <div className="text-sm text-gray-700 mb-3 px-2 py-2 bg-blue-50 rounded-lg text-center font-medium">
          {displayText}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={!selectedStart}
          className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:hover:bg-white transition-colors"
        >
          重置
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedStart}
          className="flex-1 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-blue-500 font-medium transition-colors"
        >
          确定
        </button>
      </div>
    </div>
  );
}
