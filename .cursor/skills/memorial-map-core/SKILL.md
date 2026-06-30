---
name: memorial-map-core
description: >-
  Fork and customize the Historical Memorial Map product architecture (React + Leaflet):
  markers, gallery sync, quotes, archives, i18n, optional Supabase cloud and Agent.
  Use when forking jzm-memorial-map, building a similar 纪念地图/足迹地图, replacing branding or built-in data,
  or asking how to reuse this repo's structure.
---

# 历史人物纪念地图 · 可复用产品 Skill（memorial-map-core）

> **目标**：让 Agent 帮用户 **Fork 本仓库 → 换品牌与数据 → 可选上云**，复用已验证的产品结构。  
> **参考实例**：[BruzeLam/jzm-memorial-map](https://github.com/BruzeLam/jzm-memorial-map)  
> **详细文档**：同仓库 `skills/memorial-map-core/` 目录（架构、数据模型、模式库）

## 何时启用

- 用户要 **fork / 复用 / 二次开发** 本纪念地图结构
- 为新历史人物搭建「地图 + 影像 + 语录 + 档案」站点
- 询问 **改哪些文件**、**storage key**、**上云**、**作品集演示模式**

## 产品是什么（一句话）

**交互式地图**串联 **足迹 / 事件 / 题字** 三类标点，辅以 **影像馆、语录、档案、历史上的今天、智能问**；访客只读，协作者 Git 或 Supabase 维护官方数据。

## 能力分层（Fork 时按需启用）

| 层 | 能力 | 关键路径 |
|----|------|----------|
| **Core** | localStorage、内置样本、搜索筛选、影像双向同步 | `hooks/useMarkers.js`、`App.jsx` sync |
| **Cloud** | Supabase 上云、登录、待审、Storage、Admin | `docs/ADMIN_SETUP.md`、`src/admin/` |
| **Agent** | 侧栏智能问、DeepSeek RAG | `api/chat.js`、`DEEPSEEK_API_KEY` |
| **Portfolio** | 中性品牌演示站 | `REACT_APP_PORTFOLIO_MODE`、`docs/PORTFOLIO.md` |

Core 层即可独立运行；Cloud / Agent 为可选扩展，**不要**在最小 Fork 里强行引入。

## Fork 执行清单（Agent 按序完成）

```
- [ ] 1. Clone / Fork 仓库，npm install
- [ ] 2. 改 branding：src/config/branding.js（标题、storage 前缀、里程碑）
- [ ] 3. 换内置数据：constants.js SAMPLE_MARKERS、data/quotes.js、data/archives.js
- [ ] 4. 换 public/logo.png、favicon、docs/github-hero.svg（可选）
- [ ] 5. 递增 DATA_VERSION / GALLERY_DATA_VERSION（若改内置标点或影像逻辑）
- [ ] 6. npm start && npm run build 通过
- [ ] 7. Push main → Vercel 部署
- [ ] 8.（可选）Supabase + .env.local，见 ADMIN_SETUP
- [ ] 9.（可选）AMAP Key、DEEPSEEK_API_KEY
```

模板文件：`skills/memorial-map-core/templates/branding.template.js`、`constants.template.js`

## 必改文件速查

| 文件 | 作用 |
|------|------|
| `src/config/branding.js` | 站点名、localStorage 前缀、导出前缀、里程碑文案 |
| `src/utils/constants.js` | `MARKER_TYPES`、`SAMPLE_MARKERS`、`DATA_VERSION` |
| `src/data/quotes.js` / `archives.js` | 内置语录、档案 |
| `src/data/itineraryMarkers*.js` | 大批量行程内置点（可选拆分 dynamic import） |
| `src/i18n/messages.js` | UI 文案（用户录入内容不翻译） |
| `.env.example` | Supabase、高德、DeepSeek 说明 |

## 标记类型（固定三种，可改但需全站同步）

| type | 含义 | 默认色 |
|------|------|--------|
| `spot` | 足迹 | `#1E88E5` |
| `event` | 历史事件 | `#D32F2F` |
| `inscription` | 题字 | `#F57F17` |

字段定义 → `skills/memorial-map-core/DATA-MODELS.md`

## 关键模式（不可删改逻辑时先读）

| 模式 | 说明 | 文档 |
|------|------|------|
| 影像 ↔ 地点同步 | 地点增改图自动进影像馆；影像可关联 relatedMarker | `patterns/gallery-sync.md` |
| DATA_VERSION 合并 | 内置新点 merge 进老用户 localStorage | `patterns/hook-patterns.md` |
| removed_marker_ids | 超管删内置点不复活 | `useMarkers.js` |
| GCJ-02 → WGS-84 | 高德 POI 落 OSM 底图 | `api/amap/`、`coordTransform.js` |
| 地图横向循环 | worldCopyJump + mapWrap | `patterns/map-interaction.md` |

## 内容红线

1. **可溯源**：尽量填 `sources`，无依据留空  
2. **不编造**日期、地点、事件  
3. **庄重调性**：不做 Wiki 自由编辑、社交 Feed、娱乐化交互  
4. **向后兼容**：改内置数据结构时升版本号  

## 国内 / 部署注意

- 底图：OpenStreetMap；国内 POI：**高德 Web 服务**（Key 走 `/api/amap` 代理，勿暴露服务端 Key）  
- 部署：Vercel push `main` 自动构建  
- 作品集：`npm run start:portfolio` 或 `REACT_APP_PORTFOLIO_MODE=true`  

## 延伸阅读（按需打开）

| 文档 | 内容 |
|------|------|
| [SETUP.md](../../skills/memorial-map-core/SETUP.md) | 搭建步骤、Storage、图片、FAQ |
| [ARCHITECTURE.md](../../skills/memorial-map-core/ARCHITECTURE.md) | 分层与模块关系 |
| [DIRECTORY-STRUCTURE.md](../../skills/memorial-map-core/DIRECTORY-STRUCTURE.md) | 目录树 |
| [docs/PRD.md](../../docs/PRD.md) | 通用产品规格 |
| [docs/ADMIN_SETUP.md](../../docs/ADMIN_SETUP.md) | Supabase 与协作者 |
| [docs/PORTFOLIO.md](../../docs/PORTFOLIO.md) | 中性演示站 |

## Agent 输出约定

帮用户 Fork 时：

1. 先确认目标人物与 **是否要上云 / 智能问**  
2. 给出 **具体文件 diff 范围**，避免无关重构  
3. 提醒 **storage 前缀** 与 **DATA_VERSION**  
4. 中文交流；commit message 与仓库现有风格一致  
