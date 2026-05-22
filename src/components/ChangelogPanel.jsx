import React from 'react';

export default function ChangelogPanel({ onClose }) {
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
          {/* 2026-05-22 */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">📅 2026-05-22</h3>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-blue-600 mb-2">✨ 功能优化</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• <strong>日期排序优化</strong>：合并两个排序按钮为一个，点击切换升序/降序，节省空间</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-green-600 mb-2">📋 数据更新</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• <strong>示例标记完善</strong>：为所有示例标记添加行政区划字段</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-purple-600 mb-2">🎨 界面调整</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• 表单字段重排：行政区划移到经纬度前</li>
                <li>• 详情面板优化：地区信息调整显示位置</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-orange-600 mb-2">🔧 布局修复</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• 侧边栏恢复：恢复原始flexbox布局，确保稳定显示</li>
              </ul>
            </div>
          </div>

          {/* 2026-05-21 */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">📅 2026-05-21</h3>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-blue-600 mb-2">✨ 核心功能</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• <strong>地点详情面板</strong>：查看标记的完整信息</li>
                <li>• <strong>距离计算</strong>：显示用户与地标的直线距离</li>
                <li>• <strong>行政区划识别</strong>：自动识别国家、省份、城市</li>
                <li>• <strong>地点搜索</strong>：搜索并自动填充坐标信息</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-indigo-600 mb-2">📚 长者语录模块</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• 内置15条预置语录</li>
                <li>• 支持搜索和筛选</li>
                <li>• 用户上传功能（数据本地存储）</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-green-600 mb-2">🗺️ 地图功能</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• 地图标点和手动输入两种添加方式</li>
                <li>• 浮动卡片快速添加标记</li>
                <li>• 自定义缩放键（右上角）</li>
                <li>• 标记卡片显示距离信息</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-amber-600 mb-2">🔍 搜索和筛选</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• 全文搜索（名称、标题、描述、日期）</li>
                <li>• 类型筛选（足迹、历史事件、题字）</li>
                <li>• 日期升序/降序排列</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-rose-600 mb-2">💾 数据管理</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• 多格式导出（JSON、CSV、GeoJSON）</li>
                <li>• 16个预置标记</li>
                <li>• 本地存储和版本管理</li>
                <li>• 恢复示例数据或清空所有数据</li>
              </ul>
            </div>
          </div>

          <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
            💡 更多信息请查看 GitHub 仓库中的 CHANGELOG.md
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
