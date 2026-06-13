# 作品集镜像站部署指南

同一套代码可通过环境变量切换为**中性品牌**的作品集演示站，便于面试展示，且与主站功能保持一致。

## 模式说明

| 环境变量 | 主站（默认） | 作品集站 |
|---------|-------------|---------|
| `REACT_APP_PORTFOLIO_MODE` | 未设置 / `false` | `true` |
| `REACT_APP_PORTFOLIO_DEMO_DATA` | — | `true`（默认，内置演示数据） |

作品集模式会：

- 站点标题改为「伟人足迹互动地图 / ElderMap」
- UI 文案淡化「长者语录」等表述
- localStorage 使用 `elder_*` 前缀，与主站数据隔离
- 默认加载 `src/data/portfolio/` 下的中性演示标点、语录、档案
- 默认不连接生产 Supabase（`isCloudEnabled()` 返回 false）

## 本地预览

```bash
# 作品集模式开发服务器
npm run start:portfolio

# 作品集模式生产构建
npm run build:portfolio
```

也可复制 `.env.portfolio.example` 为 `.env.local` 后运行 `npm start`。

## 线上地址（已配置）

| 站点 | 分支 | 域名 |
|------|------|------|
| 主站 | `main` | https://jzm-memorial-map.vercel.app |
| 作品集 | `portfolio` | **https://elder-legacy-map.vercel.app** |

作品集分支的 Preview 环境变量（仅 `portfolio` 分支）：

```
REACT_APP_PORTFOLIO_MODE=true
REACT_APP_PORTFOLIO_DEMO_DATA=true
```

推送 `portfolio` 分支会自动更新作品集站；`main` 生产环境不受影响。

备用预览 URL：`https://jzm-memorial-map-git-portfolio-bruzelams-projects.vercel.app`

## Vercel 部署（同一项目 + 分支）

当前采用**同一 Vercel 项目**、**独立 Git 分支** + **分支域名**的方案：

1. 代码在 `portfolio` 分支（与 `main` 同步功能，通过 env 切换品牌）
2. Vercel 为 `portfolio` 分支配置 Preview 环境变量（见上）
3. 域名 `elder-legacy-map.vercel.app` 绑定到 `portfolio` 分支

若从零配置，可参考：

1. 创建并推送 `portfolio` 分支
2. Vercel → Environment Variables → Preview → 选择 Git Branch `portfolio`，添加上述两个变量
3. Vercel → Domains → 添加 `elder-legacy-map.vercel.app` 并指定 Git Branch 为 `portfolio`

### 旧方案：独立 Vercel 项目

也可新建独立项目连接同一仓库，仅在该项目设置 `REACT_APP_PORTFOLIO_MODE=true`。

### 可选：作品集站也演示云端能力

若需在作品集中展示 Supabase 上云 + 超管登录：

1. 新建**独立** Supabase 项目（勿使用生产库）
2. 执行 `supabase/schema.sql` 及 migration
3. 配置环境变量：

   ```
   REACT_APP_PORTFOLIO_MODE=true
   REACT_APP_PORTFOLIO_DEMO_DATA=false
   REACT_APP_SUPABASE_URL=...
   REACT_APP_SUPABASE_ANON_KEY=...
   REACT_APP_ADMIN_EMAIL=...
   ```

4. 在 Supabase Auth 的 Redirect URLs 中加入作品集域名

## 面试话术建议

- 强调：**React + Leaflet 交互地图**、**Supabase 云端 CRUD**、**魔法链接鉴权**、**影像馆双向同步**、**多语言与响应式**
- 作品集站使用中性历史地理演示数据，技术栈与主站一致
- 主站为完整内容项目，作品集为脱敏展示版本
