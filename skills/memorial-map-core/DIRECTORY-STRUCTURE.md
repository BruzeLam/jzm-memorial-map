# 目录结构

## Core（Fork 必熟悉）

```
src/
├── App.jsx                 # 模块编排、影像同步、面板状态
├── config/branding.js      # 品牌 + storage key 前缀 + PORTFOLIO 模式
├── utils/constants.js      # MARKER_TYPES、SAMPLE_MARKERS、DATA_VERSION
├── components/
│   ├── Header.jsx          # 顶栏、语录轮播、导航
│   ├── Sidebar.jsx         # 搜索、筛选、列表、表单
│   ├── Map.jsx             # Leaflet、标点、flyTo、worldCopyJump
│   ├── DetailPanel.jsx / MarkerDetailModal.jsx
│   ├── GalleryPanel.jsx / QuotesPanel.jsx / ArchivePanel.jsx
│   ├── AddMarkerForm.jsx / FilterPanel.jsx / RegionFilter.jsx
│   └── AccountMenu.jsx     # 登录、语言、本地数据
├── hooks/
│   ├── useMarkers.js       # 地点 CRUD、版本 merge、removed IDs
│   ├── useGallery.js       # 影像馆、双向同步
│   ├── useSearch.js        # 搜索、地区、历史上的今天
│   ├── useQuotes.js / useArchives.js
│   └── useAgentChat.js     # 智能问（可选）
├── data/
│   ├── quotes.js / archives.js
│   └── itineraryMarkers*.js  # 大批量内置行程（dynamic import）
├── i18n/                   # 多语言 UI
└── lib/
    ├── supabase.js / cloudConfig.js
    └── tipTiers.js           # 赞赏文案保留（支付 UI 已移除）
```

## Cloud · Admin（可选 Phase 2）

```
src/admin/          # AdminLayout、Markers、Review、Integrations、Agent
src/services/       # cloudData、submissions、geocoding、pilgrimageVisits
supabase/           # schema.sql、migrations
```

## Serverless（可选）

```
api/
├── chat.js           # 智能问
├── agent-health.js   # Admin 诊断
└── amap/             # 高德 POI / 逆地理代理
```

## 文档与 Skill

```
docs/PRD.md           # 通用产品规格
docs/ADMIN_SETUP.md   # 上云
docs/PORTFOLIO.md     # 作品集模式
skills/memorial-map-core/   # 本 Skill 包
.cursor/skills/memorial-map-core/  # Cursor 加载入口
```
