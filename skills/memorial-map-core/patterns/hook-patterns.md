# Hook 模式

## useMarkers

**职责：** 地点 CRUD、localStorage 读写、内置样本合并、删除 ID 黑名单。

**关键流程：**

```
loadFromStorage()
  → 读 VERSION_KEY，低于 DATA_VERSION 则 merge 新内置样本
  → finalizeMarkers() 过滤 removedIds + 区划迁移

addMarker / updateMarker / deleteMarker
  → 更新 state → saveToStorage()
  → delete 时写入 removedMarkerIds 缓存
```

**对外 API：**

```javascript
const {
  markers, addMarker, updateMarker, deleteMarker,
  resetToSample, clearAll,
} = useMarkers();
```

## useGallery

**职责：** 影像馆 CRUD、与 markers 双向关联、去重。

**关键函数：**

- `syncImagesFromMarker(markerId, markerName, images, location)` — App.jsx 在增改 marker 后调用
- `removeMarkerRelation(markerId)` — 删 marker 时清理关联
- `markerImageAlreadyInGallery()` — 按 Base64 data 去重

## useSearch

**职责：** 纯派生筛选，不持久化。

**筛选链：**

```
markers
  → activeFilters (spot/event/inscription)
  → selectedRegionKeys (三级地区树)
  → onThisDayActive
  → searchQuery (名称/标题/描述/地区/标签)
  → filteredMarkers
```

## Context 层

- `QuotesProvider` + `useQuotes` — 内置 + 用户语录
- `ArchivesProvider` + `useArchives` — 内置档案浏览

## App.jsx 编排要点

1. 所有 hook 在 App 顶层实例化
2. 图片同步逻辑集中在 `handleAddMarker` / `handleUpdateMarker`
3. 面板用 lazy + Suspense 按需加载
4. `mapRef` 传给 Sidebar / Map 做 flyTo 联动
