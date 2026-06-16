<!-- 首页视觉：暖色纸感 + 历史地图色调 · GitHub 支持 table bgcolor / 部分 inline style -->

<div align="center">

<img src="./public/logo.png" alt="" width="72" height="72" style="border-radius: 12px; border: 2px solid #c9a86c;" />

# 历史人物纪念地图

**把足迹、事件、题字与影像、语录、档案，串在同一张交互式地图上。**

<br/>

<a href="https://jzm-memorial-map.vercel.app">
  <img src="./public/promo/memorial-map-poster.png" alt="江泽民同志生平纪念地图 · 交互式历史足迹地图" width="720" style="border-radius: 8px; border: 1px solid #c9a86c;" />
</a>

<br/>

[![在线演示](https://img.shields.io/badge/在线演示-打开地图-1e3a5f?style=for-the-badge&logo=vercel&logoColor=ffd700)](https://jzm-memorial-map.vercel.app)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-地图-199900?style=flat-square&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-可选-3ecf8e?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![DeepSeek](https://img.shields.io/badge/DeepSeek-智能问-4d6bfe?style=flat-square)](https://platform.deepseek.com/)

<br/>

*可复用的纪念 / 教育向 Web 架构 · React + Leaflet · 部署于 Vercel*

</div>

<br/>

<table width="100%">
<tr>
<td align="center" bgcolor="#f7f2e8">

&nbsp;

**「何时 · 何地 · 发生了什么」** — 在一幅可以缩放、检索、对话的地图上，把散落的坐标与文献重新连起来。

&nbsp;

</td>
</tr>
</table>

<br/>

## 这是什么

历史人物的生平资料往往散落在坐标、报道、讲话、题字影像各处——访客很难在**空间**和**时间**上把它们串起来。

本项目提供一套**可 fork、可换肤、可换数据**的地图产品架构：打开地图即可看见「何时、何地、发生了什么」，再从任意一个点延伸到影像、语录与档案原文。

<table>
<tr>
<td width="50%" valign="top" bgcolor="#faf6ef">

**🏛️ 一个具体实例**

本仓库含该人物的内置内容与线上部署（见顶图）。目录名、环境变量前缀等保留实例标识；**通用产品设计**见 [PRD](./docs/PRD.md)。

</td>
<td width="50%" valign="top" bgcolor="#eef3f8">

**📐 设计取向**

界面**庄重、清晰、可溯源**；不做 Wiki 式自由编辑，也不做社交化功能。适合纪念、教育、个人研究向站点。

</td>
</tr>
</table>

---

## 在这里你可以……

<table width="100%">
<tr>
<td width="33%" valign="top" bgcolor="#faf6ef">

### 🗺️ 浏览地图

足迹 / 历史事件 / 题字三类标点；缩放自适应，点选智能聚焦；**横向无缝循环**浏览世界地图。

</td>
<td width="33%" valign="top" bgcolor="#f7f2e8">

### 🤖 智能问

侧栏 **搜索 / 智能问** 切换；自然语言提问，全库检索 + AI 归纳；支持汇总统计与一键跳转地图。

</td>
<td width="33%" valign="top" bgcolor="#faf6ef">

### 🔍 搜索筛选

关键词、类型、**地区三级树**、「历史上的今天」；高德 POI 辅助国内落点。

</td>
</tr>
<tr>
<td width="33%" valign="top" bgcolor="#eef3f8">

### 📷 影像馆

独立图库，与地点双向关联；WebP 压缩，全屏查看。

</td>
<td width="33%" valign="top" bgcolor="#faf6ef">

### 💬 语录 · 📜 档案

顶栏轮播 + 面板浏览；长文献、外链与配图，可检索。

</td>
<td width="33%" valign="top" bgcolor="#eef3f8">

### 🌐 多语言

简 / 繁 / 英 / 法 / 日 / 俄 / 德 / 西界面；用户录入内容保持原文。

</td>
</tr>
</table>

> 访客默认**只读浏览**。协作者可通过 Git 维护官方数据；配置 Supabase 后支持登录、待审投稿与后台（见 [ADMIN_SETUP](./docs/ADMIN_SETUP.md)）。**智能问**需配置 `DEEPSEEK_API_KEY`（见 [`.env.example`](./.env.example)）。

---

## 最近更新 · 2026-06-16

<table width="100%">
<tr>
<td bgcolor="#f7f2e8">

| | |
|:---:|:---|
| 🤖 | **智能问 MVP** — 侧栏内联对话；云端 + 内置**全量标点**合并检索；自然语言 / 汇总统计 / 地图跳转 |
| 🌏 | **外交行程数据** — 1990–2002 外事足迹与在华多边会议等批量录入（国内部分协作者共建中） |
| 🗺️ | **地图无缝循环** — `worldCopyJump` + 智能 `flyTo` |
| ⚡ | **首屏优化** — 缓存优先、重型面板 `React.lazy` 按需加载 |

</td>
</tr>
</table>

---

## 复用到其他人物

| 步骤 | 说明 |
|:--:|:---|
| **1** | **Fork** — 替换 `src/utils/constants.js`、`src/data/*` 内置内容 |
| **2** | **品牌** — 标题、Logo、favicon；可选 [PORTFOLIO 中性演示](./docs/PORTFOLIO.md) |
| **3** | **部署** — Vercel + Supabase；高德 Key、邮件登录等按需配置 |
| **4** | **规格** — 功能边界与路线图以 [PRD](./docs/PRD.md) 为准 |

---

## 我们坚持的原则

<table>
<tr>
<td align="center" bgcolor="#faf6ef" width="33%">

**可溯源**

尽量标注来源；无依据则留空，不臆造

</td>
<td align="center" bgcolor="#f7f2e8" width="33%">

**向后兼容**

数据结构演进不破坏已有本地数据

</td>
<td align="center" bgcolor="#faf6ef" width="33%">

**简洁庄重**

服务于纪念与教育，避免娱乐化

</td>
</tr>
</table>

---

## 路线图

<table width="100%">
<tr>
<td bgcolor="#eef3f8">

```
✅ 已完成    地图核心 · 影像馆 · 语录 · 档案 · i18n · 高德搜索 · 智能问 MVP
🔄 进行中    官方内容扩充（外交较完整；国内足迹协作者共建）
🔜 规划中    寄语模式 · Agent 二期 · 语录/档案纳入智能问检索
```

详细里程碑 → **[PRD](./docs/PRD.md)** · 日常记录 → **[NOTES.md](./NOTES.md)**

</td>
</tr>
</table>

---

## 文档

| 文档 | 适合谁 | 内容 |
|------|--------|------|
| [**PRD**](./docs/PRD.md) | 产品 / 协作者 | 功能清单、数据模型、路线图 |
| [**NOTES**](./NOTES.md) | 维护者 | 待办、灵感、迭代流水 |
| [**ADMIN_SETUP**](./docs/ADMIN_SETUP.md) | 部署者 | Supabase、登录、协作者、Storage |
| [**PORTFOLIO**](./docs/PORTFOLIO.md) | 演示 / 面试 | 中性品牌作品集模式 |
| [**CLAUDE.md**](./CLAUDE.md) | 开发者 / AI | 代码结构与开发速查 |

---

## 本地开发

```bash
git clone https://github.com/BruzeLam/jzm-memorial-map.git
cd jzm-memorial-map
npm install
cp .env.example .env.local   # Supabase、高德 Key、DEEPSEEK_API_KEY 等
npm start                    # 前端（不含 /api）
npx vercel dev               # 本地测智能问
```

推送到 `main` 后 Vercel 自动部署。环境变量说明 → [`.env.example`](./.env.example)

---

<div align="center">

<table>
<tr>
<td align="center" bgcolor="#1e3a5f">

&nbsp;

**[ 🌐 打开在线实例 → jzm-memorial-map.vercel.app ](https://jzm-memorial-map.vercel.app)**

<br/>

<sub><font color="#c9a86c">React · Leaflet · OpenStreetMap · 高德 · Tailwind · Supabase · Vercel · DeepSeek</font></sub>

&nbsp;

</td>
</tr>
</table>

</div>
