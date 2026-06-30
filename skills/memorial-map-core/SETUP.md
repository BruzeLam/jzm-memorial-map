# 搭建指南

## 最小可运行路径

1. Clone 仓库并 `npm install`
2. 修改 `src/config/branding.js` 中的 `getStorageKeys()` 前缀（如 `myhero_`）和 `getBranding()` 文案
3. 替换 `src/utils/constants.js` 中 `SAMPLE_MARKERS`（保留 `MARKER_TYPES` 结构）
4. 替换 `src/data/quotes.js`、`src/data/archives.js`
5. `npm start` 验证 → push → Vercel 部署

## Storage Key 命名

所有 localStorage 键通过 `getStorageKeys()` 统一前缀，避免多实例冲突：

```javascript
// branding.js
return {
  markers: '{prefix}_memorial_markers',
  markersVersion: '{prefix}_memorial_data_version',
  gallery: '{prefix}_gallery_images',
  quotes: '{prefix}_all_quotes',
  archives: '{prefix}_all_archives',
  // ...
};
```

## 内置数据 vs 用户数据

| 来源 | 行为 |
|------|------|
| `constants.js` SAMPLE_MARKERS | 首次加载合并；版本升级时补新 ID |
| 用户 localStorage | 本机增删改；不影响其他访客 |
| 删除 ID 缓存 | 内置样本也不会复活 |

## 图片工作流

1. 用户选图 → `compressImage(file)` → Base64 WebP
2. 写入 marker.images → 自动 sync 到 gallery
3. 影像馆编辑可改 title / description / relatedMarker

## 国内地点搜索（可选）

- 配置 `REACT_APP_AMAP_KEY`（前端）+ Vercel `AMAP_WEB_KEY`（服务端代理）
- GCJ-02 坐标需转 WGS-84 再落 OSM 底图
- 未配置时回退 OpenStreetMap Nominatim

## 多语言

- UI 文案：`src/i18n/messages.js` 等
- 用户录入内容（标记名、描述）**不**随语言切换

## 常见问题

**Q: 改内置数据后老用户看不到新点？**  
A: 递增 `DATA_VERSION`，`useMarkers` 会自动 merge 新 ID。

**Q: 图片太大 localStorage 爆？**  
A: 确保走 `imageCompression.js`；单图建议 < 200KB WebP。

**Q: 想换成自己的三种类型？**  
A: 改 `MARKER_TYPES` 即可，但需同步 FilterPanel、图例、表单校验。
