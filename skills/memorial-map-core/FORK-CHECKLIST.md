# Fork 复用检查清单

复制本清单到 Issue / PR，逐项勾选。

## A. 品牌与标识

- [ ] `src/config/branding.js` — `siteTitle`、`getStorageKeys()` 前缀、`milestoneDate`
- [ ] `public/logo.png`、`public/favicon.png`
- [ ] `docs/github-hero.svg`、`README.md` 标题与演示链接
- [ ] `package.json` `name`（可选）

## B. 内置数据

- [ ] `src/utils/constants.js` — `SAMPLE_MARKERS`、递增 `DATA_VERSION`
- [ ] `src/data/quotes.js`
- [ ] `src/data/archives.js`
- [ ] `src/data/itineraryMarkers*.js`（若有大批量行程）
- [ ] 删除或替换实例专属 `removedMarkers` 缓存逻辑中的硬编码 ID（如有）

## C. 验证

- [ ] `npm start` 本地可浏览
- [ ] `npm run build` 无报错
- [ ] 添加/编辑地点、影像馆同步、搜索筛选正常
- [ ] 历史上的今天（若有当日数据）弹窗正常

## D. 部署

- [ ] GitHub 仓库 + Vercel 项目
- [ ] Push `main` 自动部署成功
- [ ] 自定义域名（可选）

## E. 可选 · 上云（Phase 2）

- [ ] 新建 Supabase 项目，执行 `supabase/schema.sql` + migrations
- [ ] Vercel 配置 `REACT_APP_SUPABASE_*`、`REACT_APP_ADMIN_EMAIL`
- [ ] Resend SMTP 或邮件登录（见 ADMIN_SETUP）
- [ ] `/admin` 登录、地点 CRUD、待审 `/admin/review`

## F. 可选 · 增强

- [ ] `AMAP_WEB_SERVICE_KEY` + `/api/amap` 国内 POI
- [ ] `DEEPSEEK_API_KEY` + 侧栏智能问
- [ ] `REACT_APP_PORTFOLIO_MODE=true` 作品集演示站

## 不要做的事

- 不要未经需求删除 `DATA_VERSION` 合并逻辑  
- 不要跳过 GCJ-02 → WGS-84 直接落高德坐标到 OSM  
- 不要在无依据时批量编造标记日期与描述  
