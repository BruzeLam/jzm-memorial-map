# 数据模型

## 1. Marker（地点标记）

**localStorage 键：** `{prefix}_memorial_markers`  
**版本键：** `{prefix}_memorial_data_version`

```typescript
interface Marker {
  id: string;                    // 唯一，如 spot_001
  type: 'spot' | 'event' | 'inscription';
  name: string;
  latitude: number;              // WGS84
  longitude: number;
  country?: string;
  province?: string;
  city?: string;
  date?: string;                 // ISO 或 YYYY-MM，可空
  endDate?: string;
  title?: string;
  description?: string;
  tripSummary?: string;
  tags?: string[];
  sources?: { title: string; note?: string }[];
  images?: { data: string; name?: string }[];  // Base64 WebP
  color?: string;
  icon?: string;
}
```

## 2. Gallery Item（影像）

**键：** `{prefix}_gallery_images`  
**版本：** `GALLERY_DATA_VERSION = 2`

```typescript
interface GalleryItem {
  id: string;
  data: string;                  // Base64
  name?: string;
  title?: string;
  description?: string;
  location?: {
    country?: string;
    province?: string;
    city?: string;
    address?: string;
    latitude?: number | string;
    longitude?: number | string;
  };
  relatedMarker?: string;
  uploadTime: string;            // ISO
}
```

## 3. Quote（语录）

**内置：** `src/data/quotes.js`  
**运行时键：** `{prefix}_all_quotes`

```typescript
interface Quote {
  id: string;
  text: string;
  source?: string;
  context?: string;
  isUserAdded?: boolean;
}
```

## 4. Archive（档案）

**内置：** `src/data/archives.js`

```typescript
interface Archive {
  id: string;
  title: string;
  text: string;
  source?: string;
  tags?: string[];
  links?: { title: string; url: string }[];
  images?: { data?: string; url?: string; caption?: string }[];
}
```

## 5. 版本迁移

- 递增 `DATA_VERSION` → `useMarkers` 合并新内置样本到用户 localStorage
- 递增 `GALLERY_DATA_VERSION` → `useGallery` 执行 dedupe 等迁移
- 永不复活已删除 ID（`removedMarkerIds` 缓存）
