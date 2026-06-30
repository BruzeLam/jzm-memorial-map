# 地图交互模式

## 标点渲染

- `Map.jsx` 接收 `filteredMarkers`，按 type 着色
- zoom ≥ 8：标点 36/44px；全球视图缩小
- 经度用 `normalizeLng()` 支持横向无缝循环（`mapWrap.js`）

## 点击标点

1. `setSelectedMarker(marker)`
2. `flyToLatLng(mapRef, [lat, lng], { zoom: 10-12 智能计算 })`
3. 展示 `MapFloatingCard`（名称、日期、摘要）
4. 可进 DetailPanel 或「补充信息」开表单

## 关闭浮窗缩回

- 关闭浮窗时 zoom -2，最低 7 级
- 用户手动拖拽/缩放优先于动画

## 添加模式

| 模式 | 行为 |
|------|------|
| 地图标点 | 点击空白处 → pendingCoords → 开表单 |
| 手动输入 | 直接开表单填坐标 |
| 表单开启时点地图 | 更新经纬度（mapPickForForm） |

## 侧边栏联动

- 列表点击 → flyTo + 选中 + 可选开 DetailPanel
- 搜索/筛选只影响 `filteredMarkers`，不改变原始数据

## 历史上的今天

- `onThisDay.js`：匹配当前月日
- 无 date 的标记排最后
- 首日访问可弹 `OnThisDayModal`
