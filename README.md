<div align="center">

# 江泽民同志生平纪念地图

**把足迹、事件、题字与影像、语录、档案，串在同一张交互式地图上。**

[![在线体验 →](https://img.shields.io/badge/在线体验-jzm--memorial--map.vercel.app-1d4ed8?style=for-the-badge&logo=vercel&logoColor=white)](https://jzm-memorial-map.vercel.app)

*非营利纪念项目 · React + Leaflet · 部署于 Vercel*

</div>

---

## 这是什么

江泽民同志的生平资料散落在坐标、报道、讲话、题字影像各处——普通访客很难在**空间**和**时间**上把它们串起来。

这个项目做一件事：**打开地图，就能看见「何时、何地、发生了什么」**，再从任意一个点延伸到影像、语录与档案原文。

界面力求**庄重、清晰、可溯源**；不做 Wiki 式自由编辑，也不做社交化功能。

---

## 在这里你可以……

| | |
|:---:|:---|
| 🗺️ | **浏览地图** — 足迹 / 历史事件 / 题字三类标点；缩放时自动调整大小，点选后智能聚焦 |
| 🔍 | **搜索与筛选** — 关键词、类型、**地区三级树**、「历史上的今天」 |
| 📍 | **精准定位** — OSM 底图 + **高德 POI 搜索**（国内机构名可搜）；坐标自动转换，落点不偏 |
| 📷 | **影像馆** — 独立图库，与地点双向关联；WebP 压缩，全屏查看 |
| 💬 | **长者语录** — 顶栏随机轮播 + 语录面板；内置与用户添加内容 |
| 📜 | **档案馆** — 长文献、外链与配图，可检索浏览 |
| 🌐 | **多语言界面** — 简中 / 繁中 / 英 / 法 / 日 / 俄 / 德 / 西（用户内容保持原文） |
| 📋 | **更新日志** — 产品历程与版本说明（含一点彩蛋） |

> 访客默认**只读浏览**。协作者可通过 Git 维护官方内置数据；配置 Supabase 后支持登录、待审投稿与后台管理（见 [后台配置指南](./docs/ADMIN_SETUP.md)）。

---

## 我们坚持的原则

- **可溯源** — 尽量标注来源；没有依据的日期与描述留空，不臆造
- **向后兼容** — 数据结构演进不破坏已有本地数据
- **简洁庄重** — 功能服务于纪念与教育，避免娱乐化交互

---

## 路线图 · 一眼看懂

```
✅ 已完成     地图核心 · 影像馆 · 语录 · 档案 · i18n · 高德搜索
🔄 进行中     官方内容持续扩充（Git 维护 + 部署）
🔜 规划中     上云完善 · 导览 Agent（只读起步）· 寄语模式（资料充足后）
```

详细里程碑、验收标准与 Agent 三阶段设计 → **[产品需求文档 PRD](./docs/PRD.md)**

日常想法与完成记录 → **[NOTES.md](./NOTES.md)**

---

## 文档

| 文档 | 适合谁 | 内容 |
|------|--------|------|
| [**PRD**](./docs/PRD.md) | 产品 / 协作者 | 完整功能清单、数据模型、路线图、边界说明 |
| [**NOTES**](./NOTES.md) | 维护者 | 待办、灵感、迭代流水 |
| [**ADMIN_SETUP**](./docs/ADMIN_SETUP.md) | 部署者 | Supabase、登录、协作者、Storage 迁移 |
| [**CLAUDE.md**](./CLAUDE.md) | 开发者 / AI | 代码结构与开发速查 |

---

## 本地开发

```bash
git clone https://github.com/BruzeLam/jzm-memorial-map.git
cd jzm-memorial-map
npm install
cp .env.example .env.local   # 按需填写 Supabase、高德 Key 等
npm start
```

推送到 `main` 后，Vercel 自动构建部署。

环境变量说明见 [`.env.example`](./.env.example)。

---

## 技术栈

React · Leaflet · OpenStreetMap · 高德 Web 服务（地点搜索）· Tailwind · Supabase（可选）· Vercel

---

<div align="center">

**[立即打开地图 →](https://jzm-memorial-map.vercel.app)**

</div>
