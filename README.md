<div align="center">

# 历史人物纪念地图

**把足迹、事件、题字与影像、语录、档案，串在同一张交互式地图上。**

[![在线演示 →](https://img.shields.io/badge/在线演示-当前实例-1d4ed8?style=for-the-badge&logo=vercel&logoColor=white)](https://jzm-memorial-map.vercel.app)

*可复用的纪念 / 教育向 Web 架构 · React + Leaflet · 部署于 Vercel*

</div>

---

## 这是什么

历史人物的生平资料往往散落在坐标、报道、讲话、题字影像各处——访客很难在**空间**和**时间**上把它们串起来。

本项目提供一套**可 fork、可换肤、可换数据**的地图产品架构：打开地图即可看见「何时、何地、发生了什么」，再从任意一个点延伸到影像、语录与档案原文。

> **关于本仓库**：这是上述架构的**一个具体实例**（含该人物的内置内容与线上部署）。代码中的目录名、环境变量前缀等仍保留实例标识；**产品与功能设计**见 [PRD](./docs/PRD.md)，与具体人物无关的部分可直接复用到其他人物。

界面力求**庄重、清晰、可溯源**；不做 Wiki 式自由编辑，也不做社交化功能。

---

## 在这里你可以……

| | |
|:---:|:---|
| 🗺️ | **浏览地图** — 足迹 / 历史事件 / 题字三类标点；缩放时自动调整大小，点选后智能聚焦 |
| 🔍 | **搜索与筛选** — 关键词、类型、**地区三级树**、「历史上的今天」 |
| 🤖 | **智能问** — 侧栏搜索框内切换；自然语言提问，基于**全库标点**检索 + AI 归纳回答，可跳转地图 |
| 📍 | **精准定位** — OSM 底图 + **高德 POI 搜索**（国内机构名可搜）；坐标自动转换，落点不偏 |
| 📷 | **影像馆** — 独立图库，与地点双向关联；WebP 压缩，全屏查看 |
| 💬 | **语录** — 顶栏随机轮播 + 语录面板；内置与用户添加内容 |
| 📜 | **档案馆** — 长文献、外链与配图，可检索浏览 |
| 🌐 | **多语言界面** — 简中 / 繁中 / 英 / 法 / 日 / 俄 / 德 / 西（用户内容保持原文） |
| 📋 | **更新日志** — 产品历程与版本说明 |

> 访客默认**只读浏览**。协作者可通过 Git 维护官方内置数据；配置 Supabase 后支持登录、待审投稿与后台管理（见 [后台配置指南](./docs/ADMIN_SETUP.md)）。**智能问**需在 Vercel 配置 `DEEPSEEK_API_KEY`（见 [`.env.example`](./.env.example)）。

---

## 最近更新 · 2026-06-16

- **🤖 智能问（导览 Agent MVP）** — 侧栏「搜索 / 智能问」分段切换，对话内联展示；服务端读取**云端 + 内置全量标点**（与地图侧栏一致），支持自然语言、汇总统计（如到访国家数）、地图跳转
- **🗺️ 地图横向无缝循环** — `worldCopyJump`，拖动可卷轴式循环；标点 flyTo 走最近路径
- **⚡ 首屏加载优化** — 缓存优先、重型面板按需加载（`React.lazy`）
- **📦 外交行程数据** — 1990–2002 外事足迹与在华多边会议等批量录入（持续由协作者补充国内部分）

---

## 复用到其他人物

| 步骤 | 说明 |
|------|------|
| 1. Fork | 复制本仓库，替换 `src/utils/constants.js`、`src/data/*` 中的内置内容 |
| 2. 品牌 | 修改标题、Logo、favicon；可选开启 `REACT_APP_PORTFOLIO_MODE` 中性演示（见 [PORTFOLIO.md](./docs/PORTFOLIO.md)） |
| 3. 部署 | 连接 Vercel / Supabase；按需配置高德 Key、邮件登录等 |
| 4. 规格 | 功能边界、数据模型、路线图以 [PRD](./docs/PRD.md) 为准 |

---

## 我们坚持的原则

- **可溯源** — 尽量标注来源；没有依据的日期与描述留空，不臆造
- **向后兼容** — 数据结构演进不破坏已有本地数据
- **简洁庄重** — 功能服务于纪念与教育，避免娱乐化交互

---

## 路线图 · 一眼看懂

```
✅ 已完成     地图核心 · 影像馆 · 语录 · 档案 · i18n · 高德搜索 · 智能问 MVP
🔄 进行中     官方内容持续扩充（外交行程较完整；国内足迹协作者共建）
🔜 规划中     寄语模式 · Agent 二期（协作者通过对话改数据）· 语录/档案纳入智能问检索
```

详细里程碑、验收标准与 Agent 三阶段设计 → **[产品需求文档 PRD](./docs/PRD.md)**

日常想法与完成记录 → **[NOTES.md](./NOTES.md)**

---

## 文档

| 文档 | 适合谁 | 内容 |
|------|--------|------|
| [**PRD**](./docs/PRD.md) | 产品 / 协作者 | 通用功能清单、数据模型、路线图（与具体人物解耦） |
| [**NOTES**](./docs/NOTES.md) | 维护者 | 待办、灵感、迭代流水 |
| [**ADMIN_SETUP**](./docs/ADMIN_SETUP.md) | 部署者 | Supabase、登录、协作者、Storage 迁移 |
| [**PORTFOLIO**](./docs/PORTFOLIO.md) | 演示 / 面试 | 中性品牌作品集模式 |
| [**CLAUDE.md**](./CLAUDE.md) | 开发者 / AI | 代码结构与开发速查（含实例路径） |

---

## 本地开发

```bash
git clone https://github.com/BruzeLam/jzm-memorial-map.git
cd jzm-memorial-map
npm install
cp .env.example .env.local   # 按需填写 Supabase、高德 Key 等
npm start                    # 前端开发（不含 /api）
# 本地测智能问需：
# npx vercel dev             # 代理 api/chat
# .env.local 中配置 DEEPSEEK_API_KEY、Supabase、高德 Key 等
```

推送到 `main` 后，Vercel 自动构建部署。

环境变量说明见 [`.env.example`](./.env.example)。

---

## 技术栈

React · Leaflet · OpenStreetMap · 高德 Web 服务（地点搜索）· Tailwind · Supabase（可选）· Vercel · DeepSeek（智能问，可选）

---

<div align="center">

**[打开当前在线实例 →](https://jzm-memorial-map.vercel.app)**

</div>
