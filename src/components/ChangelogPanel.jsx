import React, { useState, useEffect } from 'react';

export default function ChangelogPanel({ onClose }) {
  const [changelog, setChangelog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState({});

  useEffect(() => {
    fetch('/changelog.json')
      .then(res => res.json())
      .then(data => {
        setChangelog(data);
        setLoading(false);
        // 默认全部展开
        const expanded = {};
        data.forEach(log => {
          expanded[log.date] = true;
        });
        setExpandedDates(expanded);
      })
      .catch(() => {
        setChangelog([]);
        setLoading(false);
      });
  }, []);

  const toggleDate = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const isToday = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const getDateLabel = (dateStr) => {
    if (isToday(dateStr)) {
      return '✨ 今日更新';
    }
    // 格式化日期为"5月22日"这样的格式
    const [year, month, day] = dateStr.split('-');
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    return `📅 ${monthNum}月${dayNum}日`;
  };

  const getTotalCount = (log) => {
    return log.entries.reduce((sum, entry) => sum + entry.items.length, 0);
  };

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">📝 更新日志</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : changelog.length === 0 ? (
            <div className="text-center py-8 text-gray-400">暂无更新日志</div>
          ) : (
            <div className="space-y-3">
              {changelog.map((log) => {
                const isExpanded = expandedDates[log.date];
                const count = getTotalCount(log);
                const label = getDateLabel(log.date);

                return (
                  <div key={log.date} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    {/* 日期按钮 */}
                    <button
                      onClick={() => toggleDate(log.date)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-transparent hover:from-blue-100 flex items-center justify-between transition-colors text-left"
                    >
                      <span className="font-semibold text-gray-800 text-base">
                        {label}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                          {count} 项更新
                        </span>
                        <span className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </button>

                    {/* 内容 */}
                    {isExpanded && (
                      <div className="px-4 py-3 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100 space-y-4">
                        {log.entries.map((entry, idx) => (
                          <div key={idx}>
                            <h4 className="text-sm font-semibold text-blue-600 mb-2">{entry.category}</h4>
                            <ul className="text-sm text-gray-700 space-y-1.5 ml-2">
                              {entry.items.map((item, itemIdx) => (
                                <li key={itemIdx} className="flex gap-2">
                                  <span className="text-blue-400 flex-shrink-0">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
