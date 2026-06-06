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

会创建表 `markers`、`gallery`、`site_meta`，并设置：

- 所有人 **SELECT**（公开只读）
- 仅 admin 邮箱 **INSERT/UPDATE/DELETE**

## 3. 配置 Auth

1. **Authentication → Providers → Email**：开启 Email  
2. **Authentication → URL Configuration**：
   - Site URL：`https://你的域名`（本地开发可填 `http://localhost:3000`）
   - Redirect URLs 增加：
     - `http://localhost:3000/admin`
     - `https://你的域名/admin`

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
3. 在 **概览** 页点击 **「导入内置数据到云端」**  
   - 写入全部 `SAMPLE_MARKERS` 及关联影像  
4. 刷新首页，地图应从云端只读加载

## 6. 日常使用

| 地址 | 用途 |
|------|------|
| `/` | 公众地图（云端只读） |
| `/admin` | 后台概览、导入、统计 |
| `/admin/markers` | 地点列表 / 编辑 / 删除 / 新建 |

Git 仍可用于维护官方样本；改完 `constants.js` 后可在后台再次「导入」覆盖同 id 记录，或直接在后台编辑。

## 7. 安全说明

- 写权限由 Supabase **RLS** 按 JWT 邮箱约束，务必保证 SQL 中 admin 邮箱正确  
- 勿将 `service_role` key 放入前端环境变量  
- 后台路径 `/admin` 无 obscurity 保护，依赖 Auth + RLS；后续可加 IP 限制或二次验证
