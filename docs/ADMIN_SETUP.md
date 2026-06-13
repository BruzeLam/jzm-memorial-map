# 江迹管理后台 · 上云配置

MVP：仅**一个超级管理员**（你的邮箱），邮箱魔法链接登录；访客无门槛只读；数据存 Supabase。

## 1. 创建 Supabase 项目

1. 打开 [supabase.com](https://supabase.com) 新建项目  
2. **Project Settings → API** 复制：
   - Project URL → `REACT_APP_SUPABASE_URL`
   - anon public key → `REACT_APP_SUPABASE_ANON_KEY`

## 2. 执行数据库脚本

在 Supabase **SQL Editor** 中打开 [`supabase/schema.sql`](../supabase/schema.sql)：

- 将文件中 **`YOUR_ADMIN_EMAIL`** 改成你的管理员邮箱（与下面环境变量一致）
- 执行整段 SQL

会创建表 `markers`、`gallery`、`site_meta`、`quotes`、`archives`，并设置：

- 所有人 **SELECT**（公开只读）
- 仅 admin 邮箱 **INSERT/UPDATE/DELETE**

## 3. 配置 Auth

1. **Authentication → Providers → Email**：开启 Email  
2. **Authentication → URL Configuration**：
   - **Site URL**：`https://jzm-memorial-map.vercel.app`
   - **Redirect URLs**（每行一个，缺一不可）：
     - `https://jzm-memorial-map.vercel.app/`
     - `https://jzm-memorial-map.vercel.app/admin`
     - `https://jzm-memorial-map.vercel.app/admin/login`
     - `http://localhost:3000/`（本地开发）
     - `http://localhost:3000/admin`
     - `http://localhost:3000/admin/login`

**一键脚本（可选）**：在 [Account Tokens](https://supabase.com/dashboard/account/tokens) 创建 Personal Access Token 后：

```bash
SUPABASE_ACCESS_TOKEN=你的token node scripts/configure-supabase-auth.mjs
```

首页点击「添加」发送魔法链接后，需 **`/` 回调** 才能回到地图并进入编辑模式。

## 4. 环境变量

本地复制 `.env.example` 为 `.env.local`：

```bash
REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
REACT_APP_ADMIN_EMAIL=your@email.com
```

Vercel：**Settings → Environment Variables** 同样配置三项（Production / Preview 均可）。

未配置 Supabase 时，站点仍按原逻辑使用 **localStorage + 内置数据**，后台 `/admin` 会提示未配置。

## 5. 首次导入数据

1. 部署或本地 `npm start`（带 `.env.local`）  
2. 打开 **`/admin/login`**，用管理员邮箱收魔法链接登录  
3. **已有旧项目**若建库较早，还需在 SQL Editor 分别执行：
   - `supabase/migration-quotes.sql`（语录表）
   - `supabase/migration-archives.sql`（档案馆表，邮箱改成你的）
4. 在 **概览** 页：
   - 优先点 **「全部上云」**（本浏览器 localStorage → 地点 + 影像 + 语录 + 档案）
   - 或分块恢复：绿色「恢复地点」「上传语录」「上传档案」按钮
5. 刷新首页，地图 / 语录 / 档案馆应从云端只读加载

## 6. 日常使用

| 地址 | 用途 |
|------|------|
| `/` | 公众地图（云端只读） |
| `/admin` | 后台概览、导入、统计 |
| `/admin/markers` | 地点列表 / 编辑 / 删除 / 新建 |
| `/admin/collaborators` | 协作者邀请与管理（仅超级管理员） |

Git 仍可用于维护官方样本；改完 `constants.js` 后可在后台再次「导入」覆盖同 id 记录，或直接在后台编辑。

## 7. 协作者账号（多邮箱编辑）

已有数据库请执行 [`supabase/migration-collaborators.sql`](../supabase/migration-collaborators.sql)：

1. 将 **`YOUR_ADMIN_EMAIL`** 改成与 `REACT_APP_ADMIN_EMAIL` 相同的邮箱  
2. 在 Supabase SQL Editor 执行整段脚本  

会创建 `collaborators` 表、写入你的超级管理员，并将各表写权限从「单邮箱硬编码」改为「协作者列表」。

| 角色 | 权限 |
|------|------|
| **admin** | 编辑全部内容 + `/admin/collaborators` 邀请/移除 |
| **editor** | 编辑地图与后台内容，不可管理账号 |

日常：登录后打开 **`/admin/collaborators`** → 添加协作者邮箱 → 点「发登录链接」让对方首次登录。

> ⚠️ **务必先执行迁移再部署前端**，否则 RLS 仍认旧策略；迁移后若未写入你的邮箱，将失去写权限。

## 8. 安全说明

- 写权限由 Supabase **RLS** 按 JWT 邮箱约束，务必保证 SQL 中 admin 邮箱正确  
- 勿将 `service_role` key 放入前端环境变量  
- 后台路径 `/admin` 无 obscurity 保护，依赖 Auth + RLS；后续可加 IP 限制或二次验证
