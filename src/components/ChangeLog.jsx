import React, { useState } from 'react';
import updates from '../data/updates.json';

const typeConfig = {
  feature: { label: '✨ 功能', color: 'bg-blue-50 border-blue-200' },
  optimize: { label: '⚡ 优化', color: 'bg-amber-50 border-amber-200' },
  refactor: { label: '🔧 重构', color: 'bg-purple-50 border-purple-200' },
  fix: { label: '🐛 修复', color: 'bg-red-50 border-red-200' },
};

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

  // 按类型分组更新
  const groupByType = (items) => {
    const grouped = {};
    items.forEach((item) => {
      const type = item.type || 'feature';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(item);
    });
    return grouped;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.3)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          // 点击背景关闭（由父组件处理）
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '85vh', backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">📋 更新日志</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {sortedDates.map((date) => {
            const isToday = date === todayKey;
            const isExpanded = expandedDates[date] !== false; // 默认展开
            const dateItems = updates[date];
            const groupedByType = groupByType(dateItems);

            return (
              <div
                key={date}
                className="rounded-xl border-2 overflow-hidden transition-all"
                style={{
                  borderImage: isToday
                    ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%) 1'
                    : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%) 1',
                  background: 'white',
                }}
              >
                {/* Date Header */}
                <button
                  onClick={() => toggleDate(date)}
                  className={`w-full px-4 py-3 flex items-center justify-between transition-all ${
                    isToday
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                  }`}
                >
                  <span className={`font-semibold text-sm ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
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
                  <div className="px-4 py-4 space-y-4">
                    {Object.entries(groupedByType).map(([type, items]) => (
                      <div key={type}>
                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                          {typeConfig[type]?.label || type}
                        </div>
                        <div className="space-y-2 pl-2 border-l-2 border-gray-200">
                          {items.map((item, idx) => (
                            <div key={idx}>
                              <div className="flex items-start gap-2">
                                <span className="text-lg mt-0.5 flex-shrink-0">{item.emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-800">{item.title}</p>
                                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
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
