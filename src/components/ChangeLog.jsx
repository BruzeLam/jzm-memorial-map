import React, { useState } from 'react';
import updates from '../data/updates.json';

export default function ChangeLog() {
  const [expandedDates, setExpandedDates] = useState({});

  // 获取今日日期（YYYY-M-D 格式，与 JSON key 匹配）
  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  const todayKey = getTodayKey();

  // 按日期排序（最新的在前）
  const sortedDates = Object.keys(updates).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB - dateA;
  });

  const toggleDate = (date) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          // 点击背景关闭（由父组件处理）
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">📋 更新日志</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {sortedDates.map((date) => {
            const isToday = date === todayKey;
            const isExpanded = expandedDates[date] !== false; // 默认展开

            return (
              <div key={date} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Date Header */}
                <button
                  onClick={() => toggleDate(date)}
                  className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                    isToday
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className={`font-medium ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                    {isToday ? '🔔 今日更新' : `📅 ${date}`}
                  </span>
                  <span
                    className="text-gray-400 transition-transform"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    ▼
                  </span>
                </button>

                {/* Updates List */}
                {isExpanded && (
                  <div className="px-4 py-3 space-y-3 bg-white border-t border-gray-100">
                    {updates[date].map((item, idx) => (
                      <div key={idx} className="pb-3 last:pb-0">
                        <h4 className="font-medium text-gray-800 text-sm mb-1">
                          {item.title}
                        </h4>
                        <p className="text-gray-600 text-xs leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
