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

## Vercel 部署（推荐：独立项目）

1. 在 Vercel 新建项目，连接同一 GitHub 仓库 `BruzeLam/jzm-memorial-map`
2. 设置项目名如 `elder-legacy-map`（域名如 `elder-legacy-map.vercel.app`）
3. 在 **Environment Variables** 中添加：

   ```
   REACT_APP_PORTFOLIO_MODE=true
   REACT_APP_PORTFOLIO_DEMO_DATA=true
   ```

4. 部署完成后，主站与作品集站互不影响

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
