# 影像馆双向同步

## 地点 → 影像馆

在 `App.jsx`：

```javascript
const handleAddMarker = (data) => {
  const newMarker = addMarker(data);
  if (data.images?.length > 0) {
    syncImagesFromMarker(newMarker.id, data.name, data.images, {
      country: data.country,
      province: data.province,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
    });
  }
};

const handleUpdateMarker = (data) => {
  updateMarker(editingMarker.id, data);
  if (data.images?.length > 0) {
    syncImagesFromMarker(editingMarker.id, data.name, data.images, { /* location */ });
  }
};
```

`syncImagesFromMarker` 内部：
1. 遍历 images
2. `markerImageAlreadyInGallery(gallery, img.data, markerId)` 跳过重复
3. push 新 GalleryItem，`relatedMarker = markerId`

## 影像馆 → 地点

`GalleryImageEditor` 提供地点下拉，保存时更新 `relatedMarker` 字段。

## 删除联动

```javascript
const handleDeleteMarker = (id) => {
  deleteMarker(id);
  removeMarkerRelation(id); // 清除 gallery 中的 relatedMarker 引用
};
```

## 压缩规范

`utils/imageCompression.js`：
- Canvas 绘制 → `toBlob('image/webp', 0.85)`
- 长边 max 1200px 等比缩放
- 返回 `{ data: base64, name, originalSize, compressedSize }`
